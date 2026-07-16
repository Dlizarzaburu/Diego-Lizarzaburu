import { prisma } from "@/lib/prisma";
import { route, fail, requireApiUser, type IdCtx } from "@/lib/api";
import { buildTicketPdf } from "@/lib/pdf-ticket";

// Download a single ticket as a branded PDF (QR centered + party details).
export const GET = route<IdCtx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { event: true, tier: true, user: true },
  });
  if (!ticket || ticket.userId !== user.id)
    return fail("Ticket not found.", 404);

  const pdf = await buildTicketPdf({
    code: ticket.code,
    qrToken: ticket.qrToken,
    tierName: ticket.tier.name,
    eventTitle: ticket.event.title,
    eventStartsAt: ticket.event.startsAt,
    venueName: ticket.event.venueName,
    address: ticket.event.address,
    holderName: ticket.user.name,
    accentColor: ticket.event.ticketAccentColor,
    note: ticket.event.ticketNote,
    refundsAllowed: ticket.event.refundsAllowed,
    transfersAllowed: ticket.event.transfersAllowed,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ticket.code}.pdf"`,
    },
  });
});
