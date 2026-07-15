import { transferSchema } from "@/lib/validation/schemas";
import {
  handler,
  parseBody,
  ok,
  fail,
  requireApiUser,
  limitOrThrow,
} from "@/lib/api";
import { transferTicket, TicketError } from "@/server/tickets";

export const POST = handler(async (req) => {
  limitOrThrow(req, "transfer", { limit: 15, windowSec: 300 });
  const user = await requireApiUser();
  const input = await parseBody(req, transferSchema);

  try {
    await transferTicket({
      ticketId: input.ticketId,
      fromUserId: user.id,
      toEmail: input.toEmail,
    });
    return ok({ transferred: true });
  } catch (e) {
    if (e instanceof TicketError) return fail(e.message, 400, { code: e.code });
    throw e;
  }
});
