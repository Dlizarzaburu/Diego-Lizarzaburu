import { partialEventSchema } from "@/lib/validation/schemas";
import { route, parseBody, ok, requireApiRole, type IdCtx } from "@/lib/api";
import { assertEventAccess } from "@/server/access";
import { updateEvent } from "@/server/creator";

// Accepts a partial event payload so creators can save one section at a time
// (details / schedule / tiers / fees / policies) or the whole form at once.
export const PATCH = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  await assertEventAccess(id, user);
  const input = await parseBody(req, partialEventSchema);
  const event = await updateEvent(id, user.id, input);
  return ok({ id: event?.id, slug: event?.slug });
});
