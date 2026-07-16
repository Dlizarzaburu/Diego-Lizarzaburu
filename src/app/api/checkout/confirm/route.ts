import { prisma } from "@/lib/prisma";
import { confirmPaymentSchema } from "@/lib/validation/schemas";
import {
  handler,
  parseBody,
  ok,
  fail,
  limitOrThrow,
  requireApiUser,
} from "@/lib/api";
import { verifyDevPayment } from "@/lib/payments";
import { stripeConfigured, yappyConfigured } from "@/lib/env";
import { fulfillOrder, sendOrderConfirmation } from "@/server/orders";
import { audit } from "@/lib/audit";

// DEV-mode payment confirmation. In production (Stripe), fulfilment happens via
// the verified webhook instead — this endpoint refuses to fulfil when Stripe is
// configured, so tickets are only ever issued after a real provider event.
export const POST = handler(async (req) => {
  limitOrThrow(req, "confirm", { limit: 20, windowSec: 60 });
  const user = await requireApiUser();
  const input = await parseBody(req, confirmPaymentSchema);

  if (stripeConfigured || yappyConfigured) {
    return fail(
      "Live payments are confirmed by the provider webhook, not this endpoint.",
      400,
    );
  }

  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order || order.userId !== user.id) return fail("Order not found.", 404);
  if (order.paymentIntentId !== input.intentId)
    return fail("Payment reference mismatch.", 400);
  if (order.totalCents !== input.amountCents)
    return fail("Amount mismatch.", 400);

  const valid = verifyDevPayment(input);
  if (!valid) return fail("Payment could not be verified.", 402);

  const fulfilled = await fulfillOrder(order.id, `dev:${input.intentId}`);
  await sendOrderConfirmation(order.id);
  await audit({
    action: "order.paid",
    actorId: user.id,
    targetType: "order",
    targetId: order.id,
    metadata: { mode: "dev" },
  });

  return ok({ orderId: fulfilled.id, status: fulfilled.status });
});
