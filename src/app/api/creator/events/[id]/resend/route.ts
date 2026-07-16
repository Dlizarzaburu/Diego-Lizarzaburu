import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  route,
  parseBody,
  ok,
  fail,
  requireApiRole,
  type IdCtx,
} from "@/lib/api";
import { assertEventAccess } from "@/server/access";
import { sendOrderConfirmation } from "@/server/orders";
import { audit } from "@/lib/audit";

const bodySchema = z.object({ orderId: z.string().min(1) });

// Creator/admin: resend the ticket QR email for a buyer's order on their event.
export const POST = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  await assertEventAccess(id, user);
  const { orderId } = await parseBody(req, bodySchema);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.eventId !== id)
    return fail("Order not found for this event.", 404);
  if (order.status !== "PAID")
    return fail("Only paid orders have tickets to resend.", 400);

  await sendOrderConfirmation(orderId);
  await audit({
    actorId: user.id,
    action: "creator.ticket.resend",
    targetType: "order",
    targetId: orderId,
  });
  return ok({ sent: true });
});
