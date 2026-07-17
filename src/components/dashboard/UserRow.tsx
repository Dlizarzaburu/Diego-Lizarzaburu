"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action =
  | "approveCreator"
  | "declineCreator"
  | "revokeCreator"
  | "makeAdmin"
  | "makeCustomer";

export function UserActions({
  userId,
  role,
  creatorStatus,
}: {
  userId: string;
  role: string;
  creatorStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: Action) {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {creatorStatus === "PENDING" && (
        <>
          <button
            onClick={() => act("approveCreator")}
            disabled={busy}
            className="btn-primary !py-1.5 !text-xs"
          >
            Approve organizer
          </button>
          <button
            onClick={() => act("declineCreator")}
            disabled={busy}
            className="btn-ghost !py-1.5 !text-xs text-ember-warm"
          >
            Decline
          </button>
        </>
      )}
      {role === "CREATOR" && (
        <button
          onClick={() => act("revokeCreator")}
          disabled={busy}
          className="btn-ghost !py-1.5 !text-xs text-ember-warm"
        >
          Revoke
        </button>
      )}
      {role === "CUSTOMER" && creatorStatus !== "PENDING" && (
        <button
          onClick={() => act("approveCreator")}
          disabled={busy}
          className="btn-ghost !py-1.5 !text-xs"
        >
          Make organizer
        </button>
      )}
      {role !== "ADMIN" && (
        <button
          onClick={() => act("makeAdmin")}
          disabled={busy}
          className="btn-ghost !py-1.5 !text-xs"
        >
          Make admin
        </button>
      )}
      {role === "ADMIN" && (
        <button
          onClick={() => act("makeCustomer")}
          disabled={busy}
          className="btn-ghost !py-1.5 !text-xs text-ember-warm"
        >
          Remove admin
        </button>
      )}
    </div>
  );
}
