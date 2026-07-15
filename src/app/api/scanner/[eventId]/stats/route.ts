import { route, ok, requireApiUser } from "@/lib/api";
import { assertScannerAccess } from "@/server/access";
import { eventScanStats } from "@/server/scan";

export const GET = route<{ params: Promise<{ eventId: string }> }>(
  async (_req, { params }) => {
    const user = await requireApiUser();
    const { eventId } = await params;
    await assertScannerAccess(eventId, user);
    const stats = await eventScanStats(eventId);
    return ok(stats);
  },
);
