"use client";

import { useMemo, useState } from "react";
import { formatMoney, formatDateTime } from "@/lib/format";

export type Buyer = {
  orderId: string;
  name: string;
  email: string;
  phone: string | null;
  tickets: number;
  tiers: string;
  totalCents: number;
  status: string;
  createdAt: string;
  checkedIn: number;
};

export function BuyersTable({
  buyers,
  eventId,
}: {
  buyers: Buyer[];
  eventId: string;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [sent, setSent] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return buyers;
    return buyers.filter(
      (b) =>
        b.name.toLowerCase().includes(s) ||
        b.email.toLowerCase().includes(s) ||
        b.tiers.toLowerCase().includes(s),
    );
  }, [buyers, q]);

  async function resend(orderId: string) {
    setBusy(orderId);
    const res = await fetch(`/api/creator/events/${eventId}/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    setBusy("");
    setSent((s) => ({
      ...s,
      [orderId]: res.ok ? "Sent ✓" : "Failed",
    }));
  }

  if (buyers.length === 0) {
    return (
      <div className="glass grid place-items-center py-14 text-center text-slate-400">
        No buyers yet. Sales will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="input max-w-sm"
        placeholder="Search name, email, or tier"
      />
      <div className="glass-strong overflow-x-auto p-1">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Buyer</th>
              <th className="p-3">Tickets</th>
              <th className="p-3">Total</th>
              <th className="p-3">Checked in</th>
              <th className="p-3">Status</th>
              <th className="p-3">Purchased</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((b) => (
              <tr key={b.orderId}>
                <td className="p-3">
                  <p className="font-medium text-white">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.email}</p>
                  {b.phone && (
                    <p className="text-xs text-slate-600">{b.phone}</p>
                  )}
                </td>
                <td className="p-3 text-slate-300">
                  {b.tickets}
                  <div className="text-xs text-slate-500">{b.tiers}</div>
                </td>
                <td className="p-3 font-semibold text-white">
                  {formatMoney(b.totalCents)}
                </td>
                <td className="p-3 text-slate-300">
                  {b.checkedIn}/{b.tickets}
                </td>
                <td className="p-3">
                  <span
                    className={`chip ${b.status === "PAID" ? "border-emerald-500/40 text-emerald-300" : "border-ember/40 text-ember-warm"}`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-400">
                  {formatDateTime(b.createdAt)}
                </td>
                <td className="p-3 text-right">
                  {b.status === "PAID" && (
                    <button
                      onClick={() => resend(b.orderId)}
                      disabled={busy === b.orderId}
                      className="btn-secondary !py-1.5 !text-xs"
                    >
                      {busy === b.orderId
                        ? "Sending…"
                        : (sent[b.orderId] ?? "Resend QR")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
