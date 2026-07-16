"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";

type TierState = {
  id?: string;
  name: string;
  description: string;
  price: string; // dollars
  quantity: string;
  purchaseLimit: string;
  password: string;
};

export type EventFormValues = {
  id?: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  venueName: string;
  address: string;
  mapUrl: string;
  startsAt: string; // datetime-local
  endsAt: string;
  capacity: string;
  ageRequirement: string;
  refundPolicy: string;
  transfersAllowed: boolean;
  refundsAllowed: boolean;
  commissionFee: string; // dollars per ticket
  consentRequirement: "NONE" | "UNDERAGE" | "ALL";
  consentFormUrl: string;
  ticketAccentColor: string;
  ticketNote: string;
  tiers: TierState[];
};

const empty: EventFormValues = {
  title: "",
  category: "Party",
  description: "",
  coverImage:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=80",
  venueName: "",
  address: "",
  mapUrl: "",
  startsAt: "",
  endsAt: "",
  capacity: "200",
  ageRequirement: "",
  refundPolicy: "All ticket sales are final and non-refundable.",
  transfersAllowed: false,
  refundsAllowed: false,
  commissionFee: "0",
  consentRequirement: "NONE",
  consentFormUrl: "",
  ticketAccentColor: "#8b5cf6",
  ticketNote: "",
  tiers: [
    {
      name: "General Admission",
      description: "",
      price: "25",
      quantity: "100",
      purchaseLimit: "8",
      password: "",
    },
  ],
};

