export function FormMessage({
  type,
  children,
}: {
  type: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-ember/40 bg-ember/10 text-ember-warm",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    info: "border-neon/40 bg-neon/10 text-neon-bright",
  }[type];
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}
