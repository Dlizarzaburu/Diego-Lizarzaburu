import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availability } from "@/lib/events";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  PUBLISHED: "border-emerald-500/40 text-emerald-300",
  DRAFT: "border-amber-500/40 text-amber-300",
  UNPUBLISHED: "border-white/20 text-slate-400",
};

export default async function AdminEventsPage() {
  await requireRole("ADMIN");
  const events = await prisma.event.findMany({
    include: { tiers: true, creator: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Events</h1>
        <p className="text-sm text-slate-400">
          Every event on the platform. Click through to manage.
        </p>
      </div>

      <div className="grid gap-3">
        {events.map((e) => {
          const a = availability(e);
          return (
            <Link
              key={e.id}
              href={`/creator/events/${e.id}`}
              className="glass-strong flex flex-col gap-3 p-4 transition hover:bg-white/5 sm:flex-row sm:items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.coverImage}
                alt=""
                className="h-14 w-full rounded-lg object-cover sm:w-20"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-white">{e.title}</p>
                  <span className={`chip ${statusStyles[e.status]}`}>
                    {e.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {formatDate(e.startsAt)} · by {e.creator.name}
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-slate-500">Sold</p>
                  <p className="font-semibold text-white">
                    {a.sold}/{a.total}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">From</p>
                  <p className="font-semibold text-white">
                    {formatMoney(a.minPrice)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
