import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardEditor } from "@/components/dashboard/BoardEditor";

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  await requireRole("ADMIN");
  const members = await prisma.boardMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          Executive board
        </h1>
        <p className="text-sm text-slate-400">
          Manage the Senior 2027 board shown on the homepage. Paste a photo URL
          for each member — no file upload needed.
        </p>
      </div>

      <BoardEditor
        initial={members.map((m) => ({
          name: m.name,
          photoUrl: m.photoUrl ?? "",
        }))}
      />
    </div>
  );
}
