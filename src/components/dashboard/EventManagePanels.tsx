"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormMessage } from "@/components/FormMessage";

type Tier = { id: string; name: string };

export function EventActions({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function setStatus(next: string) {
    setBusy("status");
    await fetch(`/api/creator/events/${eventId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy("");
    router.refresh();
  }
  async function duplicate() {
    setBusy("dup");
    const res = await fetch(`/api/creator/events/${eventId}/duplicate`, {
      method: "POST",
    });
    const data = await res.json();
    setBusy("");
    if (res.ok) router.push(`/creator/events/${data.data.id}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/creator/events/${eventId}/edit`}
        className="btn-secondary !py-2 !text-xs"
      >
        Edit
      </Link>
      {status === "PUBLISHED" ? (
        <button
          onClick={() => setStatus("UNPUBLISHED")}
          disabled={!!busy}
          className="btn-ghost !py-2 !text-xs"
        >
          Unpublish
        </button>
      ) : (
        <button
          onClick={() => setStatus("PUBLISHED")}
          disabled={!!busy}
          className="btn-primary !py-2 !text-xs"
        >
          {busy === "status" ? "…" : "Publish"}
        </button>
      )}
      <button
        onClick={duplicate}
        disabled={!!busy}
        className="btn-ghost !py-2 !text-xs"
      >
        {busy === "dup" ? "…" : "Duplicate"}
      </button>
      <a
        href={`/api/creator/events/${eventId}/attendees`}
        className="btn-ghost !py-2 !text-xs"
      >
        Export attendees (CSV)
      </a>
    </div>
  );
}

export function PromoForm({ eventId }: { eventId: string }) {
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
    const res = await fetch(`/api/creator/events/${eventId}/promo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: f.get("code"),
        discountType: f.get("discountType"),
        amount:
          f.get("discountType") === "PERCENT"
            ? Number(f.get("amount"))
            : Math.round(Number(f.get("amount")) * 100),
        maxUses: f.get("maxUses") ? Number(f.get("maxUses")) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ t: "error", m: data.error ?? "Failed." });
    setMsg({ t: "success", m: `Promo ${data.data.code} created.` });
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {msg && <FormMessage type={msg.t}>{msg.m}</FormMessage>}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="code"
          placeholder="Code e.g. EARLY10"
          required
          className="input"
        />
        <select name="discountType" className="input" defaultValue="PERCENT">
          <option value="PERCENT">Percent %</option>
          <option value="FIXED">Fixed $</option>
        </select>
        <input
          name="amount"
          type="number"
          min={1}
          step="0.01"
          placeholder="Amount"
          required
          className="input"
        />
        <input
          name="maxUses"
          type="number"
          min={1}
          placeholder="Max uses (optional)"
          className="input"
        />
      </div>
      <button disabled={loading} className="btn-secondary !py-2 !text-xs">
        {loading ? "Creating…" : "Create promo code"}
      </button>
    </form>
  );
}

export function StaffForm({ eventId }: { eventId: string }) {
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
    const res = await fetch(`/api/creator/events/${eventId}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: f.get("email"),
        canReverse: f.get("canReverse") === "on",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ t: "error", m: data.error ?? "Failed." });
    setMsg({ t: "success", m: `${data.data.name} can now scan this event.` });
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {msg && <FormMessage type={msg.t}>{msg.m}</FormMessage>}
      <input
        name="email"
        type="email"
        placeholder="staff@example.com"
        required
        className="input"
      />
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" name="canReverse" className="h-4 w-4 rounded" />
        Supervisor — can reverse check-ins
      </label>
      <button disabled={loading} className="btn-secondary !py-2 !text-xs">
        {loading ? "Adding…" : "Add scanner staff"}
      </button>
    </form>
  );
}

export function CompForm({
  eventId,
  tiers,
}: {
  eventId: string;
  tiers: Tier[];
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
    const res = await fetch(`/api/creator/events/${eventId}/comp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tierId: f.get("tierId"),
        toEmail: f.get("email"),
        quantity: Number(f.get("quantity")),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg({ t: "error", m: data.error ?? "Failed." });
    setMsg({ t: "success", m: "Complimentary tickets issued." });
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {msg && <FormMessage type={msg.t}>{msg.m}</FormMessage>}
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          name="email"
          type="email"
          placeholder="Recipient email"
          required
          className="input sm:col-span-1"
        />
        <select name="tierId" className="input" required>
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          name="quantity"
          type="number"
          min={1}
          max={20}
          defaultValue={1}
          className="input"
        />
      </div>
      <button disabled={loading} className="btn-secondary !py-2 !text-xs">
        {loading ? "Issuing…" : "Issue complimentary tickets"}
      </button>
    </form>
  );
}
