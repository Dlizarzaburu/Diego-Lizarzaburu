import QRCode from "qrcode";
import { randomToken } from "./crypto";

// A QR token is an opaque, unpredictable string. It NEVER contains personal
// information — it is only a lookup key the server validates against the DB.
export function generateQrToken(): string {
  return `S27T_${randomToken(24)}`;
}

/** The string encoded in the QR image. A scan URL keyed only by the token. */
export function qrPayload(token: string): string {
  return token;
}

/** Returns a PNG data URL for embedding in the ticket UI / emails. */
export async function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(qrPayload(token), {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
    color: { dark: "#0a0a12", light: "#ffffff" },
  });
}
