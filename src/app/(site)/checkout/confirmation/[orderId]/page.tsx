import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { qrDataUrl } from "@/lib/qr";
import { TicketCard, type TicketView } from "@/components/TicketCard";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/checkout/confirmation/${orderId}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      tickets: { include: { tier: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!order || order.userId !== user.id) notFound();

  const paid = order.status === "PAID";

  const tickets: TicketView[] = await Promise.all(
    order.tickets.map(async (t) => ({
      id: t.id,
      code: t.code,
      tierName: t.tier.name,
      status: t.status,
      qrDataUrl: await qrDataUrl(t.qrToken),
      eventTitle: order.event.title,
      eventStartsAt: order.event.startsAt.toISOString(),
      venueName: order.event.venueName,
      holderName: user.name,
      transfersAllowed: order.event.transfersAllowed,
      refundsAllowed: order.event.refundsAllowed,
      accentColor: order.event.ticketAccentColor,
      ticketNote: order.event.ticketNote,
    })),
  );

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-2xl">
        {paid ? (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-3xl font-black text-white">
              You&apos;re in! 🎉
            </h1>
            <p className="mt-2 text-slate-400">
              Payment confirmed. Your {tickets.length} ticket
              {tickets.length === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-white">
                {order.event.title}
              </span>{" "}
              {tickets.length === 1 ? "is" : "are"} ready. A confirmation email
              is on its way.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-black text-white">
              Order {order.status.toLowerCase()}
            </h1>
            <p className="mt-2 text-slate-400">
              This order has not been completed.
            </p>
          </div>
        )}

        <div className="mt-6 glass p-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Order</span>
            <span className="font-mono text-slate-300">
              {order.id.slice(0, 12)}…
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-slate-400">Total paid</span>
            <span className="font-bold text-white">
              {formatMoney(order.totalCents)}
            </span>
          </div>
        </div>

        {tickets.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Your tickets</h2>
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/account/tickets" className="btn-primary">
            Go to My Tickets
          </Link>
          <Link href="/events" className="btn-secondary">
            Browse more events
          </Link>
        </div>
      </div>
    </div>
  );
}
