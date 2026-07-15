import { describe, it, expect } from "vitest";
import { generateQrToken, qrPayload } from "@/lib/qr";
import { ticketCode, randomToken } from "@/lib/crypto";

describe("QR tokens", () => {
  it("generates opaque, unpredictable tokens", () => {
    const a = generateQrToken();
    const b = generateQrToken();
    expect(a).not.toEqual(b);
    expect(a.startsWith("S27T_")).toBe(true);
    expect(a.length).toBeGreaterThan(20);
  });

  it("never embeds personal information in the payload", () => {
    const token = generateQrToken();
    const payload = qrPayload(token);
    // Payload is just the token — no email/name/PII shape.
    expect(payload).toBe(token);
    expect(payload).not.toMatch(/@/);
  });

  it("produces unique tokens across many generations", () => {
    const set = new Set(Array.from({ length: 1000 }, () => generateQrToken()));
    expect(set.size).toBe(1000);
  });
});

describe("crypto helpers", () => {
  it("formats ticket codes as S27-XXXX-XXXX", () => {
    expect(ticketCode()).toMatch(/^S27-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("random tokens are url-safe and unique", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
