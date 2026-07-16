import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { formatDateTime } from "./format";

// The standard PDF fonts use WinAnsi encoding, which can't render emoji or many
// Unicode punctuation marks. Normalize common ones and drop anything outside
// the encodable range so ticket PDFs never fail to generate.
function clean(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/·/g, "-")
    // Strip anything not representable in Latin-1 (emoji, etc.)
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xFF]/g, "")
    .trim();
}

function hexToRgb(hex?: string | null) {
  const fallback = { r: 0.545, g: 0.361, b: 0.965 }; // violet #8b5cf6
  if (!hex) return fallback;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
}

export type TicketPdfData = {
  code: string;
  qrToken: string;
  tierName: string;
  eventTitle: string;
  eventStartsAt: Date;
  venueName: string;
  address: string;
  holderName: string;
  accentColor?: string | null;
  note?: string | null;
  refundsAllowed: boolean;
  transfersAllowed: boolean;
};

/**
 * Build a single-page PDF ticket: S27 Events logo, party details, and a large
 * centered QR code. Personal data (name) is printed on the ticket, but never
 * inside the QR — the QR only carries the opaque token.
 */
export async function buildTicketPdf(data: TicketPdfData): Promise<Uint8Array> {
  const W = 420;
  const H = 620;
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const accent = hexToRgb(data.accentColor);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: rgb(0.04, 0.04, 0.07),
  });
  // Accent header band
  page.drawRectangle({
    x: 0,
    y: H - 90,
    width: W,
    height: 90,
    color: rgb(accent.r, accent.g, accent.b),
  });

  // Logo lockup
  page.drawRectangle({
    x: 28,
    y: H - 66,
    width: 42,
    height: 42,
    color: rgb(1, 1, 1),
    opacity: 0.15,
  });
  page.drawText("S27", {
    x: 34,
    y: H - 55,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("S27 EVENTS", {
    x: 82,
    y: H - 44,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Senior 2027", {
    x: 82,
    y: H - 62,
    size: 10,
    font,
    color: rgb(1, 1, 1),
  });

  const white = rgb(0.95, 0.95, 0.97);
  const muted = rgb(0.62, 0.64, 0.72);

  // Event title (wrap to 2 lines if long)
  const title = clean(data.eventTitle);
  const titleSize = title.length > 26 ? 18 : 22;
  page.drawText(title.length > 40 ? title.slice(0, 40) + "..." : title, {
    x: 28,
    y: H - 130,
    size: titleSize,
    font: bold,
    color: white,
    maxWidth: W - 56,
    lineHeight: 22,
  });

  // Details
  let y = H - 170;
  const row = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), {
      x: 28,
      y,
      size: 8,
      font: bold,
      color: muted,
    });
    page.drawText(clean(value), {
      x: 28,
      y: y - 14,
      size: 12,
      font,
      color: white,
      maxWidth: W - 56,
    });
    y -= 40;
  };
  row("When", formatDateTime(data.eventStartsAt));
  row("Where", `${data.venueName} - ${data.address}`);
  row("Ticket holder", data.holderName);
  row("Tier", data.tierName);

  // QR code — large, centered
  const qrPng = await QRCode.toBuffer(data.qrToken, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 10,
    color: { dark: "#0a0a12", light: "#ffffff" },
  });
  const qrImage = await doc.embedPng(qrPng);
  const qrSize = 190;
  const qrX = (W - qrSize) / 2;
  const qrY = 96;
  // White card behind the QR
  page.drawRectangle({
    x: qrX - 12,
    y: qrY - 12,
    width: qrSize + 24,
    height: qrSize + 24,
    color: rgb(1, 1, 1),
  });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Ticket code (centered)
  const codeWidth = bold.widthOfTextAtSize(data.code, 13);
  page.drawText(data.code, {
    x: (W - codeWidth) / 2,
    y: qrY - 30,
    size: 13,
    font: bold,
    color: rgb(accent.r, accent.g, accent.b),
  });

  // Note + policy footer
  const footerLines: string[] = [];
  if (data.note) footerLines.push(clean(data.note));
  footerLines.push(
    clean(
      `${data.refundsAllowed ? "" : "Non-refundable - "}${data.transfersAllowed ? "" : "No resale/transfer - "}Scan once at entry`,
    ),
  );
  let fy = 54;
  for (const line of footerLines) {
    const wtxt = font.widthOfTextAtSize(line, 8);
    page.drawText(line, {
      x: (W - wtxt) / 2,
      y: fy,
      size: 8,
      font,
      color: muted,
      maxWidth: W - 40,
    });
    fy -= 14;
  }

  return doc.save();
}
