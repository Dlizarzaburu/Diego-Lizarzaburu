import { z } from "zod";
import { route, parseBody, ok, requireApiRole, type IdCtx } from "@/lib/api";
import { assertEventAccess } from "@/server/access";
import { setEventStatus } from "@/server/creator";

const bodySchema = z.object({
  status: z.enum(["PUBLISHED", "UNPUBLISHED", "DRAFT"]),
});

export const POST = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  await assertEventAccess(id, user);
  const { status } = await parseBody(req, bodySchema);
  const event = await setEventStatus(id, user.id, status);
  return ok({ id: event.id, status: event.status });
});
