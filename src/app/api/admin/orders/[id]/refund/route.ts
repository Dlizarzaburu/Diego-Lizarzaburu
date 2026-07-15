import { route, ok, fail, requireApiRole, type IdCtx } from "@/lib/api";
import { refundOrder, OrderError } from "@/server/orders";
import { refundPayment } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

// Admin override refund — bypasses the customer refund window/policy.
export const POST = route<IdCtx>(async (_req, { params }) => {
  const admin = await requireApiRole("ADMIN");
  const { id } = await params;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return fail("Order not found.", 404);
    await refundOrder(id, admin.id, { reason: "admin_override" });
    if (order.paymentIntentId) await refundPayment(order.paymentIntentId);
    return ok({ refunded: true });
  } catch (e) {
    if (e instanceof OrderError) return fail(e.message, 400);
    throw e;
  }
});
