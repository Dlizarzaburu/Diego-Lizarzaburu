import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole, canManageEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventAnalytics } from "@/server/analytics";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  SalesOverTimeChart,
  TierBarChart,
} from "@/components/dashboard/Charts";
import {
  EventActions,
  PromoForm,
  StaffForm,
  CompForm,
} from "@/components/dashboard/EventManagePanels";
import { formatMoney, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ManageEventPage({
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Refunds"
          value={`${a.refundCount}`}
          sub={formatMoney(a.refundAmountCents)}
          accent="ember"
        />
        <StatCard label="Capacity" value={`${a.capacity}`} accent="blue" />
        <StatCard
          label="Upcoming payout"
          value={formatMoney(a.upcomingPayoutCents)}
          sub="Net of fees"
          accent="emerald"
        />
        <StatCard
          label="Active tickets"
          value={`${a.activeTickets}`}
          accent="violet"
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

      {/* Tier detail table */}
      <Panel title="Ticket tiers">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Tier</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">Sold</th>
                <th className="pb-2">Remaining</th>
                <th className="pb-2">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {a.byTier.map((t) => (
                <tr key={t.name} className="text-slate-200">
                  <td className="py-2 font-medium">{t.name}</td>
                  <td className="py-2">
                    {formatMoney(
                      event.tiers.find((x) => x.name === t.name)?.priceCents ??
                        0,
                    )}
                  </td>
                  <td className="py-2">{t.sold}</td>
                  <td className="py-2">{t.quantity - t.sold}</td>
                  <td className="py-2">{formatMoney(t.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

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
