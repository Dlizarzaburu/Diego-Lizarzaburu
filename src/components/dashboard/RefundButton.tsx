"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function refund() {
    if (
      !confirm("Issue an admin refund for this order? Tickets will be voided.")
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: "POST",
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Refund failed.");
  }

  return (
    <button
      onClick={refund}
      disabled={busy}
      className="btn-ghost !py-1.5 !text-xs text-ember-warm"
    >
      {busy ? "Refunding…" : "Refund"}
    </button>
  );
}
