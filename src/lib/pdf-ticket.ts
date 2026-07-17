import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { formatDateTime } from "./format";

// The standard PDF fonts use WinAnsi encoding, which can't render emoji or many
// Unicode punctuation marks. Normalize common ones and drop anything outside
// the encodable range so ticket PDFs never fail to generate.
function clean(s: string): string {
  return (
    s
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/·/g, "-")
      // Strip anything not representable in Latin-1 (emoji, etc.)
      // eslint-disable-next-line no-control-regex
      .replace(/[^\x00-\xFF]/g, "")
      .trim()
  );
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
 * Build a single-page Halloween-styled PDF ticket: circular S27 badge, party
 * details, and a large QR "moon" framed in a circle. Personal data (name) is
 * printed on the ticket, but never inside the QR — the QR only carries the
 * opaque token. When the creator has disabled refunds/transfers, a prominent
 * non-refundable / no-reselling notice is printed.
 */
export async function buildTicketPdf(data: TicketPdfData): Promise<Uint8Array> {
  const W = 420;
  const H = 640;
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const accent = hexToRgb(data.accentColor);
  const accentColor = rgb(accent.r, accent.g, accent.b);
  const pumpkin = rgb(1, 0.46, 0.09); // #ff7518 Halloween orange
  const white = rgb(0.95, 0.95, 0.97);
  const muted = rgb(0.62, 0.64, 0.72);

  const centered = (
    text: string,
    y: number,
    size: number,
    f = font,
    color = white,
  ) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (W - w) / 2, y, size, font: f, color });
  };

  // Dark background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: rgb(0.04, 0.04, 0.07),
  });

  // Decorative "confetti" circles (spooky dots) scattered around the edges.
  const dots: Array<[number, number, number, ReturnType<typeof rgb>, number]> =
    [
      [40, H - 150, 6, pumpkin, 0.5],
      [W - 46, H - 120, 9, accentColor, 0.45],
      [W - 30, H - 210, 4, pumpkin, 0.6],
      [24, H - 250, 5, accentColor, 0.5],
      [W - 60, 250, 7, pumpkin, 0.4],
      [34, 210, 5, accentColor, 0.5],
      [W - 34, 150, 6, pumpkin, 0.5],
      [50, 120, 4, accentColor, 0.5],
    ];
  for (const [x, y, s, c, o] of dots) {
    page.drawCircle({ x, y, size: s, color: c, opacity: o });
  }

  // Circular S27 badge (logo lockup) — a circle, not a box.
  page.drawCircle({ x: 52, y: H - 58, size: 24, color: pumpkin });
  page.drawCircle({
    x: 52,
    y: H - 58,
    size: 24,
    borderColor: white,
    borderWidth: 1.5,
  });
  centeredIn(page, bold, "S27", 52, H - 63, 15, rgb(0.04, 0.04, 0.07));
  page.drawText("S27 EVENTS", {
    x: 88,
    y: H - 52,
    size: 18,
    font: bold,
    color: white,
  });
  page.drawText("Senior 2027 - Halloween", {
    x: 88,
    y: H - 70,
    size: 9,
    font,
    color: pumpkin,
  });

  // Event title (centered, wraps if long)
  const title = clean(data.eventTitle);
  const titleSize = title.length > 24 ? 19 : 24;
  centered(
    title.length > 40 ? title.slice(0, 40) + "..." : title,
    H - 108,
    titleSize,
    bold,
    white,
  );

  // Tier "pill" — rounded (circle-capped) badge instead of a plain box.
  const tierText = clean(data.tierName).toUpperCase();
  const tierTextW = bold.widthOfTextAtSize(tierText, 9);
  const pillW = tierTextW + 26;
  const pillH = 20;
  const pillX = (W - pillW) / 2;
  const pillY = H - 138;
  page.drawCircle({
    x: pillX + pillH / 2,
    y: pillY + pillH / 2,
    size: pillH / 2,
    color: accentColor,
  });
  page.drawCircle({
    x: pillX + pillW - pillH / 2,
    y: pillY + pillH / 2,
    size: pillH / 2,
    color: accentColor,
  });
  page.drawRectangle({
    x: pillX + pillH / 2,
    y: pillY,
    width: pillW - pillH,
    height: pillH,
    color: accentColor,
  });
  centered(tierText, pillY + 6, 9, bold, rgb(1, 1, 1));

  // Details
  let y = H - 180;
  const row = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), {
      x: 40,
      y,
      size: 8,
      font: bold,
      color: pumpkin,
    });
    page.drawText(clean(value), {
      x: 40,
      y: y - 14,
      size: 12,
      font,
      color: white,
      maxWidth: W - 80,
    });
    y -= 38;
  };
  row("When", formatDateTime(data.eventStartsAt));
  row("Where", `${data.venueName} - ${data.address}`);
  row("Ticket holder", data.holderName);

  // QR "moon": a white circle behind the square QR.
  const qrPng = await QRCode.toBuffer(data.qrToken, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 10,
    color: { dark: "#0a0a12", light: "#ffffff" },
  });
  const qrImage = await doc.embedPng(qrPng);
  const qrSize = 168;
  const cx = W / 2;
  const cy = 168;
  // Outer glow ring + white moon
  page.drawCircle({
    x: cx,
    y: cy,
    size: qrSize / 2 + 26,
    color: pumpkin,
    opacity: 0.18,
  });
  page.drawCircle({ x: cx, y: cy, size: qrSize / 2 + 16, color: rgb(1, 1, 1) });
  page.drawImage(qrImage, {
    x: cx - qrSize / 2,
    y: cy - qrSize / 2,
    width: qrSize,
    height: qrSize,
  });

  // Ticket code (centered, accent)
  centered(data.code, cy - qrSize / 2 - 28, 13, bold, accentColor);

  // Optional note from the creator
  let fy = 70;
  if (data.note) {
    centered(clean(data.note), fy, 8, font, muted);
    fy -= 16;
  }

  // Prominent non-refundable / no-reselling notice (creator-controlled via the
  // event's refund/transfer settings).
  const warnings: string[] = [];
  if (!data.refundsAllowed) warnings.push("NON-REFUNDABLE TICKET");
  if (!data.transfersAllowed) warnings.push("NO RESELLING / NO TRANSFERS");
  if (warnings.length > 0) {
    centered(warnings.join("  -  "), fy, 10, bold, pumpkin);
    fy -= 16;
  }
  centered("Scan once at entry - Senior 2027", fy, 8, font, muted);

  return doc.save();
}

// Draw text horizontally centered on a given x anchor.
function centeredIn(
  page: import("pdf-lib").PDFPage,
  f: import("pdf-lib").PDFFont,
  text: string,
  cx: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const w = f.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y, size, font: f, color });
}
