import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ScannerHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/scanner");

  // Events this user can scan: admins see all, staff see their assignments.
  const events =
    user.role === "ADMIN"
      ? await prisma.event.findMany({
          where: { status: { in: ["PUBLISHED", "UNPUBLISHED"] } },
          orderBy: { startsAt: "asc" },
        })
      : (
          await prisma.staffAssignment.findMany({
            where: { userId: user.id },
            include: { event: true },
            orderBy: { event: { startsAt: "asc" } },
          })
        ).map((a) => a.event);

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <Link href="/account" className="text-sm text-slate-400">
          Exit
        </Link>
      </div>

      <div className="mt-10">
        <h1 className="text-3xl font-black text-white">Entrance scanner</h1>
        <p className="mt-2 text-slate-400">
          Signed in as {user.name}. Select an event to start scanning.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="glass mt-8 grid place-items-center gap-2 py-14 text-center">
          <p className="text-slate-400">
            You are not assigned to scan any events yet.
          </p>
          <p className="text-xs text-slate-500">
            Ask the event organizer to add you as scanner staff.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/scanner/${e.id}`}
              className="glass-strong flex items-center gap-4 p-4 transition active:scale-[0.99]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.coverImage}
                alt=""
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{e.title}</p>
                <p className="text-sm text-slate-400">
                  {formatDateTime(e.startsAt)}
                </p>
              </div>
              <span className="text-violetx-bright">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
