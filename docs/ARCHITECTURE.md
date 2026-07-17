# S27 Events — Website Architecture

A high-level map of how the S27 Events ticketing platform is built and how a
request flows from a browser all the way to the database and back.

## Tech stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19 + TypeScript                   |
| Styling    | Tailwind CSS v3, framer-motion                                    |
| Data       | PostgreSQL (Supabase in production) via Prisma ORM                |
| Auth       | Custom session: bcrypt + HMAC-signed httpOnly cookie             |
| Validation | Zod (server-side on every mutation)                               |
| Payments   | Provider-agnostic (dev / Stripe / Yappy)                          |
| Email      | Provider-agnostic (dev outbox / Resend) — sends the QR PDF ticket |
| Tickets    | `qrcode` + `pdf-lib` (PDF), `html5-qrcode` (camera scanner)       |
| Hosting    | Vercel (app) + Supabase (database)                                |

## System diagram

```mermaid
flowchart TB
    subgraph Client["Browser / Phone"]
        UI["Next.js UI<br/>(Customer · Creator · Admin · Scanner)"]
        CAM["Camera scanner<br/>(html5-qrcode)"]
    end

    subgraph Vercel["Vercel — Next.js App"]
        PAGES["Server Components<br/>(pages, force-dynamic)"]
        API["Route Handlers<br/>/api/*"]
        subgraph Server["Server modules (server-only)"]
            AUTH["Auth + RBAC<br/>session cookie"]
            ZOD["Zod validation"]
            CREATOR["Event / tier logic"]
            ORDERS["Checkout + orders"]
            SCAN["Scan + reverse check-in"]
            PDF["PDF ticket builder<br/>(pdf-lib + qrcode)"]
        end
    end

    subgraph External["External services"]
        DB[("PostgreSQL / Supabase<br/>via Prisma")]
        PAY["Payments<br/>dev · Stripe · Yappy"]
        MAIL["Email<br/>dev outbox · Resend"]
    end

    UI -->|HTTPS| PAGES
    UI -->|fetch JSON| API
    CAM -->|scan token| API
    PAGES --> AUTH
    API --> AUTH
    AUTH --> ZOD
    ZOD --> CREATOR & ORDERS & SCAN
    ORDERS --> PAY
    ORDERS --> PDF
    PDF --> MAIL
    CREATOR --> DB
    ORDERS --> DB
    SCAN --> DB
    PAGES --> DB
```

## Roles (RBAC)

```mermaid
flowchart LR
    CUSTOMER["Customer<br/>buy · view tickets"]
    CREATOR["Creator / Organizer<br/>events · tiers · buyers"]
    ADMIN["Admin<br/>users · board · settings"]
    SCANNER["Scanner staff<br/>check-in at door"]

    CUSTOMER -->|apply, admin approves| CREATOR
    CREATOR -->|assigns staff| SCANNER
    ADMIN -.->|can do everything| CREATOR
    ADMIN -.-> SCANNER
```

## Purchase → ticket flow

```mermaid
sequenceDiagram
    participant B as Buyer
    participant A as /api/checkout
    participant P as Payment provider
    participant D as Database
    participant M as Email

    B->>A: Select tier + checkout
    A->>D: Reserve seats (atomic, prevents oversell)
    A->>P: Create/confirm payment
    P-->>A: Paid (verified)
    A->>D: Create Order (PAID) + Tickets (unique QR token)
    A->>M: Email each ticket as a QR PDF
    M-->>B: Ticket PDF in inbox
    Note over D: QR token is opaque — never contains personal data
```

## Check-in flow

```mermaid
sequenceDiagram
    participant S as Scanner (staff)
    participant R as /api/scan
    participant D as Database

    S->>R: Scan QR token
    R->>D: Look up ticket for this event
    alt Valid & unused
        R->>D: Atomic VALID → CHECKED_IN
        R-->>S: Green ✓ + tier color
    else Already used
        R-->>S: Big red ✕ + who/when scanned
    end
    Note over R,D: Reverse check-in only if the creator enabled it for the event
```

## Key data models

- **User** — role (CUSTOMER / CREATOR / ADMIN), creator approval status.
- **Event** — details, capacity, commission (fixed or %), consent form,
  ticket styling, `allowReverseCheckIn`, refund/transfer policy.
- **TicketTier** — price, quantity, per-order limit, optional password, scanner color.
- **Order / OrderItem** — payment status, totals; issued only after verified payment.
- **Ticket** — unique `qrToken` (no PII), status, check-in metadata.
- **CheckInLog** — every scan (valid, duplicate, reversed) for audit.
- **StaffAssignment** — who may scan an event (and reverse, if allowed).
- **BoardMember** — Senior 2027 executive board shown on the homepage (admin-managed).
- **AuditLog / PlatformSetting** — admin actions and platform fees.
