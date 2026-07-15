import { scanSchema } from "@/lib/validation/schemas";
import {
  handler,
  parseBody,
  ok,
  requireApiUser,
  limitOrThrow,
} from "@/lib/api";
import { assertScannerAccess } from "@/server/access";
import { scanTicket } from "@/server/scan";

export const POST = handler(async (req) => {
  // Scanning endpoints are rate-limited to blunt brute-force token guessing.
  limitOrThrow(req, "scan", { limit: 120, windowSec: 60 });
  const user = await requireApiUser();
  const input = await parseBody(req, scanSchema);
  await assertScannerAccess(input.eventId, user);

  const outcome = await scanTicket({
    token: input.token,
    eventId: input.eventId,
    scannerId: user.id,
    entrance: input.entrance || undefined,
    device: input.device || undefined,
  });
  return ok(outcome);
});
