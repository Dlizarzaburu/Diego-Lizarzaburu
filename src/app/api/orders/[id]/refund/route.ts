import { prisma } from "@/lib/prisma";
import { ok, fail, requireApiUser, ApiError } from "@/lib/api";
import { refundOrder, OrderError } from "@/server/orders";
import { refundPayment } from "@/lib/payments";

const REFUND_WINDOW_DAYS = 7;

// Customer-initiated refund. Allowed only when the event permits refunds and
// we're outside the refund window cutoff. Admins have a separate override route.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!order || order.userId !== user.id)
      return fail("Order not found.", 404);
    if (order.status !== "PAID")
      return fail("Only paid orders can be refunded.", 400);
    if (!order.event.refundsAllowed)
      return fail("This event does not allow refunds.", 400);
    if (
      order.event.startsAt.getTime() - Date.now() <=
      REFUND_WINDOW_DAYS * 864e5
    )
      return fail(
        `Refunds close ${REFUND_WINDOW_DAYS} days before the event.`,
        400,
      );

    await refundOrder(order.id, user.id, { reason: "customer_request" });
    if (order.paymentIntentId) await refundPayment(order.paymentIntentId);
    return ok({ refunded: true });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.message, e.status, e.extra);
    if (e instanceof OrderError) return fail(e.message, 400);
    return fail("Refund failed.", 500);
  }
}
