import "server-only";
import { prisma } from "@/lib/prisma";
import { computeOrderTotals } from "@/lib/pricing";
import { createPaymentIntent } from "@/lib/payments";
import { ticketCode } from "@/lib/crypto";
import { generateQrToken, qrDataUrl } from "@/lib/qr";
import { sendEmail } from "@/lib/email";
import { ticketConfirmationEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";
import type { CheckoutInput } from "@/lib/validation/schemas";
import { Prisma } from "@prisma/client";

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function getFees() {
  const s = await prisma.platformSetting.findUnique({
    where: { id: "singleton" },
  });
  return {
    platformFeeBps: s?.platformFeeBps ?? 300,
    processingFeeBps: s?.processingFeeBps ?? 290,
    processingFeeFixedCents: s?.processingFeeFixedCents ?? 89,
  };
}

/**
 * Reserve inventory and create a PENDING order in a single transaction.
 * Inventory is decremented atomically with a conditional update so concurrent
 * checkouts can never oversell a tier.
 */
export async function createPendingOrder(userId: string, input: CheckoutInput) {
  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    include: { tiers: true },
  });
  if (!event || event.status !== "PUBLISHED") {
    throw new OrderError("EVENT_UNAVAILABLE", "This event is not on sale.");
  }

  const now = new Date();
  const fees = await getFees();

  // Resolve promo (validated but consumed only on successful payment).
  let promo = null as null | {
    id: string;
    discountType: "PERCENT" | "FIXED";
    amount: number;
  };
  if (input.promoCode) {
    const found = await prisma.promoCode.findFirst({
      where: {
        eventId: event.id,
        code: input.promoCode.toUpperCase(),
        active: true,
      },
    });
    if (!found) throw new OrderError("PROMO_INVALID", "Invalid promo code.");
    if (found.maxUses != null && found.uses >= found.maxUses) {
      throw new OrderError(
        "PROMO_EXHAUSTED",
        "This promo code is no longer available.",
      );
    }
    promo = {
      id: found.id,
      discountType: found.discountType,
      amount: found.amount,
    };
  }

  const order = await prisma.$transaction(async (tx) => {
    const lines: {
      tierId: string;
      unitPriceCents: number;
      quantity: number;
    }[] = [];

    for (const item of input.items) {
      const tier = event.tiers.find((t) => t.id === item.tierId);
      if (!tier) throw new OrderError("TIER_INVALID", "Invalid ticket tier.");

      if (tier.salesStart && tier.salesStart > now)
        throw new OrderError("NOT_ON_SALE", `${tier.name} is not on sale yet.`);
      if (tier.salesEnd && tier.salesEnd < now)
        throw new OrderError(
          "SALES_ENDED",
          `Sales for ${tier.name} have ended.`,
        );
      if (item.quantity > tier.purchaseLimit)
        throw new OrderError(
          "OVER_LIMIT",
          `You can buy at most ${tier.purchaseLimit} × ${tier.name}.`,
        );

      // Atomic conditional reservation: only succeeds if enough remain.
      const reserved = await tx.ticketTier.updateMany({
        where: { id: tier.id, sold: { lte: tier.quantity - item.quantity } },
        data: { sold: { increment: item.quantity } },
      });
      if (reserved.count === 0) {
        throw new OrderError(
          "SOLD_OUT",
          `Not enough tickets remaining for ${tier.name}.`,
        );
      }

      lines.push({
        tierId: tier.id,
        unitPriceCents: tier.priceCents,
        quantity: item.quantity,
      });
    }

    const totals = computeOrderTotals(lines, { promo, fees });

    return tx.order.create({
      data: {
        userId,
        eventId: event.id,
        status: "PENDING",
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        feeCents: totals.feeCents,
        totalCents: totals.totalCents,
        promoCodeId: promo?.id,
        items: {
          create: lines.map((l) => ({
            tierId: l.tierId,
            unitPriceCents: l.unitPriceCents,
            quantity: l.quantity,
          })),
        },
      },
      include: { items: true },
    });
  });

  const intent = await createPaymentIntent({
    amountCents: order.totalCents,
    orderId: order.id,
    metadata: { eventId: event.id, userId },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentIntentId: intent.id },
  });

  return { order, intent };
}

/**
 * Mark an order PAID and issue tickets. Idempotent: safe to call from a webhook
 * that may be retried. Tickets are only ever created here — after verification.
 */
export async function fulfillOrder(orderId: string, paymentRef?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, tickets: true, event: true, user: true },
    });
    if (!order) throw new OrderError("NOT_FOUND", "Order not found.");
    if (order.status === "PAID") return order; // idempotent
    if (order.status !== "PENDING") {
      throw new OrderError("BAD_STATE", `Order is ${order.status}.`);
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date(), paymentRef },
    });

    if (order.promoCodeId) {
      await tx.promoCode.update({
        where: { id: order.promoCodeId },
        data: { uses: { increment: 1 } },
      });
    }

    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        await tx.ticket.create({
          data: {
            code: ticketCode(),
            qrToken: generateQrToken(),
            orderId: order.id,
            eventId: order.eventId,
            tierId: item.tierId,
            userId: order.userId,
            status: "VALID",
          },
        });
      }
    }

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        tickets: { include: { tier: true } },
        event: true,
        user: true,
      },
    });
  });
}

/** Send the confirmation email with embedded QR codes (post-fulfilment). */
export async function sendOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tickets: { include: { tier: true } },
      event: true,
      user: true,
    },
  });
  if (!order || order.status !== "PAID") return;

  const tickets = await Promise.all(
    order.tickets.map(async (t) => ({
      code: t.code,
      tierName: t.tier.name,
      qrDataUrl: await qrDataUrl(t.qrToken),
    })),
  );

  const { subject, html } = ticketConfirmationEmail({
    name: order.user.name,
    eventTitle: order.event.title,
    startsAt: order.event.startsAt,
    venueName: order.event.venueName,
    tickets,
    orderTotalCents: order.totalCents,
    ticketsUrl: `${env.appUrl}/account/tickets`,
  });
  await sendEmail({ to: order.user.email, subject, html });
}

/** Release reserved inventory for an order that will not be paid. */
export async function cancelPendingOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "PENDING") return;
    for (const item of order.items) {
      await tx.ticketTier.update({
        where: { id: item.tierId },
        data: { sold: { decrement: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
  });
}

/** Refund a paid order: mark refunded, void tickets, release inventory. */
export async function refundOrder(
  orderId: string,
  actorId: string,
  opts: { reason?: string } = {},
) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, tickets: true },
    });
    if (!order) throw new OrderError("NOT_FOUND", "Order not found.");
    if (order.status !== "PAID")
      throw new OrderError("BAD_STATE", "Only paid orders can be refunded.");

    // Only release inventory for tickets that were never used.
    for (const item of order.items) {
      const usedInTier = order.tickets.filter(
        (t) => t.tierId === item.tierId && t.status === "CHECKED_IN",
      ).length;
      const release = item.quantity - usedInTier;
      if (release > 0) {
        await tx.ticketTier.update({
          where: { id: item.tierId },
          data: { sold: { decrement: release } },
        });
      }
    }

    await tx.ticket.updateMany({
      where: { orderId: order.id, status: { in: ["VALID"] } },
      data: { status: "REFUNDED" },
    });

    return tx.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });
  });

  await audit({
    actorId,
    action: "order.refund",
    targetType: "order",
    targetId: orderId,
    metadata: { reason: opts.reason ?? null } as Prisma.InputJsonValue,
  });

  return result;
}
