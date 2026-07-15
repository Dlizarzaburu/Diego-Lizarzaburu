import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "@/components/EventCard";
import type { EventLike } from "@/lib/events";

const baseEvent: EventLike = {
  id: "e1",
  slug: "halloween-bash",
  title: "Senior 2027 Halloween Bash",
  category: "Party",
  coverImage: "https://example.com/cover.jpg",
  venueName: "The Warehouse Loft",
  startsAt: new Date("2027-10-31T20:00:00Z").toISOString(),
  tiers: [
    {
      id: "t1",
      name: "GA",
      priceCents: 2500,
      quantity: 100,
      sold: 40,
      purchaseLimit: 8,
    },
  ],
};

describe("EventCard", () => {
  it("renders event name, venue, category, and starting price", () => {
    render(<EventCard event={baseEvent} />);
    expect(screen.getByText("Senior 2027 Halloween Bash")).toBeDefined();
    expect(screen.getByText("The Warehouse Loft")).toBeDefined();
    expect(screen.getByText("Party")).toBeDefined();
    expect(screen.getByText("$25.00")).toBeDefined();
  });

  it("shows a Sold out label only when a tier is exhausted", () => {
    const soldOut: EventLike = {
      ...baseEvent,
      tiers: [{ ...baseEvent.tiers[0], sold: 100 }],
    };
    render(<EventCard event={soldOut} />);
    expect(screen.getByText("Sold out")).toBeDefined();
  });
});
