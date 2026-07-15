import { z } from "zod";
import {
  route,
  parseBody,
  ok,
  fail,
  requireApiRole,
  type IdCtx,
} from "@/lib/api";
import { assertEventAccess } from "@/server/access";
import { issueComplimentary } from "@/server/creator";

const bodySchema = z.object({
  tierId: z.string().min(1),
  toEmail: z.string().email(),
  quantity: z.number().int().min(1).max(20),
});

export const POST = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  await assertEventAccess(id, user);
  const input = await parseBody(req, bodySchema);
  try {
    const order = await issueComplimentary({
      eventId: id,
      tierId: input.tierId,
      toEmail: input.toEmail,
      quantity: input.quantity,
      actorId: user.id,
    });
    return ok({ orderId: order.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to issue.", 400);
  }
});
