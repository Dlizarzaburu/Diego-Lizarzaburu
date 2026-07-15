import Link from "next/link";

/** Clean, text-based temporary logo for S27 Events. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="S27 Events home"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient text-sm font-black text-white shadow-glow">
        S27
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight text-white">
          S27 <span className="gradient-text">Events</span>
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Senior 2027
        </span>
      </span>
    </Link>
  );
}
