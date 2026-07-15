import { eventInputSchema } from "@/lib/validation/schemas";
import { handler, parseBody, ok, requireApiRole } from "@/lib/api";
import { createEvent } from "@/server/creator";

export const POST = handler(async (req) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const input = await parseBody(req, eventInputSchema);
  const event = await createEvent(user.id, input);
  return ok({ id: event.id, slug: event.slug });
});
