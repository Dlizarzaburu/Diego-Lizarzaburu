import { requireRole } from "@/lib/auth";
import { platformAnalytics } from "@/server/analytics";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesOverTimeChart } from "@/components/dashboard/Charts";
import { formatMoney, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await requireRole("ADMIN");
  const a = await platformAnalytics();

  const [pendingCreators, recentScans] = await Promise.all([
    prisma.user.count({ where: { creatorStatus: "PENDING" } }),
    prisma.checkInLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { event: true, scanner: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          Platform overview
        </h1>
        <p className="text-sm text-slate-400">
          Real-time metrics across all S27 Events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross sales"
          value={formatMoney(a.grossCents)}
          accent="violet"
        />
        <StatCard
          label="Platform fees"
          value={formatMoney(a.feesCents)}
          accent="blue"
        />
        <StatCard
          label="Paid orders"
          value={String(a.paidOrders)}
          accent="magenta"
        />
        <StatCard
          label="Tickets sold"
          value={String(a.ticketsSold)}
          accent="emerald"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Refunds"
          value={String(a.refundCount)}
          sub={formatMoney(a.refundAmountCents)}
          accent="ember"
        />
        <StatCard label="Check-ins" value={String(a.checkIns)} accent="blue" />
        <StatCard label="Users" value={String(a.userCount)} accent="violet" />
        <StatCard
          label="Events"
          value={String(a.eventCount)}
          sub={
            pendingCreators > 0
              ? `${pendingCreators} organizer request(s)`
              : undefined
          }
          accent="magenta"
        />
      </div>

      <div className="glass-strong p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-violetx-bright">
          Platform revenue over time
        </h3>
        <SalesOverTimeChart data={a.overTime} />
      </div>

      <div className="glass-strong p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-violetx-bright">
          Recent QR scan attempts
        </h3>
        {recentScans.length === 0 ? (
          <p className="text-sm text-slate-500">No scans recorded yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {recentScans.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <span className="text-slate-200">{s.event.title}</span>
                  <span className="text-slate-500"> · {s.scanner.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ScanResultBadge result={s.result} />
                  <span className="text-xs text-slate-500">
                    {formatDateTime(s.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScanResultBadge({ result }: { result: string }) {
  const ok = result === "VALID";
  const warn = result === "ALREADY_USED" || result === "REVERSED";
  return (
    <span
      className={`chip ${ok ? "border-emerald-500/40 text-emerald-300" : warn ? "border-amber-500/40 text-amber-300" : "border-ember/40 text-ember-warm"}`}
    >
      {result.replace("_", " ")}
    </span>
  );
}