export function EventForm({
  initial,
  mode,
}: {
  initial?: EventFormValues;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [v, setV] = useState<EventFormValues>(initial ?? empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof EventFormValues>(
    key: K,
    val: EventFormValues[K],
  ) {
    setV((s) => ({ ...s, [key]: val }));
  }
  function setTier(i: number, patch: Partial<TierState>) {
    setV((s) => ({
      ...s,
      tiers: s.tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));
  }
  function addTier() {
    setV((s) => ({
      ...s,
      tiers: [
        ...s.tiers,
        {
          name: "",
          description: "",
          price: "0",
          quantity: "50",
          purchaseLimit: "8",
          password: "",
        },
      ],
    }));
  }
  function removeTier(i: number) {
    setV((s) => ({ ...s, tiers: s.tiers.filter((_, idx) => idx !== i) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      title: v.title,
      category: v.category,
      description: v.description,
      coverImage: v.coverImage,
      venueName: v.venueName,
      address: v.address,
      mapUrl: v.mapUrl || undefined,
      startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : "",
      endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : "",
      capacity: Number(v.capacity),
      ageRequirement: v.ageRequirement || undefined,
      refundPolicy: v.refundPolicy,
      transfersAllowed: v.transfersAllowed,
      refundsAllowed: v.refundsAllowed,
      commissionFeeCents: Math.round(Number(v.commissionFee || "0") * 100),
      consentRequirement: v.consentRequirement,
      consentFormUrl: v.consentFormUrl || undefined,
      ticketAccentColor: v.ticketAccentColor || undefined,
      ticketNote: v.ticketNote || undefined,
      tiers: v.tiers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        priceCents: Math.round(Number(t.price) * 100),
        quantity: Number(t.quantity),
        purchaseLimit: Number(t.purchaseLimit),
        password: t.password || undefined,
      })),
    };

    const url =
      mode === "create" ? "/api/creator/events" : `/api/creator/events/${v.id}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save event.");
      return;
    }
    router.push(
      mode === "create"
        ? `/creator/events/${data.data.id}`
        : `/creator/events/${v.id}`,
    );
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <FormMessage type="error">{error}</FormMessage>}

      <Section title="Event details">
        <Field label="Title">
          <input
            className="input"
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              className="input"
              value={v.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {[
                "Party",
                "Prom",
                "Fundraiser",
                "Festival",
                "Celebration",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Capacity">
            <input
              type="number"
              min={1}
              className="input"
              value={v.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            rows={4}
            className="input resize-none"
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </Field>
        <Field label="Cover image URL">
          <input
            className="input"
            value={v.coverImage}
            onChange={(e) => set("coverImage", e.target.value)}
            required
          />
        </Field>
        {v.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.coverImage}
            alt=""
            className="h-32 w-full rounded-xl object-cover"
          />
        )}
      </Section>

      <Section title="When & where">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts at">
            <input
              type="datetime-local"
              className="input"
              value={v.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              required
            />
          </Field>
          <Field label="Ends at">
            <input
              type="datetime-local"
              className="input"
              value={v.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Venue name">
          <input
            className="input"
            value={v.venueName}
            onChange={(e) => set("venueName", e.target.value)}
            required
          />
        </Field>
        <Field label="Address">
          <input
            className="input"
            value={v.address}
            onChange={(e) => set("address", e.target.value)}
            required
          />
        </Field>
        <Field label="Map URL (optional)">
          <input
            className="input"
            value={v.mapUrl}
            onChange={(e) => set("mapUrl", e.target.value)}
            placeholder="https://maps.google.com/…"
          />
        </Field>
        <Field label="Age / entry requirement (optional)">
          <input
            className="input"
            value={v.ageRequirement}
            onChange={(e) => set("ageRequirement", e.target.value)}
            placeholder="16+ with student ID"
          />
        </Field>
      </Section>

      <Section title="Ticket tiers">
        <div className="space-y-4">
          {v.tiers.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  Tier {i + 1}
                </span>
                {v.tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="text-xs text-ember-warm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    className="input"
                    value={t.name}
                    onChange={(e) => setTier(i, { name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Price (USD)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input"
                    value={t.price}
                    onChange={(e) => setTier(i, { price: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Quantity">
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={t.quantity}
                    onChange={(e) => setTier(i, { quantity: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Max per order">
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={t.purchaseLimit}
                    onChange={(e) =>
                      setTier(i, { purchaseLimit: e.target.value })
                    }
                    required
                  />
                </Field>
              </div>
              <Field label="Description (optional)">
                <input
                  className="input"
                  value={t.description}
                  onChange={(e) => setTier(i, { description: e.target.value })}
                />
              </Field>
              <Field label="Tier password (optional — hides this tier behind a password)">
                <input
                  className="input"
                  value={t.password}
                  onChange={(e) => setTier(i, { password: e.target.value })}
                  placeholder="Leave blank for a public tier"
                  autoComplete="off"
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTier}
          className="btn-secondary mt-3 !py-2 !text-xs"
        >
          + Add tier
        </button>
      </Section>

      <Section title="Fees, consent & ticket style">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organizer commission per ticket (USD, optional)">
            <input
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={v.commissionFee}
              onChange={(e) => set("commissionFee", e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Consent form requirement">
            <select
              className="input"
              value={v.consentRequirement}
              onChange={(e) =>
                set(
                  "consentRequirement",
                  e.target.value as EventFormValues["consentRequirement"],
                )
              }
            >
              <option value="NONE">Not required</option>
              <option value="UNDERAGE">Required for underage attendees</option>
              <option value="ALL">Required for everyone</option>
            </select>
          </Field>
        </div>
        {v.consentRequirement !== "NONE" && (
          <Field label="Consent form link (upload a PDF/doc somewhere and paste its URL)">
            <input
              className="input"
              value={v.consentFormUrl}
              onChange={(e) => set("consentFormUrl", e.target.value)}
              placeholder="https://…/consent-form.pdf"
            />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ticket accent color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-14 rounded-lg border border-white/10 bg-transparent"
                value={v.ticketAccentColor || "#8b5cf6"}
                onChange={(e) => set("ticketAccentColor", e.target.value)}
              />
              <input
                className="input"
                value={v.ticketAccentColor}
                onChange={(e) => set("ticketAccentColor", e.target.value)}
                placeholder="#8b5cf6"
              />
            </div>
          </Field>
          <Field label="Ticket note (optional — shown on the ticket)">
            <input
              className="input"
              value={v.ticketNote}
              onChange={(e) => set("ticketNote", e.target.value)}
              placeholder="e.g. Doors at 8pm · ID required"
            />
          </Field>
        </div>
        <p className="text-xs text-slate-500">
          The S27 Events logo always appears on every ticket. Your accent color
          and note personalize it.
        </p>
      </Section>

      <Section title="Policies">
        <Field label="Refund policy">
          <textarea
            rows={2}
            className="input resize-none"
            value={v.refundPolicy}
            onChange={(e) => set("refundPolicy", e.target.value)}
            required
          />
        </Field>
        <div className="flex flex-wrap gap-4">
          <Toggle
            label="Allow refunds"
            checked={v.refundsAllowed}
            onChange={(c) => set("refundsAllowed", c)}
          />
          <Toggle
            label="Allow transfers"
            checked={v.transfersAllowed}
            onChange={(c) => set("transfersAllowed", c)}
          />
        </div>
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? "Saving…"
            : mode === "create"
              ? "Create event"
              : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
        >
          Cancel
        </button>
      </div>
      {mode === "create" && (
        <p className="text-xs text-slate-500">
          New events start as a draft. You can publish from the event page once
          it&apos;s ready.
        </p>
      )}
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-strong p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-violetx-bright">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-slate-200"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-violetx" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
      {label}
    </button>
  );
}
