import "server-only";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import type { EventInput } from "@/lib/validation/schemas";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = slugify(base) || "event";
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${slugify(base)}-${++n}`;
  }
}

export async function createEvent(creatorId: string, input: EventInput) {
  const slug = await uniqueSlug(input.title);
  const event = await prisma.event.create({
    data: {
      slug,
      title: input.title,
      category: input.category,
      description: input.description,
      coverImage: input.coverImage,
      venueName: input.venueName,
      address: input.address,
      mapUrl: input.mapUrl || null,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: input.capacity,
      ageRequirement: input.ageRequirement || null,
      refundPolicy: input.refundPolicy,
      transfersAllowed: input.transfersAllowed,
      refundsAllowed: input.refundsAllowed,
      featured: input.featured ?? false,
      commissionType: input.commissionType ?? "FIXED",
      commissionFeeCents: input.commissionFeeCents ?? 0,
      commissionPercentBps: input.commissionPercentBps ?? 0,
      hideRemaining: input.hideRemaining ?? false,
      consentRequirement: input.consentRequirement ?? "NONE",
      consentFormUrl: input.consentFormUrl || null,
      ticketAccentColor: input.ticketAccentColor || null,
      ticketNote: input.ticketNote || null,
      status: "DRAFT",
      isDemo: false,
      creatorId,
      tiers: {
        create: input.tiers.map((t, i) => ({
          name: t.name,
          description: t.description || null,
          priceCents: t.priceCents,
          quantity: t.quantity,
          purchaseLimit: t.purchaseLimit,
          password: t.password || null,
          color: t.color || null,
          salesStart: t.salesStart ? new Date(t.salesStart) : null,
          salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
          sortOrder: i,
        })),
      },
    },
  });
  await audit({
    actorId: creatorId,
    action: "event.create",
    targetType: "event",
    targetId: event.id,
  });
  return event;
}

export async function updateEvent(
  eventId: string,
  actorId: string,
  input: EventInput,
) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tiers: true },
  });
  if (!existing) throw new Error("Event not found");

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        title: input.title,
        category: input.category,
        description: input.description,
        coverImage: input.coverImage,
        venueName: input.venueName,
        address: input.address,
        mapUrl: input.mapUrl || null,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        capacity: input.capacity,
        ageRequirement: input.ageRequirement || null,
        refundPolicy: input.refundPolicy,
        transfersAllowed: input.transfersAllowed,
        refundsAllowed: input.refundsAllowed,
        commissionType: input.commissionType ?? "FIXED",
        commissionFeeCents: input.commissionFeeCents ?? 0,
        commissionPercentBps: input.commissionPercentBps ?? 0,
        hideRemaining: input.hideRemaining ?? false,
        consentRequirement: input.consentRequirement ?? "NONE",
        consentFormUrl: input.consentFormUrl || null,
        ticketAccentColor: input.ticketAccentColor || null,
        ticketNote: input.ticketNote || null,
      },
    });

    const keepIds = new Set(input.tiers.filter((t) => t.id).map((t) => t.id!));
    // Remove tiers that were deleted AND have no tickets sold.
    for (const tier of existing.tiers) {
      if (!keepIds.has(tier.id) && tier.sold === 0) {
        await tx.ticketTier.delete({ where: { id: tier.id } });
      }
    }
    for (const [i, t] of input.tiers.entries()) {
      if (t.id && existing.tiers.some((e) => e.id === t.id)) {
        await tx.ticketTier.update({
          where: { id: t.id },
          data: {
            name: t.name,
            description: t.description || null,
            priceCents: t.priceCents,
            quantity: t.quantity,
            purchaseLimit: t.purchaseLimit,
            password: t.password || null,
            color: t.color || null,
            salesStart: t.salesStart ? new Date(t.salesStart) : null,
            salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
            sortOrder: i,
          },
        });
      } else {
        await tx.ticketTier.create({
          data: {
            eventId,
            name: t.name,
            description: t.description || null,
            priceCents: t.priceCents,
            quantity: t.quantity,
            purchaseLimit: t.purchaseLimit,
            password: t.password || null,
            color: t.color || null,
            salesStart: t.salesStart ? new Date(t.salesStart) : null,
            salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
            sortOrder: i,
          },
        });
      }
    }
  });

  await audit({
    actorId,
    action: "event.update",
    targetType: "event",
    targetId: eventId,
  });
  return prisma.event.findUnique({ where: { id: eventId } });
}

export async function setEventStatus(
  eventId: string,
  actorId: string,
  status: "PUBLISHED" | "UNPUBLISHED" | "DRAFT",
) {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status },
  });
  await audit({
    actorId,
    action: `event.${status.toLowerCase()}`,
    targetType: "event",
    targetId: eventId,
  });
  return event;
}

export async function duplicateEvent(eventId: string, actorId: string) {
  const src = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tiers: true },
  });
  if (!src) throw new Error("Event not found");
  const slug = await uniqueSlug(`${src.title}-copy`);
  const copy = await prisma.event.create({
    data: {
      slug,
      title: `${src.title} (Copy)`,
      category: src.category,
      description: src.description,
      coverImage: src.coverImage,
      venueName: src.venueName,
      address: src.address,
      mapUrl: src.mapUrl,
      startsAt: src.startsAt,
      endsAt: src.endsAt,
      capacity: src.capacity,
      ageRequirement: src.ageRequirement,
      refundPolicy: src.refundPolicy,
      transfersAllowed: src.transfersAllowed,
      refundsAllowed: src.refundsAllowed,
      status: "DRAFT",
      isDemo: false,
      creatorId: src.creatorId,
      tiers: {
        create: src.tiers.map((t) => ({
          name: t.name,
          description: t.description,
          priceCents: t.priceCents,
          quantity: t.quantity,
          purchaseLimit: t.purchaseLimit,
          sortOrder: t.sortOrder,
        })),
      },
    },
  });
  await audit({
    actorId,
    action: "event.duplicate",
    targetType: "event",
    targetId: copy.id,
    metadata: { from: eventId },
  });
  return copy;
}

/** Issue complimentary tickets (free, no payment) for an event tier. */
export async function issueComplimentary(params: {
  eventId: string;
  tierId: string;
  toEmail: string;
  quantity: number;
  actorId: string;
}) {
  const { ticketCode } = await import("@/lib/crypto");
  const { generateQrToken } = await import("@/lib/qr");

  const recipient = await prisma.user.findUnique({
    where: { email: params.toEmail.toLowerCase() },
  });
  if (!recipient) throw new Error("Recipient must have an account first.");

  const tier = await prisma.ticketTier.findFirst({
    where: { id: params.tierId, eventId: params.eventId },
  });
  if (!tier) throw new Error("Invalid tier.");

  return prisma.$transaction(async (tx) => {
    const reserved = await tx.ticketTier.updateMany({
      where: {
        id: tier.id,
        sold: { lte: tier.quantity - params.quantity },
      },
      data: { sold: { increment: params.quantity } },
    });
    if (reserved.count === 0) throw new Error("Not enough capacity remaining.");

    const order = await tx.order.create({
      data: {
        userId: recipient.id,
        eventId: params.eventId,
        status: "PAID",
        subtotalCents: 0,
        feeCents: 0,
        totalCents: 0,
        isComplimentary: true,
        paidAt: new Date(),
        items: {
          create: [
            { tierId: tier.id, quantity: params.quantity, unitPriceCents: 0 },
          ],
        },
      },
    });
    for (let i = 0; i < params.quantity; i++) {
      await tx.ticket.create({
        data: {
          code: ticketCode(),
          qrToken: generateQrToken(),
          orderId: order.id,
          eventId: params.eventId,
          tierId: tier.id,
          userId: recipient.id,
        },
      });
    }
    await audit({
      actorId: params.actorId,
      action: "ticket.complimentary",
      targetType: "event",
      targetId: params.eventId,
      metadata: { to: recipient.email, quantity: params.quantity },
    });
    return order;
  });
}
