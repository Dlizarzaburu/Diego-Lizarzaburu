"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";

export function ProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg({ type: "error", text: data.error ?? "Update failed." });
      return;
    }
    setMsg({ type: "success", text: "Profile updated." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="glass-strong space-y-4 p-6">
      {msg && <FormMessage type={msg.type}>{msg.text}</FormMessage>}
      <div>
        <label className="label" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          required
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" value={email} disabled className="input opacity-60" />
        <p className="mt-1 text-xs text-slate-500">
          Contact support to change your email.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="phone">
          Phone (optional)
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={phone}
          className="input"
          placeholder="555-0100"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
