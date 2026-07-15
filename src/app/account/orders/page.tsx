import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrdersList, type OrderView } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: "Order History" };
export const dynamic = "force-dynamic";

const REFUND_WINDOW_DAYS = 7;

export default async function OrdersPage() {
  const user = await requireUser();

  const orders = await prisma.order.findMany({
    where: { userId: user.id, status: { not: "PENDING" } },
    include: { event: true, _count: { select: { tickets: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const views: OrderView[] = orders.map((o) => ({
    id: o.id,
    eventTitle: o.event.title,
    eventStartsAt: o.event.startsAt.toISOString(),
    status: o.status,
    totalCents: o.totalCents,
    ticketCount: o._count.tickets,
    createdAt: o.createdAt.toISOString(),
    refundEligible:
      o.status === "PAID" &&
      o.event.refundsAllowed &&
      o.event.startsAt.getTime() - now > REFUND_WINDOW_DAYS * 864e5,
  }));

  return (
    <div>
      <h1 className="mb-1 text-3xl font-black text-white">Order History</h1>
      <p className="mb-8 text-slate-400">
        View past orders, resend tickets, or request a refund where the event
        policy allows.
      </p>
      <OrdersList orders={views} />
    </div>
  );
}
