import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole, canManageEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventActions } from "@/components/dashboard/EventManagePanels";
import { CreatorEventTabs } from "@/components/dashboard/CreatorEventTabs";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CreatorEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CREATOR", "ADMIN");
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();
  if (!canManageEvent(user, event)) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/creator" className="text-xs link-muted">
            ← All events
          </Link>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            {event.title}
          </h1>
          <p className="text-sm text-slate-400">
            {formatDateTime(event.startsAt)} · {event.venueName} ·{" "}
            <span className="uppercase">{event.status}</span>
          </p>
        </div>
        <EventActions eventId={event.id} status={event.status} />
      </div>

      <CreatorEventTabs eventId={event.id} />

      <div>{children}</div>
    </div>
  );
}
