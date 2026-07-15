import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserActions } from "@/components/dashboard/UserRow";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const roleStyles: Record<string, string> = {
  ADMIN: "border-magenta/40 text-magenta-bright",
  CREATOR: "border-violetx/40 text-violetx-bright",
  CUSTOMER: "border-white/10 text-slate-300",
};

export default async function AdminUsersPage() {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    orderBy: [{ creatorStatus: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { orders: true, tickets: true } },
    },
  });

  const pending = users.filter((u) => u.creatorStatus === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">People</h1>
        <p className="text-sm text-slate-400">
          Manage customers, organizers, and admins.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="glass-strong border-amber-500/30 p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-300">
            Organizer requests ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-white">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <UserActions
                  userId={u.id}
                  role={u.role}
                  creatorStatus={u.creatorStatus}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-strong overflow-x-auto p-1">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <p className="font-medium text-white">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="p-3">
                  <span className={`chip ${roleStyles[u.role]}`}>{u.role}</span>
                </td>
                <td className="p-3 text-slate-300">
                  {u._count.orders} · {u._count.tickets} tickets
                </td>
                <td className="p-3 text-slate-400">
                  {formatDate(u.createdAt)}
                </td>
                <td className="p-3">
                  <UserActions
                    userId={u.id}
                    role={u.role}
                    creatorStatus={u.creatorStatus}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
