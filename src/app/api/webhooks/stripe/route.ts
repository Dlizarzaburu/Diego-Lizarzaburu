import { prisma } from "@/lib/prisma";
import { verifyStripeWebhook } from "@/lib/payments";
import { fulfillOrder, sendOrderConfirmation } from "@/server/orders";
import { audit } from "@/lib/audit";

// Server-side confirmation of payments via Stripe webhooks. Tickets are issued
// here — only after a verified `payment_intent.succeeded` event.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!verifyStripeWebhook(raw, sig)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: {
    type: string;
    data: { object: { id: string; metadata?: { orderId?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    const order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId } })
      : await prisma.order.findFirst({
          where: { paymentIntentId: intent.id },
        });
    if (order) {
      await fulfillOrder(order.id, `stripe:${intent.id}`);
      await sendOrderConfirmation(order.id);
      await audit({
        action: "order.paid",
        targetType: "order",
        targetId: order.id,
        metadata: { mode: "stripe" },
      });
    }
  }

  return new Response("ok", { status: 200 });
}
