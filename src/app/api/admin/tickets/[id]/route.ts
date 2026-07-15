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
import { audit } from "@/lib/audit";

const bodySchema = z.object({ action: z.enum(["cancel", "resend"]) });

// Admin: cancel or resend an individual ticket.
export const PATCH = route<IdCtx>(async (req, { params }) => {
  const admin = await requireApiRole("ADMIN");
  const { id } = await params;
  const { action } = await parseBody(req, bodySchema);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { tier: true },
  });
  if (!ticket) return fail("Ticket not found.", 404);

  if (action === "cancel") {
    if (ticket.status === "CANCELLED")
      return fail("Ticket is already cancelled.", 400);
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      // Release capacity if it hadn't been used.
      ...(ticket.status === "VALID"
        ? [
            prisma.ticketTier.update({
              where: { id: ticket.tierId },
              data: { sold: { decrement: 1 } },
            }),
          ]
        : []),
    ]);
    await audit({
      actorId: admin.id,
      action: "admin.ticket.cancel",
      targetType: "ticket",
      targetId: id,
    });
    return ok({ status: "CANCELLED" });
  }

  // resend
  const { sendOrderConfirmation } = await import("@/server/orders");
  await sendOrderConfirmation(ticket.orderId);
  await audit({
    actorId: admin.id,
    action: "admin.ticket.resend",
    targetType: "ticket",
    targetId: id,
  });
  return ok({ resent: true });
});
