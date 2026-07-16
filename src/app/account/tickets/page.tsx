import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { qrDataUrl } from "@/lib/qr";
import { MyTickets } from "@/components/account/MyTickets";
import type { TicketView } from "@/components/TicketCard";

export const metadata: Metadata = { title: "My Tickets" };
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const user = await requireUser();

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id, status: { in: ["VALID", "CHECKED_IN"] } },
    include: { event: true, tier: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  const now = Date.now();
  const views: (TicketView & { startsMs: number })[] = await Promise.all(
    tickets.map(async (t) => ({
      id: t.id,
      code: t.code,
      tierName: t.tier.name,
      status: t.status,
      qrDataUrl: await qrDataUrl(t.qrToken),
      eventTitle: t.event.title,
      eventStartsAt: t.event.startsAt.toISOString(),
      venueName: t.event.venueName,
      holderName: user.name,
      transfersAllowed: t.event.transfersAllowed,
      refundsAllowed: t.event.refundsAllowed,
      accentColor: t.event.ticketAccentColor,
      ticketNote: t.event.ticketNote,
      startsMs: t.event.startsAt.getTime(),
    })),
  );

  const upcoming = views.filter((v) => v.startsMs >= now);
  const past = views.filter((v) => v.startsMs < now);

  return (
    <div>
      <h1 className="mb-1 text-3xl font-black text-white">My Tickets</h1>
      <p className="mb-8 text-slate-400">
        Present the QR code at the entrance. Each ticket is scanned once.
      </p>
      <MyTickets upcoming={upcoming} past={past} />
    </div>
  );
}
