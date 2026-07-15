import { ok, fail, requireApiUser, limitOrThrow, ApiError } from "@/lib/api";
import { resendTickets, TicketError } from "@/server/tickets";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    limitOrThrow(req, "resend", { limit: 10, windowSec: 300 });
    const user = await requireApiUser();
    const { id } = await params;
    await resendTickets(id, user.id);
    return ok({ sent: true });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.message, e.status, e.extra);
    if (e instanceof TicketError) return fail(e.message, 400);
    return fail("Could not resend tickets.", 500);
  }
}
