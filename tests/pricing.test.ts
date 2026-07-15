import { describe, it, expect } from "vitest";
import {
  computeOrderTotals,
  computeDiscount,
  computeFees,
  computeSubtotal,
} from "@/lib/pricing";

describe("pricing", () => {
  it("computes a subtotal across lines", () => {
    const subtotal = computeSubtotal([
      { unitPriceCents: 2500, quantity: 2 },
      { unitPriceCents: 6000, quantity: 1 },
    ]);
    expect(subtotal).toBe(11000);
  });

  it("applies a percentage discount, capped at subtotal", () => {
    expect(
      computeDiscount(10000, { discountType: "PERCENT", amount: 10 }),
    ).toBe(1000);
    expect(computeDiscount(500, { discountType: "FIXED", amount: 900 })).toBe(
      500,
    );
  });

  it("charges no fees on a zero (free) order", () => {
    expect(computeFees(0)).toBe(0);
  });

  it("computes order totals with fees for a paid order", () => {
    const totals = computeOrderTotals([{ unitPriceCents: 5000, quantity: 2 }]);
    expect(totals.subtotalCents).toBe(10000);
    expect(totals.feeCents).toBeGreaterThan(0);
    expect(totals.totalCents).toBe(totals.subtotalCents + totals.feeCents);
  });

  it("makes complimentary orders free", () => {
    const totals = computeOrderTotals([{ unitPriceCents: 5000, quantity: 1 }], {
      complimentary: true,
    });
    expect(totals.totalCents).toBe(0);
    expect(totals.feeCents).toBe(0);
  });
});
