import { describe, it, expect } from "vitest";
import { devSignature, verifyDevPayment } from "@/lib/payments";

describe("dev payment verification", () => {
  it("verifies a correctly signed payment", () => {
    const intentId = "pi_dev_abc123";
    const orderId = "order_1";
    const amountCents = 5000;
    const signature = devSignature(intentId, orderId, amountCents);
    expect(
      verifyDevPayment({ intentId, orderId, amountCents, signature }),
    ).toBe(true);
  });

  it("rejects a tampered amount", () => {
    const intentId = "pi_dev_abc123";
    const orderId = "order_1";
    const signature = devSignature(intentId, orderId, 5000);
    expect(
      verifyDevPayment({ intentId, orderId, amountCents: 100, signature }),
    ).toBe(false);
  });

  it("rejects a forged signature", () => {
    expect(
      verifyDevPayment({
        intentId: "pi_dev_x",
        orderId: "order_1",
        amountCents: 5000,
        signature: "0".repeat(24),
      }),
    ).toBe(false);
  });
});
