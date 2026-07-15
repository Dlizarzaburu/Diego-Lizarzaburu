import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RefundButton } from "@/components/dashboard/RefundButton";
import { formatMoney, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  PAID: "border-emerald-500/40 text-emerald-300",
  REFUNDED: "border-ember/40 text-ember-warm",
  PENDING: "border-amber-500/40 text-amber-300",
  CANCELLED: "border-white/20 text-slate-400",
  FAILED: "border-ember/40 text-ember-warm",
};

export default async function AdminOrdersPage() {
  await requireRole("ADMIN");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: true,
      event: true,
      _count: { select: { tickets: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Orders</h1>
        <p className="text-sm text-slate-400">
          All transactions across the platform. Issue refunds where needed.
        </p>
      </div>

      <div className="glass-strong overflow-x-auto p-1">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Event</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Placed</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="p-3 font-mono text-xs text-slate-400">
                  {o.id.slice(0, 10)}
                  <div className="text-slate-600">
                    {o._count.tickets} tickets
                  </div>
                </td>
                <td className="p-3">
                  <p className="text-white">{o.user.name}</p>
                  <p className="text-xs text-slate-500">{o.user.email}</p>
                </td>
                <td className="p-3 text-slate-300">{o.event.title}</td>
                <td className="p-3 font-semibold text-white">
                  {formatMoney(o.totalCents)}
                </td>
                <td className="p-3">
                  <span className={`chip ${statusStyles[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-400">
                  {formatDateTime(o.createdAt)}
                </td>
                <td className="p-3 text-right">
                  {o.status === "PAID" && <RefundButton orderId={o.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
