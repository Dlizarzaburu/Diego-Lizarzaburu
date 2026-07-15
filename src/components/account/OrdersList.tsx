"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney, formatDateTime } from "@/lib/format";

export type OrderView = {
  id: string;
  eventTitle: string;
  eventStartsAt: string;
  status: string;
  totalCents: number;
  ticketCount: number;
  createdAt: string;
  refundEligible: boolean;
};

const statusStyles: Record<string, string> = {
  PAID: "border-emerald-500/40 text-emerald-300",
  REFUNDED: "border-ember/40 text-ember-warm",
  PENDING: "border-amber-500/40 text-amber-300",
  CANCELLED: "border-white/20 text-slate-400",
};

export function OrdersList({ orders }: { orders: OrderView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [message, setMessage] = useState<{ id: string; text: string } | null>(
    null,
  );

  async function resend(id: string) {
    setBusy(id + ":resend");
    const res = await fetch(`/api/orders/${id}/resend`, { method: "POST" });
    setBusy("");
    setMessage({
      id,
      text: res.ok
        ? "Tickets re-sent to your email (check dev-outbox in development)."
        : "Could not resend tickets.",
    });
  }

  async function refund(id: string) {
    if (!confirm("Request a refund for this order? This cannot be undone."))
      return;
    setBusy(id + ":refund");
    const res = await fetch(`/api/orders/${id}/refund`, { method: "POST" });
    const data = await res.json();
    setBusy("");
    if (res.ok) {
      router.refresh();
    } else {
      setMessage({ id, text: data.error ?? "Refund request failed." });
    }
  }

  if (orders.length === 0) {
    return (
      <div className="glass grid place-items-center gap-2 py-14 text-center">
        <p className="text-slate-400">
          You haven&apos;t placed any orders yet.
        </p>
        <Link href="/events" className="btn-secondary mt-1">
          Browse events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="glass-strong p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{o.eventTitle}</p>
              <p className="text-sm text-slate-400">
                {formatDateTime(o.eventStartsAt)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {o.ticketCount} ticket{o.ticketCount === 1 ? "" : "s"} · Ordered{" "}
                {formatDateTime(o.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {formatMoney(o.totalCents)}
              </p>
              <span
                className={`chip ${statusStyles[o.status] ?? "border-white/10"}`}
              >
                {o.status}
              </span>
            </div>
          </div>

          {o.status === "PAID" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/checkout/confirmation/${o.id}`}
                className="btn-secondary !py-2 !text-xs"
              >
                View tickets
              </a>
              <button
                onClick={() => resend(o.id)}
                disabled={busy === o.id + ":resend"}
                className="btn-ghost !py-2 !text-xs"
              >
                {busy === o.id + ":resend" ? "Sending…" : "Resend email"}
              </button>
              {o.refundEligible && (
                <button
                  onClick={() => refund(o.id)}
                  disabled={busy === o.id + ":refund"}
                  className="btn-ghost !py-2 !text-xs text-ember-warm"
                >
                  {busy === o.id + ":refund" ? "Processing…" : "Request refund"}
                </button>
              )}
            </div>
          )}

          {message?.id === o.id && (
            <p className="mt-3 text-xs text-slate-300">{message.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}
