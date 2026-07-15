import { describe, it, expect } from "vitest";
import {
  registerSchema,
  checkoutSchema,
  eventInputSchema,
} from "@/lib/validation/schemas";

describe("server-side validation", () => {
  it("accepts a valid registration and normalizes email", () => {
    const parsed = registerSchema.parse({
      name: "Casey",
      email: "  Casey@Example.COM ",
      password: "supersecret",
    });
    expect(parsed.email).toBe("casey@example.com");
  });

  it("rejects short passwords", () => {
    expect(() =>
      registerSchema.parse({
        name: "Casey",
        email: "a@b.com",
        password: "123",
      }),
    ).toThrow();
  });

  it("requires at least one checkout item", () => {
    expect(() => checkoutSchema.parse({ eventId: "e1", items: [] })).toThrow();
  });

  it("requires at least one ticket tier on an event", () => {
    expect(() =>
      eventInputSchema.parse({
        title: "My Event",
        category: "Party",
        description: "A great party for everyone",
        coverImage: "https://example.com/x.jpg",
        venueName: "Hall",
        address: "1 Main St",
        startsAt: new Date().toISOString(),
        endsAt: new Date().toISOString(),
        capacity: 100,
        refundPolicy: "No refunds",
        transfersAllowed: true,
        refundsAllowed: false,
        tiers: [],
      }),
    ).toThrow();
  });
});
