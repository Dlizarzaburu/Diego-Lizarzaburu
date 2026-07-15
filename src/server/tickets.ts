import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { ticketTransferEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";

export class TicketError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Transfer a ticket to another registered customer, if the event allows it. */
export async function transferTicket(params: {
  ticketId: string;
  fromUserId: string;
  toEmail: string;
}) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    include: { event: true, user: true },
  });
  if (!ticket || ticket.userId !== params.fromUserId)
    throw new TicketError("NOT_FOUND", "Ticket not found.");
  if (!ticket.event.transfersAllowed)
    throw new TicketError(
      "NOT_ALLOWED",
      "Transfers are disabled for this event.",
    );
  if (ticket.status !== "VALID")
    throw new TicketError(
      "BAD_STATE",
      "Only valid tickets can be transferred.",
    );

  const recipient = await prisma.user.findUnique({
    where: { email: params.toEmail.toLowerCase() },
  });
  if (!recipient)
    throw new TicketError(
      "NO_RECIPIENT",
      "The recipient needs an S27 Events account first.",
    );
  if (recipient.id === params.fromUserId)
    throw new TicketError("SELF", "You already own this ticket.");

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      userId: recipient.id,
      transferredFromEmail: ticket.user.email,
      transferredAt: new Date(),
    },
  });

  await audit({
    actorId: params.fromUserId,
    action: "ticket.transfer",
    targetType: "ticket",
    targetId: ticket.id,
    metadata: { to: recipient.email },
  });

  const { subject, html } = ticketTransferEmail({
    toName: recipient.name,
    eventTitle: ticket.event.title,
    fromEmail: ticket.user.email,
    ticketsUrl: `${env.appUrl}/account/tickets`,
  });
  await sendEmail({ to: recipient.email, subject, html });

  return updated;
}

/** Resend the confirmation/QR email for an order the customer owns. */
export async function resendTickets(orderId: string, requesterId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== requesterId)
    throw new TicketError("NOT_FOUND", "Order not found.");
  const { sendOrderConfirmation } = await import("./orders");
  await sendOrderConfirmation(orderId);
}
