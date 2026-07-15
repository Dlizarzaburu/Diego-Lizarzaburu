import "server-only";
import { prisma } from "@/lib/prisma";

/** Aggregate real sales metrics for a single event (creator dashboard). */
export async function eventAnalytics(eventId: string) {
  const [event, paidOrders, refundedOrders, tiers, tickets, checkIns] =
    await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.order.findMany({
        where: { eventId, status: "PAID" },
        include: { items: { include: { tier: true } } },
      }),
      prisma.order.findMany({ where: { eventId, status: "REFUNDED" } }),
      prisma.ticketTier.findMany({ where: { eventId } }),
      prisma.ticket.count({
        where: { eventId, status: { in: ["VALID", "CHECKED_IN"] } },
      }),
      prisma.ticket.count({ where: { eventId, status: "CHECKED_IN" } }),
    ]);

  const grossCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
  const feesCents = paidOrders.reduce((s, o) => s + o.feeCents, 0);
  const netCents = paidOrders.reduce(
    (s, o) => s + (o.subtotalCents - o.discountCents),
    0,
  );
  const refundsCents = refundedOrders.length; // count; amount below
  const refundAmountCents = await prisma.order
    .aggregate({
      where: { eventId, status: "REFUNDED" },
      _sum: { totalCents: true },
    })
    .then((r) => r._sum.totalCents ?? 0);

  const capacity = tiers.reduce((s, t) => s + t.quantity, 0);
  const sold = tiers.reduce((s, t) => s + t.sold, 0);

  // Sales by tier (from paid order items).
  const byTier = tiers.map((t) => {
    const qty = paidOrders
      .flatMap((o) => o.items)
      .filter((i) => i.tierId === t.id)
      .reduce((s, i) => s + i.quantity, 0);
    const revenue = paidOrders
      .flatMap((o) => o.items)
      .filter((i) => i.tierId === t.id)
      .reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);
    return {
      name: t.name,
      sold: qty,
      quantity: t.quantity,
      revenueCents: revenue,
    };
  });

  // Sales over time (paid orders grouped by day).
  const byDayMap = new Map<string, { revenueCents: number; orders: number }>();
  for (const o of paidOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    const cur = byDayMap.get(day) ?? { revenueCents: 0, orders: 0 };
    cur.revenueCents += o.totalCents;
    cur.orders += 1;
    byDayMap.set(day, cur);
  }
  const overTime = Array.from(byDayMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    event,
    grossCents,
    netCents,
    feesCents,
    refundCount: refundsCents,
    refundAmountCents,
    ticketsSold: sold,
    ticketsRemaining: Math.max(0, capacity - sold),
    capacity,
    activeTickets: tickets,
    checkIns,
    checkInRate: tickets > 0 ? checkIns / tickets : 0,
    // Payout estimate = net minus platform/processing fees already deducted.
    upcomingPayoutCents: Math.max(0, netCents - feesCents),
    byTier,
    overTime,
  };
}

/** Platform-wide analytics for the admin dashboard. */
export async function platformAnalytics() {
  const [paidAgg, refundAgg, ticketsSold, checkIns, userCount, eventCount] =
    await Promise.all([
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true, feeCents: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { status: "REFUNDED" },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.ticket.count({
        where: { status: { in: ["VALID", "CHECKED_IN"] } },
      }),
      prisma.ticket.count({ where: { status: "CHECKED_IN" } }),
      prisma.user.count(),
      prisma.event.count(),
    ]);

  const orders = await prisma.order.findMany({
    where: { status: "PAID" },
    select: { createdAt: true, totalCents: true },
  });
  const byDayMap = new Map<string, number>();
  for (const o of orders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    byDayMap.set(day, (byDayMap.get(day) ?? 0) + o.totalCents);
  }
  const overTime = Array.from(byDayMap.entries())
    .map(([date, revenueCents]) => ({ date, revenueCents }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    grossCents: paidAgg._sum.totalCents ?? 0,
    feesCents: paidAgg._sum.feeCents ?? 0,
    paidOrders: paidAgg._count,
    refundCount: refundAgg._count,
    refundAmountCents: refundAgg._sum.totalCents ?? 0,
    ticketsSold,
    checkIns,
    userCount,
    eventCount,
    overTime,
  };
}
