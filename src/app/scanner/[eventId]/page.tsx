import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertScannerAccess } from "@/server/access";
import { eventScanStats } from "@/server/scan";
import { Scanner } from "@/components/scanner/Scanner";

export const dynamic = "force-dynamic";

export default async function ScannerEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/scanner/${eventId}`);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  let canReverse = false;
  try {
    const access = await assertScannerAccess(eventId, user);
    canReverse = access.canReverse && event.allowReverseCheckIn;
  } catch {
    // Not authorized to scan this event.
    redirect("/scanner");
  }

  const stats = await eventScanStats(eventId);

  return (
    <Scanner
      eventId={event.id}
      eventTitle={event.title}
      canReverse={canReverse}
      initialStats={stats}
    />
  );
}
