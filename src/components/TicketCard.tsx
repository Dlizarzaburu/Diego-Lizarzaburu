"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";

export type TicketView = {
  id: string;
  code: string;
  tierName: string;
  status: string;
  qrDataUrl: string;
  eventTitle: string;
  eventStartsAt: string;
  venueName: string;
  holderName: string;
  transfersAllowed: boolean;
};

const statusStyles: Record<string, string> = {
  VALID: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  CHECKED_IN: "border-neon/40 bg-neon/10 text-neon-bright",
  CANCELLED: "border-ember/40 bg-ember/10 text-ember-warm",
  REFUNDED: "border-ember/40 bg-ember/10 text-ember-warm",
  TRANSFERRED: "border-white/20 text-slate-300",
};

export function TicketCard({
  ticket,
  onTransfer,
}: {
  ticket: TicketView;
  onTransfer?: (ticket: TicketView) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  function download() {
    const link = document.createElement("a");
    link.href = ticket.qrDataUrl;
    link.download = `${ticket.code}.png`;
    link.click();
  }

  return (
    <div className="glass-strong overflow-hidden">
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {/* QR */}
        <div className="relative shrink-0">
          <div className="rounded-2xl bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.qrDataUrl}
              alt={`QR code for ticket ${ticket.code}`}
              className="h-32 w-32"
            />
          </div>
          {ticket.status === "CHECKED_IN" && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink-950/70">
              <span className="rounded-full bg-neon px-3 py-1 text-xs font-bold text-white">
                Checked in
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-white">
              {ticket.eventTitle}
            </h3>
          </div>
          <p className="text-sm text-slate-400">
            {formatDateTime(ticket.eventStartsAt)} · {ticket.venueName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="chip">{ticket.tierName}</span>
            <span
              className={`chip ${statusStyles[ticket.status] ?? "border-white/10"}`}
            >
              {ticket.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-2 font-mono text-xs text-violetx-bright">
            {ticket.code}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={download} className="btn-secondary !py-2 !text-xs">
              Download QR
            </button>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="btn-ghost !py-2 !text-xs"
            >
              {flipped ? "Hide details" : "Ticket details"}
            </button>
            {ticket.transfersAllowed &&
              ticket.status === "VALID" &&
              onTransfer && (
                <button
                  onClick={() => onTransfer(ticket)}
                  className="btn-ghost !py-2 !text-xs"
                >
                  Transfer
                </button>
              )}
          </div>
        </div>
      </div>

      {flipped && (
        <div className="border-t border-white/10 bg-ink-900/60 px-5 py-4 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Ticket holder:</span>{" "}
            {ticket.holderName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Present this QR code at the entrance. It can be scanned once. Do not
            share screenshots — the code is your entry.
          </p>
        </div>
      )}
    </div>
  );
}
