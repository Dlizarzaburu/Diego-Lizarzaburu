"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 864e5),
    h: Math.floor((ms % 864e5) / 36e5),
    m: Math.floor((ms % 36e5) / 6e4),
    s: Math.floor((ms % 6e4) / 1e3),
    done: ms <= 0,
  };
}

export function Countdown({
  target,
  compact = false,
}: {
  target: string | Date;
  compact?: boolean;
}) {
  const targetMs = new Date(target).getTime();
  const [t, setT] = useState(() => diff(targetMs));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return (
      <div className={compact ? "text-sm text-slate-300" : "flex gap-3"}>
        <span className="tabular-nums">—</span>
      </div>
    );
  }

  if (t.done) {
    return (
      <span className="chip border-magenta/40 text-magenta-bright">
        Happening now
      </span>
    );
  }

  const units = [
    { v: t.d, l: "Days" },
    { v: t.h, l: "Hrs" },
    { v: t.m, l: "Min" },
    { v: t.s, l: "Sec" },
  ];

  if (compact) {
    return (
      <span className="tabular-nums text-sm font-semibold text-white">
        {t.d}d {String(t.h).padStart(2, "0")}h {String(t.m).padStart(2, "0")}m{" "}
        {String(t.s).padStart(2, "0")}s
      </span>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      {units.map((u) => (
        <div
          key={u.l}
          className="min-w-[64px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center backdrop-blur"
        >
          <div className="text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
            {String(u.v).padStart(2, "0")}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
            {u.l}
          </div>
        </div>
      ))}
    </div>
  );
}
