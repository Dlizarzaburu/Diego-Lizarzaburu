"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";

export function SettingsForm({
  platformFeeBps,
  processingFeeBps,
  processingFeeFixedCents,
}: {
  platformFeeBps: number;
  processingFeeBps: number;
  processingFeeFixedCents: number;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ t: "error" | "success"; m: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformFeeBps: Math.round(Number(f.get("platformPct")) * 100),
        processingFeeBps: Math.round(Number(f.get("processingPct")) * 100),
        processingFeeFixedCents: Math.round(Number(f.get("fixed")) * 100),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ t: "error", m: data.error ?? "Failed." });
    setMsg({ t: "success", m: "Fees updated." });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="glass-strong max-w-lg space-y-4 p-6">
      {msg && <FormMessage type={msg.t}>{msg.m}</FormMessage>}
      <div>
        <label className="label">Platform fee (%)</label>
        <input
          name="platformPct"
          type="number"
          step="0.01"
          min={0}
          max={30}
          defaultValue={(platformFeeBps / 100).toFixed(2)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Processing fee (%)</label>
        <input
          name="processingPct"
          type="number"
          step="0.01"
          min={0}
          max={30}
          defaultValue={(processingFeeBps / 100).toFixed(2)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Fixed processing fee (USD per order)</label>
        <input
          name="fixed"
          type="number"
          step="0.01"
          min={0}
          defaultValue={(processingFeeFixedCents / 100).toFixed(2)}
          className="input"
        />
      </div>
      <button disabled={loading} className="btn-primary">
        {loading ? "Saving…" : "Save fees"}
      </button>
      <p className="text-xs text-slate-500">
        Fees are applied to paid orders at checkout. Complimentary tickets are
        always free.
      </p>
    </form>
  );
}
