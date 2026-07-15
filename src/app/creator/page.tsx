import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatMoney, formatDate } from "@/lib/format";
import { availability } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function CreatorOverview() {
  const user = await requireRole("CREATOR", "ADMIN");

  const events = await prisma.event.findMany({
    where: user.role === "ADMIN" ? {} : { creatorId: user.id },
    include: {
      tiers: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const eventIds = events.map((e) => e.id);
  const paidAgg = await prisma.order.aggregate({
    where: { eventId: { in: eventIds }, status: "PAID" },
    _sum: { totalCents: true },
  });
  const ticketsSold = await prisma.ticket.count({
    where: {
      eventId: { in: eventIds },
      status: { in: ["VALID", "CHECKED_IN"] },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Organizer dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Manage your Senior 2027 events and track sales.
          </p>
        </div>
        <Link
          href="/creator/events/new"
          className="btn-primary hidden sm:inline-flex"
        >
          + New event
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Gross sales"
          value={formatMoney(paidAgg._sum.totalCents ?? 0)}
          accent="violet"
        />
        <StatCard
          label="Tickets sold"
          value={String(ticketsSold)}
          accent="blue"
        />
        <StatCard
          label="Events"
          value={String(events.length)}
          accent="magenta"
        />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold text-white">Your events</h2>
      {events.length === 0 ? (
        <div className="glass grid place-items-center gap-3 py-16 text-center">
          <p className="text-slate-400">
            You haven&apos;t created any events yet.
          </p>
          <Link href="/creator/events/new" className="btn-primary">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const a = availability(e);
            return (
              <Link
                key={e.id}
                href={`/creator/events/${e.id}`}
                className="glass-strong flex flex-col gap-4 p-4 transition hover:bg-white/5 sm:flex-row sm:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.coverImage}
                  alt=""
                  className="h-16 w-full rounded-xl object-cover sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-white">
                      {e.title}
                    </p>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="text-sm text-slate-400">
                    {formatDate(e.startsAt)} · {e.venueName}
                  </p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-slate-500">Sold</p>
                    <p className="font-semibold text-white">
                      {a.sold}/{a.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">From</p>
                    <p className="font-semibold text-white">
                      {formatMoney(a.minPrice)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PUBLISHED: "border-emerald-500/40 text-emerald-300",
    DRAFT: "border-amber-500/40 text-amber-300",
    UNPUBLISHED: "border-white/20 text-slate-400",
  };
  return (
    <span className={`chip ${styles[status] ?? "border-white/10"}`}>
      {status}
    </span>
  );
}
