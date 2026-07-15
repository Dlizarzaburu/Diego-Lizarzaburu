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
import { audit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email(),
  canReverse: z.boolean().optional(),
});

export const POST = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  await assertEventAccess(id, user);
  const input = await parseBody(req, bodySchema);

  const staffUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (!staffUser)
    return fail("That person needs an S27 Events account first.", 404);

  const assignment = await prisma.staffAssignment.upsert({
    where: { userId_eventId: { userId: staffUser.id, eventId: id } },
    update: { canReverse: input.canReverse ?? false },
    create: {
      userId: staffUser.id,
      eventId: id,
      canReverse: input.canReverse ?? false,
    },
  });
  await audit({
    actorId: user.id,
    action: "staff.invite",
    targetType: "event",
    targetId: id,
    metadata: { staff: staffUser.email, canReverse: assignment.canReverse },
  });
  return ok({ id: assignment.id, name: staffUser.name });
});
