import "server-only";
import crypto from "crypto";
import { env, stripeConfigured, yappyConfigured } from "./env";

// Payment provider abstraction.
//
// The application always talks to this module, never to Stripe directly, so the
// rest of the codebase is provider-agnostic and testable. Tickets are only ever
// issued after a *verified* payment event (see the webhook route), never
// optimistically at checkout time.
//
// - DEV mode (default): no Stripe keys required. `createPaymentIntent` returns a
//   synthetic client secret; the confirmation is verified by an HMAC we control,
//   simulating a provider webhook end-to-end so the full flow is exercisable.
// - STRIPE mode: set PAYMENTS_MODE=stripe + STRIPE_SECRET_KEY and the same
//   functions call the Stripe REST API. Webhook verification uses
//   STRIPE_WEBHOOK_SECRET.

export type PaymentIntent = {
  id: string;
  clientSecret: string;
  amountCents: number;
  provider: "dev" | "stripe" | "yappy";
};

export async function createPaymentIntent(params: {
  amountCents: number;
  orderId: string;
  metadata?: Record<string, string>;
}): Promise<PaymentIntent> {
  // YAPPY (Banco General, Panamá) — integration scaffold for the future.
  // When YAPPY_MERCHANT_ID + YAPPY_SECRET are configured, this branch will call
  // Yappy's Payments API to create a payment order and return its redirect/
  // token. Fulfilment happens through Yappy's IPN/webhook (see the webhook
  // route), mirroring the Stripe flow so tickets are only issued after a
  // verified payment. Until credentials exist it safely falls through to the
  // DEV provider below, so checkout keeps working in test mode.
  if (yappyConfigured) {
    // TODO: POST to Yappy `/payments` with merchant id + signed body.
    // const res = await fetch("https://apipagosbg.bgeneral.cloud/payments", {...})
    // return { id, clientSecret, amountCents, provider: "yappy" };
  }

  if (stripeConfigured) {
    const body = new URLSearchParams({
      amount: String(params.amountCents),
      currency: "usd",
      "automatic_payment_methods[enabled]": "true",
      "metadata[orderId]": params.orderId,
    });
    for (const [k, v] of Object.entries(params.metadata ?? {})) {
      body.append(`metadata[${k}]`, v);
    }
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) throw new Error(`Stripe error: ${res.status}`);
    const pi = (await res.json()) as {
      id: string;
      client_secret: string;
    };
    return {
      id: pi.id,
      clientSecret: pi.client_secret,
      amountCents: params.amountCents,
      provider: "stripe",
    };
  }

  // DEV provider — deterministic, verifiable, no network.
  const id = `pi_dev_${crypto.randomBytes(10).toString("hex")}`;
  const clientSecret = `${id}_secret_${devSignature(id, params.orderId, params.amountCents)}`;
  return {
    id,
    clientSecret,
    amountCents: params.amountCents,
    provider: "dev",
  };
}

/** Signature that lets the dev "webhook" prove a confirmation is authentic. */
export function devSignature(
  intentId: string,
  orderId: string,
  amountCents: number,
): string {
  return crypto
    .createHmac("sha256", env.authSecret)
    .update(`${intentId}:${orderId}:${amountCents}`)
    .digest("hex")
    .slice(0, 24);
}

export type VerifiedPayment = {
  intentId: string;
  orderId: string;
  amountCents: number;
};

/** Verify a dev-mode confirmation coming back from the client checkout. */
export function verifyDevPayment(payload: {
  intentId: string;
  orderId: string;
  amountCents: number;
  signature: string;
}): boolean {
  const expected = devSignature(
    payload.intentId,
    payload.orderId,
    payload.amountCents,
  );
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(payload.signature),
  );
}

/** Verify a real Stripe webhook signature (t=,v1= scheme). */
export function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!env.stripeWebhookSecret || !signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string]),
  );
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", env.stripeWebhookSecret)
    .update(signedPayload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(parts.v1 ?? ""),
    );
  } catch {
    return false;
  }
}

export async function refundPayment(intentId: string): Promise<void> {
  if (stripeConfigured && intentId.startsWith("pi_")) {
    await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ payment_intent: intentId }),
    });
  }
  // DEV mode: nothing external to call; the order/ticket state change is the
  // source of truth and is handled by the caller.
}
