/**
 * Development seed data for S27 Events.
 * All records here are DEMO data (events carry isDemo=true, descriptions are
 * clearly marked). Do NOT run against production.
 */
import { PrismaClient, Role, CreatorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function token(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}
function ticketCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = () =>
    Array.from({ length: 4 }, () => a[crypto.randomInt(0, a.length)]).join("");
  return `S27-${b()}-${b()}`;
}
function daysFromNow(d: number, hour = 20) {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  console.log("Seeding S27 Events demo data…");

  // Clean slate (dev only).
  await prisma.checkInLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.staffAssignment.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.ticketTier.deleteMany();
  await prisma.event.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@s27events.dev",
      name: "Alex Admin (Demo)",
      passwordHash: hash,
      role: Role.ADMIN,
      creatorStatus: CreatorStatus.APPROVED,
    },
  });

  const creator = await prisma.user.create({
    data: {
      email: "creator@s27events.dev",
      name: "Jordan Organizer (Demo)",
      passwordHash: hash,
      role: Role.CREATOR,
      creatorStatus: CreatorStatus.APPROVED,
    },
  });

  const pendingCreator = await prisma.user.create({
    data: {
      email: "pending@s27events.dev",
      name: "Sam Applicant (Demo)",
      passwordHash: hash,
      role: Role.CUSTOMER,
      creatorStatus: CreatorStatus.PENDING,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@s27events.dev",
      name: "Riley Staff (Demo)",
      passwordHash: hash,
      role: Role.CUSTOMER,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@s27events.dev",
      name: "Casey Customer (Demo)",
      passwordHash: hash,
      role: Role.CUSTOMER,
      phone: "555-0100",
    },
  });

  const extraCustomers = await Promise.all(
    ["taylor", "morgan", "jamie", "avery"].map((n, i) =>
      prisma.user.create({
        data: {
          email: `${n}@s27events.dev`,
          name: `${n[0].toUpperCase()}${n.slice(1)} (Demo)`,
          passwordHash: hash,
          role: Role.CUSTOMER,
        },
      }),
    ),
  );

  const IMG = {
    halloween:
      "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?auto=format&fit=crop&w=1600&q=80",
    prom: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80",
    gala: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    fest: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=80",
    fundraiser:
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=80",
    winter:
      "https://images.unsplash.com/photo-1482575832494-771f74bf6857?auto=format&fit=crop&w=1600&q=80",
  };

  type TierSpec = {
    name: string;
    priceCents: number;
    quantity: number;
    sold?: number;
    limit?: number;
    desc?: string;
  };
  type EventSpec = {
    title: string;
    category: string;
    cover: string;
    days: number;
    venue: string;
    address: string;
    capacity: number;
    featured?: boolean;
    status?: "PUBLISHED" | "DRAFT" | "UNPUBLISHED";
    age?: string;
    tiers: TierSpec[];
    transfers?: boolean;
    refunds?: boolean;
  };

  const specs: EventSpec[] = [
    {
      title: "Senior 2027 Halloween Bash",
      category: "Party",
      cover: IMG.halloween,
      days: 18,
      venue: "The Warehouse Loft",
      address: "512 Industrial Ave, Downtown",
      capacity: 500,
      featured: true,
      age: "16+ with student ID",
      transfers: true,
      refunds: true,
      tiers: [
        {
          name: "General Admission",
          priceCents: 2500,
          quantity: 350,
          sold: 210,
          desc: "Entry + coat check",
        },
        {
          name: "VIP Lounge",
          priceCents: 6000,
          quantity: 100,
          sold: 88,
          limit: 4,
          desc: "Skip the line, private lounge, 1 drink token",
        },
        {
          name: "Group of 4",
          priceCents: 8800,
          quantity: 50,
          sold: 22,
          limit: 2,
          desc: "Four GA entries at a discount",
        },
      ],
    },
    {
      title: "Senior Prom 2027 — Midnight in Neon",
      category: "Prom",
      cover: IMG.prom,
      days: 60,
      venue: "Grand Skyline Ballroom",
      address: "1 Riverside Plaza",
      capacity: 400,
      featured: false,
      age: "Seniors & their guests only",
      transfers: false,
      refunds: true,
      tiers: [
        {
          name: "Single Ticket",
          priceCents: 8500,
          quantity: 250,
          sold: 96,
          desc: "Dinner + dance",
        },
        {
          name: "Couple",
          priceCents: 16000,
          quantity: 100,
          sold: 40,
          limit: 1,
          desc: "Two tickets, reserved table",
        },
      ],
    },
    {
      title: "Winter Formal Fundraiser Gala",
      category: "Fundraiser",
      cover: IMG.gala,
      days: 34,
      venue: "Heritage Hall",
      address: "88 Museum Row",
      capacity: 300,
      transfers: true,
      refunds: false,
      tiers: [
        { name: "Supporter", priceCents: 4000, quantity: 200, sold: 60 },
        {
          name: "Patron",
          priceCents: 12000,
          quantity: 60,
          sold: 55,
          desc: "Premium seating + name in program",
        },
        {
          name: "Benefactor",
          priceCents: 25000,
          quantity: 20,
          sold: 20,
          desc: "Table sponsor (SOLD OUT)",
        },
      ],
    },
    {
      title: "Spring Fling Rooftop Festival",
      category: "Festival",
      cover: IMG.fest,
      days: 95,
      venue: "Skydeck Rooftop",
      address: "400 High St",
      capacity: 600,
      transfers: true,
      refunds: true,
      tiers: [
        {
          name: "Early Bird",
          priceCents: 2000,
          quantity: 150,
          sold: 40,
          desc: "Limited early pricing",
        },
        {
          name: "General Admission",
          priceCents: 3000,
          quantity: 400,
          sold: 12,
        },
      ],
    },
    {
      title: "Senior Send-Off Celebration",
      category: "Celebration",
      cover: IMG.fundraiser,
      days: 120,
      venue: "Lakeside Pavilion",
      address: "22 Lakeshore Dr",
      capacity: 350,
      transfers: true,
      refunds: true,
      tiers: [
        { name: "General Admission", priceCents: 1500, quantity: 300, sold: 5 },
      ],
    },
    {
      title: "Neon Winter Wonderland (Draft Preview)",
      category: "Party",
      cover: IMG.winter,
      days: 150,
      venue: "TBD",
      address: "To be announced",
      capacity: 250,
      status: "DRAFT",
      transfers: true,
      refunds: true,
      tiers: [{ name: "General Admission", priceCents: 3000, quantity: 250 }],
    },
  ];

  const createdEvents = [];
  for (const s of specs) {
    const event = await prisma.event.create({
      data: {
        slug: slugify(s.title),
        title: s.title,
        category: s.category,
        description: `DEMO EVENT — ${s.title}. Join Senior 2027 for an unforgettable night. This is realistic development seed data used to showcase the S27 Events platform. Doors open one hour before start. All proceeds support Senior 2027 activities.`,
        coverImage: s.cover,
        venueName: s.venue,
        address: s.address,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(s.address)}`,
        startsAt: daysFromNow(s.days, 20),
        endsAt: daysFromNow(s.days, 23),
        status: s.status ?? "PUBLISHED",
        capacity: s.capacity,
        ageRequirement: s.age,
        refundPolicy: s.refunds
          ? "Full refunds available up to 7 days before the event. No refunds after that."
          : "All sales final. This is a fundraiser — no refunds.",
        transfersAllowed: s.transfers ?? true,
        refundsAllowed: s.refunds ?? true,
        featured: s.featured ?? false,
        isDemo: true,
        creatorId: creator.id,
        tiers: {
          create: s.tiers.map((t, idx) => ({
            name: t.name,
            description: t.desc,
            priceCents: t.priceCents,
            quantity: t.quantity,
            sold: t.sold ?? 0,
            purchaseLimit: t.limit ?? 8,
            sortOrder: idx,
          })),
        },
      },
      include: { tiers: true },
    });
    createdEvents.push(event);
  }

  // Promo code on the featured event.
  await prisma.promoCode.create({
    data: {
      eventId: createdEvents[0].id,
      code: "SPOOKY10",
      discountType: "PERCENT",
      amount: 10,
      maxUses: 100,
    },
  });

  // Demo the new features on the featured (Halloween) event: an orange ticket
  // accent + note, a small organizer commission, and a password-gated tier.
  await prisma.event.update({
    where: { id: createdEvents[0].id },
    data: {
      ticketAccentColor: "#f97316",
      ticketNote: "Doors 8pm · 16+ with student ID · Costumes encouraged 🎃",
      commissionFeeCents: 100,
    },
  });
  const vipTier = createdEvents[0].tiers.find((t) => t.name === "VIP Lounge");
  if (vipTier) {
    await prisma.ticketTier.update({
      where: { id: vipTier.id },
      data: { password: "vip2027", color: "#f43f5e" },
    });
  }
  // Give each Halloween tier a distinct scanner color for the demo.
  const gaTierDemo = createdEvents[0].tiers.find(
    (t) => t.name === "General Admission",
  );
  if (gaTierDemo) {
    await prisma.ticketTier.update({
      where: { id: gaTierDemo.id },
      data: { color: "#22d3ee" },
    });
  }

  // Staff assignment + supervisor for the featured event (scanner access).
  await prisma.staffAssignment.create({
    data: { userId: staff.id, eventId: createdEvents[0].id, canReverse: false },
  });
  await prisma.staffAssignment.create({
    data: {
      userId: creator.id,
      eventId: createdEvents[0].id,
      canReverse: true,
    },
  });

  // A real paid order + issued tickets for the demo customer (Halloween Bash).
  const featured = createdEvents[0];
  const gaTier = featured.tiers.find((t) => t.name === "General Admission")!;
  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      eventId: featured.id,
      status: "PAID",
      subtotalCents: gaTier.priceCents * 2,
      feeCents: 235,
      totalCents: gaTier.priceCents * 2 + 235,
      paymentIntentId: `pi_dev_${token(8)}`,
      paymentRef: "demo-seed",
      paidAt: new Date(),
      items: {
        create: [
          { tierId: gaTier.id, quantity: 2, unitPriceCents: gaTier.priceCents },
        ],
      },
    },
  });
  for (let i = 0; i < 2; i++) {
    await prisma.ticket.create({
      data: {
        code: ticketCode(),
        qrToken: `S27T_${token(24)}`,
        orderId: order.id,
        eventId: featured.id,
        tierId: gaTier.id,
        userId: customer.id,
        status: "VALID",
      },
    });
  }

  // Spread some paid orders across customers for analytics realism.
  for (const c of extraCustomers) {
    const evt = createdEvents[crypto.randomInt(0, 4)];
    const tier = await prisma.ticketTier.findFirst({
      where: { eventId: evt.id },
    });
    if (!tier) continue;
    const qty = crypto.randomInt(1, 3);
    const ord = await prisma.order.create({
      data: {
        userId: c.id,
        eventId: evt.id,
        status: "PAID",
        subtotalCents: tier.priceCents * qty,
        feeCents: 120,
        totalCents: tier.priceCents * qty + 120,
        paymentIntentId: `pi_dev_${token(8)}`,
        paidAt: new Date(Date.now() - crypto.randomInt(0, 10) * 864e5),
        items: {
          create: [
            { tierId: tier.id, quantity: qty, unitPriceCents: tier.priceCents },
          ],
        },
      },
    });
    for (let i = 0; i < qty; i++) {
      await prisma.ticket.create({
        data: {
          code: ticketCode(),
          qrToken: `S27T_${token(24)}`,
          orderId: ord.id,
          eventId: evt.id,
          tierId: tier.id,
          userId: c.id,
          status: "VALID",
        },
      });
    }
  }

  console.log("\nSeed complete. Demo accounts (password: %s):", DEMO_PASSWORD);
  console.table([
    { role: "Admin", email: admin.email },
    { role: "Creator (approved)", email: creator.email },
    { role: "Creator (pending approval)", email: pendingCreator.email },
    { role: "Staff / Scanner", email: staff.email },
    { role: "Customer (has tickets)", email: customer.email },
  ]);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
