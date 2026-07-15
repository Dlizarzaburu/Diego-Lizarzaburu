"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to sign in.");
      return;
    }
    const dest =
      data.data.role === "ADMIN"
        ? "/admin"
        : data.data.role === "CREATOR"
          ? "/creator"
          : next;
    router.push(dest);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-3xl font-black text-white">Welcome back</h1>
      <p className="mt-2 text-slate-400">
        Sign in to access your tickets and orders.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <FormMessage type="error">{error}</FormMessage>}
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
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs link-muted">
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        New here?{" "}
        <Link href="/register" className="font-semibold text-violetx-bright">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Demo accounts</p>
        <p className="mt-1">
          Password for all:{" "}
          <code className="text-violetx-bright">Password123!</code>
        </p>
        <ul className="mt-1 space-y-0.5">
          <li>customer@s27events.dev · admin@s27events.dev</li>
          <li>creator@s27events.dev · staff@s27events.dev</li>
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
