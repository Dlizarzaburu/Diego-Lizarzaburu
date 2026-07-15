import { prisma } from "@/lib/prisma";
import type { Event, TicketTier } from "@prisma/client";

export { availability, tierRemaining } from "@/lib/events";

export type EventWithTiers = Event & { tiers: TicketTier[] };

export async function getPublishedEvents() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { startsAt: "asc" },
  });
  return events;
}

export async function getFeaturedEvent() {
  const now = new Date();
  const featured = await prisma.event.findFirst({
    where: { status: "PUBLISHED", featured: true, startsAt: { gte: now } },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { startsAt: "asc" },
  });
  if (featured) return featured;
  // Fall back to the soonest upcoming event.
  return prisma.event.findFirst({
    where: { status: "PUBLISHED", startsAt: { gte: now } },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { startsAt: "asc" },
  });
}

export async function getNextEvent() {
  return prisma.event.findFirst({
    where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
}

export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      tiers: { orderBy: { sortOrder: "asc" } },
      creator: { select: { name: true } },
    },
  });
}

export async function getRelatedEvents(eventId: string, category: string) {
  return prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: eventId },
      startsAt: { gte: new Date() },
    },
    include: { tiers: true },
    orderBy: [{ category: category ? "asc" : "asc" }, { startsAt: "asc" }],
    take: 3,
  });
}
