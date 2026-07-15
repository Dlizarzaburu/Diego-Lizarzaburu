"use client";

import { useState } from "react";
import Link from "next/link";
import { FormMessage } from "@/components/FormMessage";

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setLoading(false);
    setDone(true);
  }

  return (
    <div>
      <h1 className="text-3xl font-black text-white">Reset your password</h1>
      <p className="mt-2 text-slate-400">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {done ? (
        <div className="mt-8 space-y-4">
          <FormMessage type="success">
            If an account exists for that email, a reset link is on its way. In
            development, check the <code>dev-outbox</code> folder.
          </FormMessage>
          <Link href="/login" className="btn-secondary w-full">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-violetx-bright">
          Sign in
        </Link>
      </p>
    </div>
  );
}
