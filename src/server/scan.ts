import "server-only";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import type { ScanResult } from "@prisma/client";

export type ScanOutcome = {
  result: ScanResult;
  message: string;
  ticket?: {
    code: string;
    tierName: string;
    holderName: string;
    status: string;
  };
  previousCheckIn?: {
    at: string;
    by: string;
    entrance: string | null;
  };
};

/**
 * Validate a scanned QR token against an event and check the ticket in.
 * Uses a conditional update so the same ticket cannot be checked in twice, even
 * under concurrent scans at multiple entrances.
 */
export async function scanTicket(params: {
  token: string;
  eventId: string;
  scannerId: string;
  entrance?: string;
  device?: string;
}): Promise<ScanOutcome> {
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: params.token },
    include: { tier: true, user: true, event: true },
  });

  const logAndReturn = async (
    result: ScanResult,
    message: string,
    extra?: Partial<ScanOutcome>,
  ): Promise<ScanOutcome> => {
    await prisma.checkInLog.create({
      data: {
        ticketId: ticket?.id,
        eventId: params.eventId,
        scannerId: params.scannerId,
        result,
        entrance: params.entrance,
        device: params.device,
        scannedToken: ticket ? undefined : params.token.slice(0, 12),
      },
    });
    return { result, message, ...extra };
  };

  if (!ticket) return logAndReturn("INVALID", "Ticket not found.");
  if (ticket.eventId !== params.eventId)
    return logAndReturn("WRONG_EVENT", "This ticket is for a different event.");
  if (ticket.status === "CANCELLED" || ticket.status === "REFUNDED")
    return logAndReturn(
      "CANCELLED",
      `Ticket is ${ticket.status.toLowerCase()}.`,
    );

  if (ticket.status === "CHECKED_IN") {
    const last = await prisma.checkInLog.findFirst({
      where: { ticketId: ticket.id, result: "VALID" },
      orderBy: { createdAt: "desc" },
      include: { scanner: true },
    });
    return logAndReturn("ALREADY_USED", "Ticket already scanned.", {
      ticket: {
        code: ticket.code,
        tierName: ticket.tier.name,
        holderName: ticket.user.name,
        status: ticket.status,
      },
      previousCheckIn: last
        ? {
            at: (ticket.checkedInAt ?? last.createdAt).toISOString(),
            by: last.scanner.name,
            entrance: last.entrance,
          }
        : undefined,
    });
  }

  // Atomic check-in: only transitions VALID -> CHECKED_IN once.
  const updated = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: "VALID" },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
      checkedInBy: params.scannerId,
      entrance: params.entrance,
    },
  });
  if (updated.count === 0) {
    // Lost the race — someone else just checked it in.
    return logAndReturn("ALREADY_USED", "Ticket already scanned.");
  }

  return logAndReturn("VALID", "Welcome! Valid ticket.", {
    ticket: {
      code: ticket.code,
      tierName: ticket.tier.name,
      holderName: ticket.user.name,
      status: "CHECKED_IN",
    },
  });
}

/** Supervisor-only reversal of an accidental check-in. */
export async function reverseCheckIn(params: {
  ticketId: string;
  eventId: string;
  supervisorId: string;
}): Promise<{ ok: boolean; message: string }> {
  const ticket = await prisma.ticket.findFirst({
    where: { id: params.ticketId, eventId: params.eventId },
  });
  if (!ticket)
    return { ok: false, message: "Ticket not found for this event." };
  if (ticket.status !== "CHECKED_IN")
    return { ok: false, message: "Ticket is not checked in." };

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "VALID",
      checkedInAt: null,
      checkedInBy: null,
      entrance: null,
    },
  });
  await prisma.checkInLog.create({
    data: {
      ticketId: ticket.id,
      eventId: params.eventId,
      scannerId: params.supervisorId,
      result: "REVERSED",
    },
  });
  await audit({
    actorId: params.supervisorId,
    action: "checkin.reverse",
    targetType: "ticket",
    targetId: ticket.id,
  });
  return { ok: true, message: "Check-in reversed." };
}

export async function eventScanStats(eventId: string) {
  const [total, checkedIn] = await Promise.all([
    prisma.ticket.count({
      where: { eventId, status: { in: ["VALID", "CHECKED_IN"] } },
    }),
    prisma.ticket.count({ where: { eventId, status: "CHECKED_IN" } }),
  ]);
  return { total, checkedIn, remaining: total - checkedIn };
}
