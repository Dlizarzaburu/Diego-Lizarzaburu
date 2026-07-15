import { prisma } from "@/lib/prisma";
import { route, requireApiRole, fail, type IdCtx } from "@/lib/api";
import { assertEventAccess } from "@/server/access";
import { audit } from "@/lib/audit";

// Export the attendee list as CSV (creator/admin only).
export const GET = route<IdCtx>(async (_req, { params }) => {
  const user = await requireApiRole("CREATOR", "ADMIN");
  const { id } = await params;
  const event = await assertEventAccess(id, user);

  const tickets = await prisma.ticket.findMany({
    where: { eventId: id, status: { in: ["VALID", "CHECKED_IN"] } },
    include: { user: true, tier: true },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "Ticket Code",
    "Name",
    "Email",
    "Tier",
    "Status",
    "Checked In At",
  ];
  const rows = tickets.map((t) => [
    t.code,
    t.user.name,
    t.user.email,
    t.tier.name,
    t.status,
    t.checkedInAt ? t.checkedInAt.toISOString() : "",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  await audit({
    actorId: user.id,
    action: "attendees.export",
    targetType: "event",
    targetId: id,
  });

  if (!event) return fail("Event not found", 404);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${event.slug}-attendees.csv"`,
    },
  });
});
