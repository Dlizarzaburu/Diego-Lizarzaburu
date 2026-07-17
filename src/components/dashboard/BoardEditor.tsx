"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { name: string; photoUrl: string };

export function BoardEditor({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    initial.length ? initial : [{ name: "", photoUrl: "" }],
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update(i: number, patch: Partial<Row>) {
    setRows((r) =>
      r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );
  }
  function add() {
    setRows((r) => [...r, { name: "", photoUrl: "" }]);
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const members = rows
      .filter((r) => r.name.trim())
      .map((r) => ({ name: r.name.trim(), photoUrl: r.photoUrl.trim() }));
    const res = await fetch("/api/admin/board", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.ok) {
      setMsg("Saved. The homepage will show the updated board.");
      router.refresh();
    } else {
      setMsg(json.error ?? "Could not save.");
    }
  }

  return (
    <div className="space-y-4">
      {rows.map((row, i) => (
        <div
          key={i}
          className="glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/15">
            {row.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink-700 to-ink-800 text-xs text-slate-400">
                No photo
              </div>
            )}
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <input
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Full name"
              className="input"
            />
            <input
              value={row.photoUrl}
              onChange={(e) => update(i, { photoUrl: e.target.value })}
              placeholder="Photo URL (https://...)"
              className="input"
            />
          </div>
          <button
            onClick={() => remove(i)}
            className="btn-ghost !py-1.5 !text-xs text-ember-warm"
          >
            Remove
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={add} className="btn-ghost !text-sm">
          + Add member
        </button>
        <button onClick={save} disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save board"}
        </button>
        {msg && <span className="text-sm text-slate-300">{msg}</span>}
      </div>
    </div>
  );
}
