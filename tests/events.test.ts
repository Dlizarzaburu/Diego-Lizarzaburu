import { describe, it, expect } from "vitest";
import { availability, tierRemaining } from "@/lib/events";

const tier = (
  over: Partial<{ quantity: number; sold: number; priceCents: number }>,
) => ({
  id: Math.random().toString(),
  name: "GA",
  priceCents: 2500,
  quantity: 100,
  sold: 0,
  purchaseLimit: 8,
  ...over,
});

describe("availability", () => {
  it("reports remaining strictly from quantity minus sold", () => {
    const a = availability({ tiers: [tier({ quantity: 100, sold: 40 })] });
    expect(a.remaining).toBe(60);
    expect(a.sold).toBe(40);
    expect(a.total).toBe(100);
  });

  it("flags sold out when nothing remains", () => {
    const a = availability({ tiers: [tier({ quantity: 50, sold: 50 })] });
    expect(a.soldOut).toBe(true);
    expect(a.remaining).toBe(0);
  });

  it("flags limited availability at/under 15% remaining", () => {
    const a = availability({ tiers: [tier({ quantity: 100, sold: 90 })] });
    expect(a.limited).toBe(true);
    expect(a.soldOut).toBe(false);
  });

  it("takes the minimum price across tiers", () => {
    const a = availability({
      tiers: [tier({ priceCents: 6000 }), tier({ priceCents: 2500 })],
    });
    expect(a.minPrice).toBe(2500);
  });

  it("never returns negative remaining", () => {
    expect(tierRemaining({ quantity: 10, sold: 15 })).toBe(0);
  });
});
