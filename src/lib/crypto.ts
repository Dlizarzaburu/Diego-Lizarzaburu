import crypto from "crypto";
import { env } from "./env";

/** URL-safe random token (unpredictable). Used for sessions, QR tokens, resets. */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Short human-friendly ticket code, e.g. S27-7F3K-9Q2M. */
export function ticketCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from(
      { length: 4 },
      () => alphabet[crypto.randomInt(0, alphabet.length)],
    ).join("");
  return `S27-${block()}-${block()}`;
}

/** HMAC signature over a session token, so a stolen DB row alone can't be forged. */
export function signValue(value: string): string {
  return crypto
    .createHmac("sha256", env.authSecret)
    .update(value)
    .digest("base64url");
}

export function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
