"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to create account.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-3xl font-black text-white">Create your account</h1>
      <p className="mt-2 text-slate-400">
        Free for everyone — buy tickets to any Senior 2027 event.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <FormMessage type="error">{error}</FormMessage>}
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            className="input"
            placeholder="Casey Customer"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            placeholder="At least 8 characters"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-violetx-bright">
          Sign in
        </Link>
      </p>
    </div>
  );
}
