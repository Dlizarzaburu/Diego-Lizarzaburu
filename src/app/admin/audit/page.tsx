import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireRole("ADMIN");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { actor: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          Audit log
        </h1>
        <p className="text-sm text-slate-400">
          Append-only record of sensitive actions (refunds, role changes,
          check-in reversals, and more).
        </p>
      </div>

      <div className="glass-strong overflow-x-auto p-1">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Action</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Target</th>
              <th className="p-3">Details</th>
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id}>
                  <td className="p-3">
                    <span className="chip font-mono">{l.action}</span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {l.actor?.name ?? "system"}
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {l.targetType}
                    {l.targetId ? ` · ${l.targetId.slice(0, 8)}` : ""}
                  </td>
                  <td className="p-3 text-xs text-slate-400">
                    {l.metadata ? JSON.stringify(l.metadata) : "—"}
                  </td>
                  <td className="p-3 text-xs text-slate-400">
                    {formatDateTime(l.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
