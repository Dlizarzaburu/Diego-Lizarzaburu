import { route, ok, requireApiRole, type IdCtx } from "@/lib/api";
import { assertEventAccess } from "@/server/access";
import { duplicateEvent } from "@/server/creator";

export const POST = route<IdCtx>(async (_req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  await assertEventAccess(id, user);
  const copy = await duplicateEvent(id, user.id);
  return ok({ id: copy.id, slug: copy.slug });
});
