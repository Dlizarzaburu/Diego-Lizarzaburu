import { notFound } from "next/navigation";
import { requireRole, canManageEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventAnalytics } from "@/server/analytics";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  SalesOverTimeChart,
  TierBarChart,
} from "@/components/dashboard/Charts";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventSalesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CREATOR", "ADMIN");
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) notFound();
  if (!canManageEvent(user, event)) notFound();

  const a = await eventAnalytics(id);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross sales"
          value={formatMoney(a.grossCents)}
          accent="violet"
        />
        <StatCard
          label="Net sales"
          value={formatMoney(a.netCents)}
          accent="blue"
        />
        <StatCard
          label="Refunds"
          value={`${a.refundCount}`}
          sub={formatMoney(a.refundAmountCents)}
          accent="ember"
        />
        <StatCard
          label="Upcoming payout"
          value={formatMoney(a.upcomingPayoutCents)}
          sub="Net of fees"
          accent="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Sales over time">
          <SalesOverTimeChart data={a.overTime} />
        </Panel>
        <Panel title="Tickets sold by tier">
          <TierBarChart
            data={a.byTier.map((t) => ({ name: t.name, sold: t.sold }))}
          />
        </Panel>
      </div>

      <Panel title="Ticket tiers">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
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
