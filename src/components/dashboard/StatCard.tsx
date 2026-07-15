export function StatCard({
  label,
  value,
  sub,
  accent = "violet",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "violet" | "blue" | "magenta" | "emerald" | "ember";
}) {
  const glow = {
    violet: "before:bg-violetx/20",
    blue: "before:bg-neon/20",
    magenta: "before:bg-magenta/20",
    emerald: "before:bg-emerald-500/20",
    ember: "before:bg-ember/20",
  }[accent];
  return (
    <div
      className={`glass-strong relative overflow-hidden p-5 before:absolute before:-right-8 before:-top-8 before:h-24 before:w-24 before:rounded-full before:blur-2xl ${glow}`}
    >
      <p className="relative text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="relative mt-1.5 text-2xl font-black text-white sm:text-3xl">
        {value}
      </p>
      {sub && <p className="relative mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
