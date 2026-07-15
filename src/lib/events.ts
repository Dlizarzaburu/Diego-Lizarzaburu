// Pure, client-safe event helpers (no prisma / server imports).

export type TierLike = {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  sold: number;
  purchaseLimit: number;
  description?: string | null;
};

export type EventLike = {
  id: string;
  slug: string;
  title: string;
  category: string;
  coverImage: string;
  venueName: string;
  startsAt: string | Date;
  tiers: TierLike[];
};

export function availability(event: { tiers: TierLike[] }) {
  const total = event.tiers.reduce((s, t) => s + t.quantity, 0);
  const sold = event.tiers.reduce((s, t) => s + t.sold, 0);
  const remaining = Math.max(0, total - sold);
  const minPrice = event.tiers.length
    ? Math.min(...event.tiers.map((t) => t.priceCents))
    : 0;
  const soldOut = total > 0 && remaining <= 0;
  const limited = !soldOut && total > 0 && remaining / total <= 0.15;
  return { total, sold, remaining, minPrice, soldOut, limited };
}

export function tierRemaining(tier: { quantity: number; sold: number }) {
  return Math.max(0, tier.quantity - tier.sold);
}
