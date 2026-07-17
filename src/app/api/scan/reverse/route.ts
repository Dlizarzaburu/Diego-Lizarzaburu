import { z } from "zod";
import { handler, parseBody, ok, fail, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { assertScannerAccess } from "@/server/access";
import { reverseCheckIn } from "@/server/scan";

const bodySchema = z.object({
  ticketId: z.string().min(1),
  eventId: z.string().min(1),
});

// Supervisors (staff with canReverse, or admins) can undo an accidental check-in.
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const input = await parseBody(req, bodySchema);

  // The event creator must have enabled reverse check-in for this event.
  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    select: { allowReverseCheckIn: true },
  });
  if (!event?.allowReverseCheckIn)
    return fail("Reverse check-in is disabled for this event.", 403);

  const access = await assertScannerAccess(input.eventId, user);
  if (!access.canReverse)
    return fail("Only supervisors can reverse a check-in.", 403);

  const result = await reverseCheckIn({
    ticketId: input.ticketId,
    eventId: input.eventId,
    supervisorId: user.id,
  });
  if (!result.ok) return fail(result.message, 400);
  return ok(result);
});
