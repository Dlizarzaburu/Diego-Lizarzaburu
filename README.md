# S27 Events

**The official ticketing platform for Senior 2027 events** — Halloween parties, prom, senior celebrations, and fundraisers.

> _One year. Every event. Your ticket to unforgettable experiences._

Anyone can create a customer account and buy tickets. Approved Senior 2027 organizers get an event‑creator dashboard, admins manage the whole platform, and authorized staff scan tickets at the door with a mobile‑first scanner.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Zod**, a Stripe‑ready payment architecture, secure session auth, and a QR‑ticketing pipeline.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [How the core flows work](#how-the-core-flows-work)
- [Payments: dev mode vs. Stripe](#payments-dev-mode-vs-stripe)
- [Email](#email)
- [Security model](#security-model)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [What you still need to provide](#what-you-still-need-to-provide)

---

## Features

**Customer**

- Browse events with category/date filtering, featured event, live countdowns
- Event detail pages with tiers, live availability (from the DB), map link, policies, related events
- Quantity selector, order summary, secure checkout
- Account: My Tickets (QR codes), order history, profile, password reset
- Download / resend tickets, transfer a ticket (when the event allows), request a refund (per policy)

**Event creator (approved organizers)**

- Create / edit / publish / unpublish / duplicate events, multiple ticket tiers, purchase limits, sales windows
- Promo codes, complimentary tickets, scanner‑staff invitations
- Attendee list CSV export
- Analytics dashboard with **real** DB data: gross/net sales, tickets sold/remaining, sales by tier, sales over time, refunds, check‑ins, upcoming payout

**Admin**

- Manage people (approve/revoke organizers, grant/remove admin), all events, all orders
- Issue refunds, cancel/resend tickets, configure platform & processing fees
- Review QR scan attempts & duplicate‑ticket attempts, audit log of sensitive actions, platform‑wide analytics

**Scanner (mobile‑first, `/scanner`)**

- Staff sign in and only see events they're assigned to
- Camera QR scanning, large green/red result, duplicate prevention, "previously scanned" details
- Manual attendee search, supervisor check‑in reversal, live scanned/remaining counts
- Records scanner, entrance, device, timestamp in the check‑in log

---

## Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | Next.js 15 (App Router, RSC), TypeScript                      |
| Styling        | Tailwind CSS, Framer Motion (reduced‑motion aware)            |
| Database / ORM | PostgreSQL + Prisma                                           |
| Auth           | Custom secure sessions (httpOnly, HMAC‑signed cookie, bcrypt) |
| Validation     | Zod (server‑side on every mutation)                           |
| Payments       | Provider‑agnostic abstraction — **Stripe‑ready** + safe dev mode |
| QR codes       | `qrcode` (generation) + `html5-qrcode` (camera scanning)      |
| Charts         | Recharts                                                      |
| Email          | Provider abstraction (Resend‑ready) + dev outbox              |
| Tests          | Vitest + Testing Library                                      |

---

## Quick start

**Prerequisites:** Node 20+, a running PostgreSQL instance.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL + AUTH_SECRET (see below)

# 3. Create the schema and seed demo data
npm run prisma:migrate      # applies migrations
npm run db:seed             # realistic demo events, accounts, orders, tickets

# 4. Run the app
npm run dev                 # http://localhost:3000
```

That's it — the app runs fully in **dev payment mode** and **dev email mode** with **no external credentials required**. Sign in with a demo account below and buy a ticket end‑to‑end.

> **Don't have Postgres handy?** Any Postgres works. For a quick local one:
> `docker run --name s27 -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
> then set `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/s27events?schema=public"`.

---

## Environment variables

All secrets live in `.env` (git‑ignored). A safe, credential‑free template is in **`.env.example`**.

| Variable                             | Required             | Purpose                                                        |
| ------------------------------------ | -------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`                       | **Yes**              | PostgreSQL connection string                                   |
| `AUTH_SECRET`                        | **Yes** (prod)       | Signs session cookies. Use a long random string in production. |
| `APP_URL`                            | Recommended          | Base URL used in emails/links (default `http://localhost:3000`)|
| `PAYMENTS_MODE`                      | No (`dev`)           | `dev` (built‑in safe mode) or `stripe`                         |
| `STRIPE_SECRET_KEY`                  | Only for Stripe      | Stripe secret key                                              |
| `STRIPE_WEBHOOK_SECRET`              | Only for Stripe      | Verifies incoming Stripe webhooks                              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Only for Stripe      | Client publishable key                                         |
| `EMAIL_MODE`                         | No (`dev`)           | `dev` (writes to `./dev-outbox`) or `resend`                   |
| `EMAIL_FROM`                         | No                   | From address for outgoing email                                |
| `RESEND_API_KEY`                     | Only for real email  | Resend API key                                                 |

Generate a strong `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Demo accounts

Seeded by `npm run db:seed`. **Password for all: `Password123!`**

| Role                        | Email                     | Notes                              |
| --------------------------- | ------------------------- | ---------------------------------- |
| Admin                       | `admin@s27events.dev`     | Full platform access               |
| Organizer (approved)        | `creator@s27events.dev`   | Owns the seeded demo events        |
| Organizer (pending)         | `pending@s27events.dev`   | Awaiting admin approval            |
| Staff / scanner             | `staff@s27events.dev`     | Assigned to the Halloween Bash     |
| Customer (already has tickets) | `customer@s27events.dev` | Has paid tickets to scan/transfer  |

All demo data is clearly labeled (events carry `isDemo=true`, names/descriptions say "(Demo)").

---

## How the core flows work

**Purchase → ticket generation**

1. Customer selects tiers and checks out → `POST /api/checkout` creates a **PENDING** order and **atomically reserves inventory inside a DB transaction** (conditional `updateMany` — concurrent buyers can never oversell).
2. A payment intent is created via the payment abstraction.
3. Payment is confirmed **server‑side** (dev: HMAC‑verified confirmation endpoint; Stripe: verified webhook). Only then does `fulfillOrder` run: it marks the order **PAID** and issues one `Ticket` per seat, each with a unique human code (`S27-XXXX-XXXX`) and a **secure, unpredictable QR token that contains no personal information**.
4. A confirmation email with embedded QR codes is sent; the customer lands on a confirmation page and sees the tickets in **My Tickets**.

**Scanning**

- Staff open `/scanner`, pick an assigned event, and scan. `POST /api/scan` looks up the token, checks it belongs to the event, and **atomically** transitions `VALID → CHECKED_IN`. A second scan returns `ALREADY_USED` with when/where/who scanned it. Every attempt (valid, duplicate, invalid, wrong‑event) is written to the check‑in log.

---

## Payments: dev mode vs. Stripe

The app **never talks to Stripe directly** — everything goes through `src/lib/payments.ts`, so the rest of the code is provider‑agnostic and testable. **Tickets are only ever issued after a verified payment**, never optimistically at checkout.

- **Dev mode (default, no keys):** `createPaymentIntent` returns a synthetic client secret whose confirmation is verified by an HMAC we control — this simulates a provider webhook so the full flow is exercisable offline.
- **Stripe mode:** set `PAYMENTS_MODE=stripe` and the Stripe keys. `createPaymentIntent` calls the Stripe API, and fulfilment happens **only** from `POST /api/webhooks/stripe` after signature verification. To test locally:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

The complete Stripe integration structure is present; switching is purely a matter of providing credentials.

---

## Email

`src/lib/email.ts` is a provider abstraction.

- **`EMAIL_MODE=dev` (default):** emails are written as `.html` files to **`./dev-outbox/`** — open them in a browser to see the exact ticket/QR/reset messages. No network, no secrets.
- **`EMAIL_MODE=resend`:** set `RESEND_API_KEY` to send through Resend. Swapping in another provider means editing one function.

---

## Security model

- **Role‑based authorization on the server** — every sensitive route calls `requireApiRole(...)` / `requireRole(...)`. Hiding links is never the control; unauthenticated requests to `/admin`, `/creator`, and `/scanner` are redirected and never receive protected data.
- **Sessions:** httpOnly, `SameSite=Lax`, HMAC‑signed cookie; passwords hashed with bcrypt (cost 12); sessions invalidated on password reset.
- **Input validation:** Zod schemas validate every mutation body server‑side.
- **QR tokens** are unpredictable (`crypto.randomBytes`) and contain **no PII**.
- **Oversell protection** via conditional DB updates inside transactions.
- **Rate limiting** on login, registration, checkout, confirmation, scanning, transfer, and resend endpoints.
- **Audit log** records refunds, role changes, event lifecycle actions, complimentary issuance, check‑in reversals, and more.
- **No card data** is ever stored; payment credentials live only in env vars.

---

## Project structure

```
prisma/
  schema.prisma          # full data model
  seed.ts                # realistic, clearly-labeled demo data
src/
  app/
    (site)/              # public + customer pages (home, events, checkout, policies…)
    (auth)/              # login, register, forgot/reset password
    account/             # my tickets, orders, profile (auth-gated)
    creator/             # organizer dashboard (role-gated)
    admin/               # admin dashboard (role-gated)
    scanner/             # mobile scanner (staff-gated)
    api/                 # route handlers (auth, checkout, scan, creator, admin, webhooks)
  components/            # UI: nav, footer, cards, countdown, dashboard, scanner…
  lib/                   # auth, prisma, payments, qr, email, pricing, validation, rate-limit…
  server/                # orders, tickets, scan, events, analytics, creator, access (server-only)
tests/                   # Vitest unit + component tests
```

---

## Scripts

| Script                   | Description                            |
| ------------------------ | -------------------------------------- |
| `npm run dev`            | Start the dev server                   |
| `npm run build`          | Production build (runs `prisma generate`) |
| `npm run start`          | Start the production server            |
| `npm run lint`           | ESLint                                 |
| `npm run typecheck`      | `tsc --noEmit`                         |
| `npm run format`         | Prettier write                         |
| `npm test`               | Vitest run                             |
| `npm run prisma:migrate` | Apply migrations (dev)                 |
| `npm run db:seed`        | Seed demo data                         |
| `npm run db:reset`       | Reset DB + reseed                      |

---

## Testing

```bash
npm test          # unit + component tests (Vitest)
npm run lint      # eslint
npm run typecheck # types
```

Tests cover pricing/fees, QR‑token uniqueness & PII‑safety, dev payment signature verification, availability logic, server‑side validation, and event‑card rendering. The full purchase → ticket → scan pipeline was verified end‑to‑end against a real PostgreSQL database.

---

## What you still need to provide

The app is fully functional out of the box in dev mode. To go to production you'll want:

1. **`DATABASE_URL`** — a production PostgreSQL database.
2. **`AUTH_SECRET`** — a long random string (see command above). **Required for secure prod sessions.**
3. **Stripe** _(to take real payments)_ — `PAYMENTS_MODE=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and a webhook pointed at `/api/webhooks/stripe`.
4. **Email** _(to send real ticket emails)_ — `EMAIL_MODE=resend` + `RESEND_API_KEY` (or wire another provider into `src/lib/email.ts`).
5. **`APP_URL`** — your deployed base URL, so links/emails resolve correctly.

Everything else — schema, migrations, seed data, auth, dashboards, scanner, tests — is included and working.
