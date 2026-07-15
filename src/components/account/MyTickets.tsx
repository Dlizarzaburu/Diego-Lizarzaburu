"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketCard, type TicketView } from "@/components/TicketCard";
import { FormMessage } from "@/components/FormMessage";

export function MyTickets({
  upcoming,
  past,
}: {
  upcoming: TicketView[];
  past: TicketView[];
}) {
  const router = useRouter();
  const [transferTicket, setTransferTicket] = useState<TicketView | null>(null);

  return (
    <div className="space-y-10">
      <Section
        title="Upcoming"
        empty="You have no upcoming tickets yet."
        tickets={upcoming}
        onTransfer={setTransferTicket}
      />
      {past.length > 0 && (
        <Section
          title="Past events"
          empty=""
          tickets={past}
          onTransfer={undefined}
        />
      )}

      {transferTicket && (
        <TransferModal
          ticket={transferTicket}
          onClose={() => setTransferTicket(null)}
          onDone={() => {
            setTransferTicket(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  tickets,
  empty,
  onTransfer,
}: {
  title: string;
  tickets: TicketView[];
  empty: string;
  onTransfer?: (t: TicketView) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>
      {tickets.length === 0 ? (
        empty ? (
          <div className="glass grid place-items-center gap-2 py-12 text-center">
            <p className="text-slate-400">{empty}</p>
            <Link href="/events" className="btn-secondary mt-1">
              Browse events
            </Link>
          </div>
        ) : null
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} onTransfer={onTransfer} />
          ))}
        </div>
      )}
    </section>
  );
}

function TransferModal({
  ticket,
  onClose,
  onDone,
}: {
  ticket: TicketView;
  onClose: () => void;
  onDone: () => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/tickets/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: ticket.id,
        toEmail: form.get("email"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Transfer failed.");
      return;
    }
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">Transfer ticket</h3>
        <p className="mt-1 text-sm text-slate-400">
          Send{" "}
          <span className="font-mono text-violetx-bright">{ticket.code}</span> (
          {ticket.tierName}) to another S27 Events member. They must already
          have an account.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <FormMessage type="error">{error}</FormMessage>}
          <div>
            <label className="label" htmlFor="email">
              Recipient email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="friend@example.com"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Transferring…" : "Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
