import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { User } from "@prisma/client";

/** Ensure the user owns the event (creator) or is an admin. Throws 403/404. */
export async function assertEventAccess(eventId: string, user: User) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ApiError("Event not found.", 404);
  if (user.role !== "ADMIN" && event.creatorId !== user.id)
    throw new ApiError("You don't manage this event.", 403);
  return event;
}

/** Ensure the user is assigned as staff for the event (or admin). */
export async function assertScannerAccess(eventId: string, user: User) {
  if (user.role === "ADMIN") return { canReverse: true };
  const assignment = await prisma.staffAssignment.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });
  if (!assignment)
    throw new ApiError("You are not assigned to scan this event.", 403);
  return { canReverse: assignment.canReverse };
}
