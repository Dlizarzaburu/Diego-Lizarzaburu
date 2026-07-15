"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";
import type { Role, CreatorStatus } from "@prisma/client";

export function ApplyOrganizer({
  role,
  creatorStatus,
}: {
  role: Role;
  creatorStatus: CreatorStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(creatorStatus === "PENDING");

  if (role === "CREATOR" || role === "ADMIN") {
    return (
      <div className="space-y-4">
        <FormMessage type="success">
          You already have organizer access.
        </FormMessage>
        <Link href="/creator" className="btn-primary">
          Go to Organizer Dashboard
        </Link>
      </div>
    );
  }

  if (applied) {
    return (
      <FormMessage type="info">
        Your application is pending review. An administrator will approve your
        organizer access soon.
      </FormMessage>
    );
  }

  async function apply() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/creator/apply", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Could not submit application.");
    setApplied(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <FormMessage type="error">{error}</FormMessage>}
      <button onClick={apply} disabled={loading} className="btn-primary">
        {loading ? "Submitting…" : "Apply to become an organizer"}
      </button>
    </div>
  );
}
