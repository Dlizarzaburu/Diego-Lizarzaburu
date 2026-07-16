"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";

type ScanOutcome = {
  result: string;
  message: string;
  ticket?: {
    code: string;
    tierName: string;
    tierColor?: string | null;
    holderName: string;
    status: string;
  };
  previousCheckIn?: { at: string; by: string; entrance: string | null };
};

type SearchResult = {
  id: string;
  code: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  qrToken: string;
  checkedInAt: string | null;
};

export function Scanner({
  eventId,
  eventTitle,
  canReverse,
  initialStats,
}: {
  eventId: string;
  eventTitle: string;
  canReverse: boolean;
  initialStats: { total: number; checkedIn: number; remaining: number };
}) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [entrance, setEntrance] = useState("Main");
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [stats, setStats] = useState(initialStats);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const busyRef = useRef(false);
  const lastTokenRef = useRef<{ token: string; at: number }>({
    token: "",
    at: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  const refreshStats = useCallback(async () => {
    const res = await fetch(`/api/scanner/${eventId}/stats`);
    if (res.ok) setStats((await res.json()).data);
  }, [eventId]);

  const submitToken = useCallback(
    async (token: string, device: string) => {
      if (busyRef.current) return;
      // Debounce duplicate reads of the same code within 3s.
      const now = Date.now();
      if (
        lastTokenRef.current.token === token &&
        now - lastTokenRef.current.at < 3000
      )
        return;
      lastTokenRef.current = { token, at: now };
      busyRef.current = true;
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, eventId, entrance, device }),
        });
        const data = await res.json();
        if (res.ok) {
          setOutcome(data.data);
          if (navigator.vibrate)
            navigator.vibrate(data.data.result === "VALID" ? 80 : [60, 40, 60]);
          refreshStats();
        } else {
          setOutcome({
            result: "INVALID",
            message: data.error ?? "Scan failed.",
          });
        }
      } finally {
        setTimeout(() => (busyRef.current = false), 700);
      }
    },
    [eventId, entrance, refreshStats],
  );

  // Camera lifecycle
  useEffect(() => {
    if (mode !== "camera") return;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode("qr-reader", { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => submitToken(decoded, "camera"),
          () => {},
        );
        if (!cancelled) setScanning(true);
      } catch (e) {
        setCameraError(
          "Could not access the camera. Grant permission or use manual search.",
        );
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
      setScanning(false);
    };
  }, [mode, submitToken]);

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <Link href="/scanner" className="text-xs text-slate-400">
            ← Events
          </Link>
          <h1 className="truncate text-lg font-bold text-white">
            {eventTitle}
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setMode("camera")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === "camera" ? "bg-accent-gradient text-white" : "text-slate-400"}`}
          >
            Camera
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode === "manual" ? "bg-accent-gradient text-white" : "text-slate-400"}`}
          >
            Search
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Scanned" value={stats.checkedIn} />
        <Stat label="Remaining" value={stats.remaining} />
        <Stat label="Total" value={stats.total} />
      </div>

      {/* Entrance selector */}
      <div className="mt-4 flex items-center gap-2">
        <label className="text-xs text-slate-400">Entrance</label>
        <input
          value={entrance}
          onChange={(e) => setEntrance(e.target.value)}
          className="input !py-2 !text-sm"
          placeholder="Main"
        />
      </div>

      {/* Result banner */}
      {outcome && (
        <ResultBanner
          outcome={outcome}
          eventId={eventId}
          canReverse={canReverse}
          onReversed={() => {
            setOutcome(null);
            refreshStats();
          }}
          onDismiss={() => setOutcome(null)}
        />
      )}

      {/* Camera / manual */}
      {mode === "camera" ? (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
            <div id="qr-reader" className="w-full" />
            {!scanning && !cameraError && (
              <div className="grid aspect-square place-items-center text-sm text-slate-400">
                Starting camera…
              </div>
            )}
            {cameraError && (
              <div className="grid aspect-square place-items-center p-6 text-center text-sm text-ember-warm">
                {cameraError}
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Point the camera at the ticket QR code. Each ticket is accepted
            once.
          </p>
        </div>
      ) : (
        <ManualSearch
          eventId={eventId}
          canReverse={canReverse}
          entrance={entrance}
          onCheckIn={(token) => submitToken(token, "manual")}
          onChanged={refreshStats}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 py-3">
      <p className="text-2xl font-black tabular-nums text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

function ResultBanner({
  outcome,
  eventId,
  canReverse,
  onReversed,
  onDismiss,
}: {
  outcome: ScanOutcome;
  eventId: string;
  canReverse: boolean;
  onReversed: () => void;
  onDismiss: () => void;
}) {
  const valid = outcome.result === "VALID";
  // Already-used tickets are a hard STOP — treat them like an invalid result
  // (big red X), then show who/when it was used.
  const used = outcome.result === "ALREADY_USED";
  const bg = valid ? "bg-emerald-500" : "bg-ember";

  async function reverse() {
    if (!outcome.ticket) return;
    // Need ticket id — search to find it, then reverse.
    const res = await fetch(
      `/api/scan/search?eventId=${eventId}&q=${encodeURIComponent(outcome.ticket.code)}`,
    );
    const data = await res.json();
    const t = data.data?.results?.[0];
    if (!t) return;
    await fetch("/api/scan/reverse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: t.id, eventId }),
    });
    onReversed();
  }

  return (
    <div
      className={`mt-4 overflow-hidden rounded-3xl ${bg} text-white shadow-glow`}
      role="status"
    >
      {/* Tier color band (creator-chosen) so staff can tell tiers apart */}
      {valid && outcome.ticket?.tierColor && (
        <div
          className="h-2 w-full"
          style={{ backgroundColor: outcome.ticket.tierColor }}
        />
      )}

      {/* Big result icon */}
      <div className="flex flex-col items-center px-5 pt-6 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white/20">
          {valid ? (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <p className="mt-3 text-3xl font-black leading-none tracking-tight">
          {valid
            ? "VALID"
            : used
              ? "ALREADY USED"
              : outcome.result.replace("_", " ")}
        </p>
        <p className="mt-1 text-sm text-white/90">{outcome.message}</p>
      </div>

      <div className="p-5">
        {outcome.ticket && (
          <div className="rounded-2xl bg-black/15 p-3 text-center text-sm">
            <p className="text-base font-bold">{outcome.ticket.holderName}</p>
            <p className="text-white/80">
              {outcome.ticket.tierName} · {outcome.ticket.code}
            </p>
          </div>
        )}

        {used && outcome.previousCheckIn && (
          <div className="mt-3 rounded-2xl bg-black/25 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-white/70">
              This QR was already used
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatDateTime(outcome.previousCheckIn.at)}
            </p>
            <p className="text-xs text-white/80">
              by {outcome.previousCheckIn.by}
              {outcome.previousCheckIn.entrance
                ? ` · ${outcome.previousCheckIn.entrance} entrance`
                : ""}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={onDismiss}
            className="rounded-full bg-white/20 px-5 py-2 text-sm font-semibold"
          >
            Next scan
          </button>
          {used && canReverse && (
            <button
              onClick={reverse}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold"
            >
              Reverse check-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualSearch({
  eventId,
  canReverse,
  entrance,
  onCheckIn,
  onChanged,
}: {
  eventId: string;
  canReverse: boolean;
  entrance: string;
  onCheckIn: (token: string) => void;
  onChanged: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(
        `/api/scan/search?eventId=${eventId}&q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      setLoading(false);
      if (res.ok) setResults(data.data.results);
    }, 300);
    return () => clearTimeout(id);
  }, [q, eventId]);

  async function reverse(id: string) {
    await fetch("/api/scan/reverse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: id, eventId }),
    });
    onChanged();
    setResults((r) =>
      r.map((x) =>
        x.id === id ? { ...x, status: "VALID", checkedInAt: null } : x,
      ),
    );
  }

  return (
    <div className="mt-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="input"
        placeholder="Search name, email, or ticket code"
        autoFocus
      />
      {loading && <p className="mt-2 text-xs text-slate-500">Searching…</p>}
      <div className="mt-3 space-y-2">
        {results.map((r) => (
          <div key={r.id} className="glass-strong flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{r.name}</p>
              <p className="truncate text-xs text-slate-400">
                {r.tier} · {r.code}
              </p>
            </div>
            {r.status === "CHECKED_IN" ? (
              <div className="flex items-center gap-2">
                <span className="chip border-neon/40 text-neon-bright">In</span>
                {canReverse && (
                  <button
                    onClick={() => reverse(r.id)}
                    className="text-xs text-ember-warm"
                  >
                    Reverse
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onCheckIn(r.qrToken)}
                className="btn-primary !py-1.5 !text-xs"
              >
                Check in
              </button>
            )}
          </div>
        ))}
        {q.length >= 2 && !loading && results.length === 0 && (
          <p className="text-sm text-slate-500">No matching attendees.</p>
        )}
      </div>
      <p className="mt-2 text-[11px] text-slate-600">Entrance: {entrance}</p>
    </div>
  );
}
