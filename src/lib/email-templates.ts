import { env } from "./env";
import { formatMoney, formatDateTime } from "./format";

const shell = (title: string, body: string) => `
<div style="background:#0a0a12;padding:32px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#e5e7eb">
  <div style="max-width:560px;margin:0 auto;background:#12121d;border:1px solid #252539;border-radius:20px;overflow:hidden">
    <div style="padding:24px 28px;background:linear-gradient(120deg,#8b5cf6,#3b82f6 55%,#ec4899);color:#fff">
      <div style="font-size:20px;font-weight:800;letter-spacing:1px">S27 EVENTS</div>
      <div style="opacity:.85;font-size:13px">Senior 2027 Events</div>
    </div>
    <div style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <div style="padding:18px 28px;border-top:1px solid #252539;font-size:12px;color:#9ca3af">
      S27 Events • ${env.appUrl} • This is a transactional message.
    </div>
  </div>
</div>`;

export function ticketConfirmationEmail(params: {
  name: string;
  eventTitle: string;
  startsAt: Date;
  venueName: string;
  tickets: { code: string; tierName: string; qrDataUrl: string }[];
  orderTotalCents: number;
  ticketsUrl: string;
}): { subject: string; html: string } {
  const ticketBlocks = params.tickets
    .map(
      (t) => `
    <div style="margin:14px 0;padding:14px;background:#0a0a12;border:1px solid #252539;border-radius:14px;text-align:center">
      <img src="${t.qrDataUrl}" width="150" height="150" alt="QR code" style="border-radius:10px;background:#fff"/>
      <div style="margin-top:8px;font-weight:700">${t.tierName}</div>
      <div style="font-family:monospace;color:#a78bfa">${t.code}</div>
    </div>`,
    )
    .join("");

  return {
    subject: `Your tickets for ${params.eventTitle}`,
    html: shell(
      `You're going to ${params.eventTitle}! 🎉`,
      `<p style="color:#cbd5e1">Hi ${params.name}, your payment was confirmed. Present the QR code(s) below at the entrance — each one is scanned once.</p>
       <p style="color:#cbd5e1"><b>When:</b> ${formatDateTime(params.startsAt)}<br/>
       <b>Where:</b> ${params.venueName}<br/>
       <b>Order total:</b> ${formatMoney(params.orderTotalCents)}</p>
       ${ticketBlocks}
       <a href="${params.ticketsUrl}" style="display:inline-block;margin-top:12px;padding:12px 20px;background:#8b5cf6;color:#fff;border-radius:999px;text-decoration:none;font-weight:700">View My Tickets</a>`,
    ),
  };
}

export function passwordResetEmail(params: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Reset your S27 Events password",
    html: shell(
      "Reset your password",
      `<p style="color:#cbd5e1">Hi ${params.name}, we received a request to reset your password. This link expires in 1 hour.</p>
       <a href="${params.resetUrl}" style="display:inline-block;margin-top:8px;padding:12px 20px;background:#3b82f6;color:#fff;border-radius:999px;text-decoration:none;font-weight:700">Reset password</a>
       <p style="color:#9ca3af;font-size:13px;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>`,
    ),
  };
}

export function ticketTransferEmail(params: {
  toName: string;
  eventTitle: string;
  fromEmail: string;
  ticketsUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `A ticket to ${params.eventTitle} was transferred to you`,
    html: shell(
      "You received a ticket 🎟️",
      `<p style="color:#cbd5e1">${params.fromEmail} transferred a ticket for <b>${params.eventTitle}</b> to your account.</p>
       <a href="${params.ticketsUrl}" style="display:inline-block;margin-top:8px;padding:12px 20px;background:#ec4899;color:#fff;border-radius:999px;text-decoration:none;font-weight:700">View My Tickets</a>`,
    ),
  };
}
