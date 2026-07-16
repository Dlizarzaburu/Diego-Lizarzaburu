import type { DiscountType } from "@prisma/client";

export type FeeConfig = {
  platformFeeBps: number;
  processingFeeBps: number;
  processingFeeFixedCents: number;
};

export const DEFAULT_FEES: FeeConfig = {
  platformFeeBps: 300,
  processingFeeBps: 290,
  processingFeeFixedCents: 89,
};

export type CartLine = { unitPriceCents: number; quantity: number };

export function computeSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
}

export function computeDiscount(
  subtotalCents: number,
  promo?: { discountType: DiscountType; amount: number } | null,
): number {
  if (!promo) return 0;
  if (promo.discountType === "PERCENT") {
    return Math.min(
      subtotalCents,
      Math.round((subtotalCents * promo.amount) / 100),
    );
  }
  return Math.min(subtotalCents, promo.amount);
}

/** Fees apply only to paid amounts (never on free/complimentary orders). */
export function computeFees(
  netCents: number,
  fees: FeeConfig = DEFAULT_FEES,
): number {
  if (netCents <= 0) return 0;
  const platform = Math.round((netCents * fees.platformFeeBps) / 10000);
  const processing =
    Math.round((netCents * fees.processingFeeBps) / 10000) +
    fees.processingFeeFixedCents;
  return platform + processing;
}

export type OrderTotals = {
  subtotalCents: number;
  discountCents: number;
  commissionCents: number;
  feeCents: number;
  totalCents: number;
};

export type CommissionSpec = {
  type: "FIXED" | "PERCENT";
  perTicketCents: number; // used when type === FIXED
  percentBps: number; // used when type === PERCENT (basis points)
};

export function computeCommission(
  spec: CommissionSpec | undefined,
  subtotalCents: number,
  ticketCount: number,
): number {
  if (!spec) return 0;
  if (spec.type === "PERCENT")
    return Math.round((subtotalCents * spec.percentBps) / 10000);
  return spec.perTicketCents * ticketCount;
}

export function computeOrderTotals(
  lines: CartLine[],
  opts: {
    promo?: { discountType: DiscountType; amount: number } | null;
    fees?: FeeConfig;
    complimentary?: boolean;
    // Optional organizer commission (fixed per ticket or a percentage).
    commission?: CommissionSpec;
  } = {},
): OrderTotals {
  const subtotalCents = computeSubtotal(lines);
  const discountCents = computeDiscount(subtotalCents, opts.promo);
  const ticketCount = lines.reduce((s, l) => s + l.quantity, 0);
  const commissionCents = opts.complimentary
    ? 0
    : computeCommission(opts.commission, subtotalCents, ticketCount);
  const net = subtotalCents - discountCents;
  const feeCents = opts.complimentary ? 0 : computeFees(net, opts.fees);
  const totalCents = opts.complimentary ? 0 : net + commissionCents + feeCents;
  return {
    subtotalCents,
    discountCents,
    commissionCents,
    feeCents,
    totalCents,
  };
}
