import { notFound } from "next/navigation";
import { requireRole, canManageEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  EventForm,
  type EventFormValues,
} from "@/components/dashboard/EventForm";

export const dynamic = "force-dynamic";

function toLocalInput(d: Date) {
  // Format a Date as a value for <input type="datetime-local"> (local time).
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CREATOR", "ADMIN");
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) notFound();
  if (!canManageEvent(user, event)) notFound();

  const initial: EventFormValues = {
    id: event.id,
    title: event.title,
    category: event.category,
    description: event.description,
    coverImage: event.coverImage,
    venueName: event.venueName,
    address: event.address,
    mapUrl: event.mapUrl ?? "",
    startsAt: toLocalInput(event.startsAt),
    endsAt: toLocalInput(event.endsAt),
    capacity: String(event.capacity),
    ageRequirement: event.ageRequirement ?? "",
    refundPolicy: event.refundPolicy,
    transfersAllowed: event.transfersAllowed,
    refundsAllowed: event.refundsAllowed,
    commissionFee: (event.commissionFeeCents / 100).toString(),
    consentRequirement: event.consentRequirement,
    consentFormUrl: event.consentFormUrl ?? "",
    ticketAccentColor: event.ticketAccentColor ?? "#8b5cf6",
    ticketNote: event.ticketNote ?? "",
    tiers: event.tiers.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      price: (t.priceCents / 100).toString(),
      quantity: String(t.quantity),
      purchaseLimit: String(t.purchaseLimit),
      password: t.password ?? "",
    })),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black text-white sm:text-3xl">
        Edit event
      </h1>
      <EventForm mode="edit" initial={initial} />
    </div>
  );
}
