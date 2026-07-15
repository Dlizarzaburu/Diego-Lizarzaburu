import { prisma } from "@/lib/prisma";
import { handler, ok, fail, requireApiUser } from "@/lib/api";
import { assertScannerAccess } from "@/server/access";

// Manual attendee lookup by name, email, or ticket code (scoped to one event).
export const GET = handler(async (req) => {
  const user = await requireApiUser();
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!eventId) return fail("Missing eventId.", 400);
  await assertScannerAccess(eventId, user);
  if (q.length < 2) return ok({ results: [] });

  const tickets = await prisma.ticket.findMany({
    where: {
      eventId,
      status: { in: ["VALID", "CHECKED_IN"] },
      OR: [
        { code: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { user: true, tier: true },
    take: 15,
  });

  return ok({
    results: tickets.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.user.name,
      email: t.user.email,
      tier: t.tier.name,
      status: t.status,
      qrToken: t.qrToken,
      checkedInAt: t.checkedInAt?.toISOString() ?? null,
    })),
  });
});
