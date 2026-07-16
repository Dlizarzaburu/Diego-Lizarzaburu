// Centralised environment access. Secrets are only ever read on the server.
export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  authSecret:
    process.env.AUTH_SECRET ??
    "dev-only-insecure-secret-change-me-in-production",
  paymentsMode: (process.env.PAYMENTS_MODE ?? "dev") as
    "dev" | "stripe" | "yappy",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Yappy (Banco General, Panamá) — future integration.
  yappyMerchantId: process.env.YAPPY_MERCHANT_ID ?? "",
  yappySecret: process.env.YAPPY_SECRET ?? "",
  emailMode: (process.env.EMAIL_MODE ?? "dev") as "dev" | "resend",
  emailFrom: process.env.EMAIL_FROM ?? "S27 Events <tickets@s27events.dev>",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  isProd: process.env.NODE_ENV === "production",
};

/** Stripe is only "live" when a mode + key are configured. Otherwise dev mode. */
export const stripeConfigured =
  env.paymentsMode === "stripe" && env.stripeSecretKey.length > 0;

/** Yappy is only "live" when a mode + merchant credentials are configured. */
export const yappyConfigured =
  env.paymentsMode === "yappy" && env.yappyMerchantId.length > 0;
