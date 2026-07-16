import { notFound } from "next/navigation";
import { requireRole, canManageEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BuyersTable, type Buyer } from "@/components/dashboard/BuyersTable";

export const dynamic = "force-dynamic";

export default async function EventBuyersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CREATOR", "ADMIN");
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();
  if (!canManageEvent(user, event)) notFound();

  const orders = await prisma.order.findMany({
    where: { eventId: id, status: { in: ["PAID", "REFUNDED"] } },
    include: {
      user: true,
      items: { include: { tier: true } },
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const buyers: Buyer[] = orders.map((o) => ({
    orderId: o.id,
    name: o.user.name,
    email: o.user.email,
    phone: o.user.phone,
    tickets: o.tickets.length,
    tiers: o.items.map((i) => `${i.quantity}× ${i.tier.name}`).join(", "),
    totalCents: o.totalCents,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    checkedIn: o.tickets.filter((t) => t.status === "CHECKED_IN").length,
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Everyone who bought a ticket, with their details. Resend a QR code
        straight to a buyer&apos;s email if they can&apos;t find it.
      </p>
      <BuyersTable buyers={buyers} eventId={id} />
    </div>
  );
}
