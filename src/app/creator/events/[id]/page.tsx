import { notFound } from "next/navigation";
import { requireRole, canManageEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventAnalytics } from "@/server/analytics";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  SalesOverTimeChart,
  TierBarChart,
} from "@/components/dashboard/Charts";
import {
  PromoForm,
  StaffForm,
  CompForm,
} from "@/components/dashboard/EventManagePanels";
import { formatMoney } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CREATOR", "ADMIN");
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tiers: { orderBy: { sortOrder: "asc" } },
      promoCodes: true,
      staff: { include: { user: true } },
    },
  });
  if (!event) notFound();
  if (!canManageEvent(user, event)) notFound();

  const a = await eventAnalytics(id);

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross sales"
          value={formatMoney(a.grossCents)}
          accent="violet"
        />
        <StatCard
          label="Net sales"
          value={formatMoney(a.netCents)}
          sub={`${formatMoney(a.feesCents)} fees`}
          accent="blue"
        />
        <StatCard
          label="Tickets sold"
          value={`${a.ticketsSold}`}
          sub={`${a.ticketsRemaining} remaining`}
          accent="magenta"
        />
        <StatCard
          label="Checked in"
          value={`${a.checkIns}`}
          sub={`${Math.round(a.checkInRate * 100)}% of active`}
          accent="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Sales over time">
          <SalesOverTimeChart data={a.overTime} />
        </Panel>
        <Panel title="Sales by tier">
          <TierBarChart
            data={a.byTier.map((t) => ({ name: t.name, sold: t.sold }))}
          />
        </Panel>
      </div>

      {/* Management panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Promo codes">
          {event.promoCodes.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {event.promoCodes.map((p) => (
                <span key={p.id} className="chip">
                  {p.code} ·{" "}
                  {p.discountType === "PERCENT"
                    ? `${p.amount}%`
                    : formatMoney(p.amount)}{" "}
                  · {p.uses}
                  {p.maxUses ? `/${p.maxUses}` : ""} used
                </span>
              ))}
            </div>
          )}
          <PromoForm eventId={event.id} />
        </Panel>

        <Panel title="Complimentary tickets">
          <CompForm
            eventId={event.id}
            tiers={event.tiers.map((t) => ({ id: t.id, name: t.name }))}
          />
        </Panel>

        <Panel title="Scanner staff">
          {event.staff.length > 0 && (
            <div className="mb-4 space-y-1 text-sm">
              {event.staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-slate-200">{s.user.name}</span>
                  <span className="chip">
                    {s.canReverse ? "Supervisor" : "Scanner"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <StaffForm eventId={event.id} />
        </Panel>

        <Panel title="Entrance">
          <p className="text-sm text-slate-400">
            Staff scan tickets at{" "}
            <Link href="/scanner" className="text-violetx-bright">
              the scanner
            </Link>
            . Total scanned: <span className="text-white">{a.checkIns}</span> ·
            Remaining:{" "}
            <span className="text-white">{a.activeTickets - a.checkIns}</span>
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-strong p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-violetx-bright">
        {title}
      </h3>
      {children}
    </div>
  );
}
