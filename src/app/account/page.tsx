import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountOverview() {
  const user = await requireUser();

  const [ticketCount, upcoming, orderCount, staffCount] = await Promise.all([
    prisma.ticket.count({
      where: { userId: user.id, status: { in: ["VALID", "CHECKED_IN"] } },
    }),
    prisma.ticket.findMany({
      where: {
        userId: user.id,
        status: "VALID",
        event: { startsAt: { gte: new Date() } },
      },
      include: { event: true, tier: true },
      orderBy: { event: { startsAt: "asc" } },
      take: 3,
    }),
    prisma.order.count({ where: { userId: user.id, status: "PAID" } }),
    prisma.staffAssignment.count({ where: { userId: user.id } }),
  ]);

  const isScanner = user.role === "ADMIN" || staffCount > 0;

  const stats = [
    { label: "Active tickets", value: ticketCount },
    { label: "Completed orders", value: orderCount },
    {
      label: "Upcoming events",
      value: new Set(upcoming.map((t) => t.eventId)).size,
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-3xl font-black text-white">
        Welcome back, {user.name.split(" ")[0]}
      </h1>
      <p className="mb-8 text-slate-400">Here&apos;s what&apos;s coming up.</p>

      {isScanner && (
        <Link
          href="/scanner"
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neon/30 bg-neon/10 p-5 transition hover:bg-neon/15"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-neon/20 text-neon-bright">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3m12-4v3a1 1 0 01-1 1h-3M3 12h18"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">
                You&apos;re event staff — open the scanner
              </p>
              <p className="text-sm text-slate-300">
                Scan tickets at the entrance for your assigned events.
              </p>
            </div>
          </div>
          <span className="text-neon-bright">→</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="glass-strong p-5">
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="mt-1 text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Next up</h2>
          <Link href="/account/tickets" className="text-sm link-muted">
            View all tickets →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="glass grid place-items-center gap-2 py-12 text-center">
            <p className="text-slate-400">No upcoming events yet.</p>
            <Link href="/events" className="btn-secondary mt-1">
              Explore events
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((t) => (
              <Link
                key={t.id}
                href={`/events/${t.eventId}`}
                className="glass-strong flex items-center gap-4 p-4 transition hover:bg-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.event.coverImage}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {t.event.title}
                  </p>
                  <p className="text-sm text-slate-400">
                    {formatDateTime(t.event.startsAt)}
                  </p>
                </div>
                <span className="chip">{t.tier.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
