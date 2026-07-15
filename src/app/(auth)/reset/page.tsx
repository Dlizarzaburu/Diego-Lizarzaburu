"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.get("password") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to reset password.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) {
    return (
      <FormMessage type="error">Missing or invalid reset token.</FormMessage>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-black text-white">Choose a new password</h1>
      {done ? (
        <div className="mt-8">
          <FormMessage type="success">
            Password updated! Redirecting you to sign in…
          </FormMessage>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && <FormMessage type="error">{error}</FormMessage>}
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-slate-400">
        <Link href="/login" className="font-semibold text-violetx-bright">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
