import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

export const requestResetSchema = z.object({ email: emailSchema });

export const performResetSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const tierInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  priceCents: z.number().int().min(0).max(10_000_00),
  quantity: z.number().int().min(1).max(100_000),
  purchaseLimit: z.number().int().min(1).max(50),
  salesStart: z.string().datetime().optional().nullable(),
  salesEnd: z.string().datetime().optional().nullable(),
  password: z.string().trim().max(60).optional().or(z.literal("")),
});

export const eventInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(5000),
  coverImage: z.string().trim().url().max(500),
  venueName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(200),
  mapUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  capacity: z.number().int().min(1).max(200_000),
  ageRequirement: z.string().trim().max(60).optional().or(z.literal("")),
  refundPolicy: z.string().trim().min(2).max(1000),
  transfersAllowed: z.boolean(),
  refundsAllowed: z.boolean(),
  featured: z.boolean().optional(),
  commissionFeeCents: z.number().int().min(0).max(100_00).optional(),
  consentRequirement: z.enum(["NONE", "UNDERAGE", "ALL"]).optional(),
  consentFormUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  ticketAccentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #8b5cf6")
    .optional()
    .or(z.literal("")),
  ticketNote: z.string().trim().max(200).optional().or(z.literal("")),
  tiers: z.array(tierInputSchema).min(1, "Add at least one ticket tier"),
});

export const checkoutSchema = z.object({
  eventId: z.string().min(1),
  items: z
    .array(
      z.object({
        tierId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        // Password for private tiers that require one.
        password: z.string().trim().max(60).optional().or(z.literal("")),
      }),
    )
    .min(1, "Select at least one ticket"),
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
  // Consent acknowledgement when the event requires a signed form.
  consentAccepted: z.boolean().optional(),
});

export const confirmPaymentSchema = z.object({
  orderId: z.string().min(1),
  intentId: z.string().min(1),
  amountCents: z.number().int().min(0),
  signature: z.string().min(1),
});

export const promoInputSchema = z.object({
  code: z.string().trim().min(2).max(40),
  discountType: z.enum(["PERCENT", "FIXED"]),
  amount: z.number().int().min(1),
  maxUses: z.number().int().min(1).nullable().optional(),
});

export const scanSchema = z.object({
  token: z.string().trim().min(4).max(200),
  eventId: z.string().min(1),
  entrance: z.string().trim().max(60).optional().or(z.literal("")),
  device: z.string().trim().max(120).optional().or(z.literal("")),
});

export const transferSchema = z.object({
  ticketId: z.string().min(1),
  toEmail: emailSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
