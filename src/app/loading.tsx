export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-violetx" />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  );
}
