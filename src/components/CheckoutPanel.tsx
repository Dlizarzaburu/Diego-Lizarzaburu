"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { FormMessage } from "@/components/FormMessage";
import {
  computeOrderTotals,
  DEFAULT_FEES,
  type FeeConfig,
} from "@/lib/pricing";

export type CheckoutTier = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  remaining: number;
  purchaseLimit: number;
  onSale: boolean;
};

export function CheckoutPanel({
  eventId,
  tiers,
  isAuthenticated,
  fees = DEFAULT_FEES,
  loginHref,
}: {
  eventId: string;
  tiers: CheckoutTier[];
  isAuthenticated: boolean;
  fees?: FeeConfig;
  loginHref: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lines = useMemo(
    () =>
      tiers
        .map((t) => ({ tier: t, quantity: qty[t.id] ?? 0 }))
        .filter((l) => l.quantity > 0),
    [tiers, qty],
  );

  const totals = useMemo(
    () =>
      computeOrderTotals(
        lines.map((l) => ({
          unitPriceCents: l.tier.priceCents,
          quantity: l.quantity,
        })),
        { fees },
      ),
    [lines, fees],
  );

  const totalCount = lines.reduce((s, l) => s + l.quantity, 0);

  function setTier(id: string, next: number, limit: number, remaining: number) {
    const clamped = Math.max(0, Math.min(next, limit, remaining));
    setQty((q) => ({ ...q, [id]: clamped }));
  }

  async function checkout() {
    setError("");
    if (totalCount === 0) {
      setError("Select at least one ticket.");
      return;
    }
    setLoading(true);
    try {
      // 1) Create the pending order + payment intent (reserves inventory).
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          items: lines.map((l) => ({
            tierId: l.tier.id,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed.");
        setLoading(false);
        return;
      }

      // 2) Confirm payment. DEV mode derives the confirmation signature from the
      //    returned client secret (simulating a provider). In Stripe mode the
      //    webhook fulfils instead and we poll the confirmation page.
      if (data.data.provider === "dev") {
        const secret: string = data.data.clientSecret;
        const signature = secret.split("_secret_")[1];
        const confirm = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.data.orderId,
            intentId: secret.split("_secret_")[0],
            amountCents: data.data.amountCents,
            signature,
          }),
        });
        const cdata = await confirm.json();
        if (!confirm.ok) {
          setError(cdata.error ?? "Payment confirmation failed.");
          setLoading(false);
          return;
        }
      }

      router.push(`/checkout/confirmation/${data.data.orderId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="glass-strong sticky top-20 p-6">
      <h3 className="text-lg font-bold text-white">Get tickets</h3>

      <div className="mt-4 space-y-3">
        {tiers.map((t) => {
          const n = qty[t.id] ?? 0;
          const disabled = t.remaining <= 0 || !t.onSale;
          return (
            <div
              key={t.id}
              className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${
                disabled ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t.description}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-bold text-violetx-bright">
                    {t.priceCents === 0 ? "Free" : formatMoney(t.priceCents)}
                  </p>
                </div>
                <div className="text-right">
                  {t.remaining <= 0 ? (
                    <span className="chip border-ember/40 text-ember-warm">
                      Sold out
                    </span>
                  ) : !t.onSale ? (
                    <span className="chip">Not on sale</span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {t.remaining} left
                    </span>
                  )}
                </div>
              </div>

              {!disabled && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Max {t.purchaseLimit} per order
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setTier(t.id, n - 1, t.purchaseLimit, t.remaining)
                      }
                      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      aria-label={`Decrease ${t.name}`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold tabular-nums text-white">
                      {n}
                    </span>
                    <button
                      onClick={() =>
                        setTier(t.id, n + 1, t.purchaseLimit, t.remaining)
                      }
                      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      aria-label={`Increase ${t.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      {totalCount > 0 && (
        <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <Row label="Subtotal" value={formatMoney(totals.subtotalCents)} />
          <Row
            label="Service & processing fees"
            value={formatMoney(totals.feeCents)}
            muted
          />
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
            <span>Total</span>
            <span>{formatMoney(totals.totalCents)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <FormMessage type="error">{error}</FormMessage>
        </div>
      )}

      <div className="mt-5">
        {isAuthenticated ? (
          <button
            onClick={checkout}
            disabled={loading || totalCount === 0}
            className="btn-primary w-full"
          >
            {loading
              ? "Processing…"
              : totalCount === 0
                ? "Select tickets"
                : `Secure checkout · ${formatMoney(totals.totalCents)}`}
          </button>
        ) : (
          <Link href={loginHref} className="btn-primary w-full">
            Sign in to buy tickets
          </Link>
        )}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect
              x="5"
              y="11"
              width="14"
              height="9"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M8 11V8a4 4 0 118 0v3"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
          Secure checkout · Tickets issued only after payment
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${muted ? "text-slate-400" : "text-slate-200"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
