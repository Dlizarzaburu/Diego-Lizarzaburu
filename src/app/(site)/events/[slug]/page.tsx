import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getEventBySlug,
  getRelatedEvents,
  availability,
} from "@/server/events";
import { tierRemaining } from "@/lib/events";
import { Countdown } from "@/components/Countdown";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { EventCard } from "@/components/EventCard";
import { Reveal } from "@/components/Reveal";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return { title: event.title, description: event.description.slice(0, 150) };
}

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, user, settings] = await Promise.all([
    getEventBySlug(slug),
    getCurrentUser(),
    prisma.platformSetting.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!event || event.status !== "PUBLISHED") notFound();

  const related = await getRelatedEvents(event.id, event.category);
  const a = availability(event);
  const now = new Date();

  const checkoutTiers = event.tiers.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    priceCents: t.priceCents,
    remaining: tierRemaining(t),
    purchaseLimit: t.purchaseLimit,
    onSale:
      (!t.salesStart || t.salesStart <= now) &&
      (!t.salesEnd || t.salesEnd >= now),
    // Never send the password to the client — only whether one is required.
    requiresPassword: !!(t.password && t.password.length > 0),
  }));

  const fees = settings
    ? {
        platformFeeBps: settings.platformFeeBps,
        processingFeeBps: settings.processingFeeBps,
        processingFeeFixedCents: settings.processingFeeFixedCents,
      }
    : undefined;

  return (
    <article>
      {/* Cover */}
      <section className="relative h-[46vh] min-h-[340px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.coverImage}
          alt={event.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/30" />
        <div className="container-x absolute inset-x-0 bottom-0">
          <div className="pb-8">
            <span className="chip border-white/20 bg-black/40 backdrop-blur">
              {event.category}
            </span>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              {event.title}
            </h1>
            <p className="mt-2 text-slate-300">
              {formatDateTime(event.startsAt)} · {event.venueName}
            </p>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
        {/* Main */}
        <div className="space-y-10">
          <Reveal>
            <div className="flex flex-wrap gap-3">
              <Countdown target={event.startsAt} />
            </div>
          </Reveal>

          <Reveal>
            <section>
              <h2 className="text-xl font-bold text-white">About this event</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-300">
                {event.description}
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section className="grid gap-4 sm:grid-cols-2">
              <InfoCard title="Date & time" icon="calendar">
                {formatDateTime(event.startsAt)}
                <br />
                <span className="text-slate-400">
                  to {formatDateTime(event.endsAt)}
                </span>
              </InfoCard>
              <InfoCard title="Location" icon="pin">
                <span className="font-semibold">{event.venueName}</span>
                <br />
                <span className="text-slate-400">{event.address}</span>
                <br />
                <a
                  href={
                    event.mapUrl ??
                    `https://maps.google.com/?q=${encodeURIComponent(event.address)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-neon-bright hover:underline"
                >
                  Open in maps →
                </a>
              </InfoCard>
              {event.ageRequirement && (
                <InfoCard title="Entry requirements" icon="shield">
                  {event.ageRequirement}
                </InfoCard>
              )}
              <InfoCard title="Availability" icon="ticket">
                {a.soldOut
                  ? "Sold out"
                  : a.limited
                    ? `Limited availability — ${a.remaining} remaining`
                    : `${a.remaining} tickets available`}
              </InfoCard>
            </section>
          </Reveal>

          <Reveal>
            <section className="glass p-6">
              <h2 className="text-lg font-bold text-white">
                Refund &amp; transfer policy
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {event.refundPolicy}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`chip ${event.refundsAllowed ? "border-emerald-500/40 text-emerald-300" : "border-white/10"}`}
                >
                  {event.refundsAllowed ? "Refunds available" : "No refunds"}
                </span>
                <span
                  className={`chip ${event.transfersAllowed ? "border-emerald-500/40 text-emerald-300" : "border-white/10"}`}
                >
                  {event.transfersAllowed
                    ? "Transfers allowed"
                    : "No transfers"}
                </span>
              </div>
            </section>
          </Reveal>
        </div>

        {/* Checkout sidebar */}
        <aside>
          <CheckoutPanel
            eventId={event.id}
            tiers={checkoutTiers}
            isAuthenticated={!!user}
            fees={fees}
            loginHref={`/login?next=/events/${event.slug}`}
            commissionPerTicketCents={event.commissionFeeCents}
            consentRequirement={event.consentRequirement}
            consentFormUrl={event.consentFormUrl}
          />
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-x pb-16">
          <h2 className="mb-6 text-2xl font-black text-white">
            Related events
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <div className="container-x pb-16">
        <Link href="/events" className="btn-ghost">
          ← All events
        </Link>
      </div>
    </article>
  );
}

function InfoCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: "calendar" | "pin" | "shield" | "ticket";
}) {
  const icons: Record<string, React.ReactNode> = {
    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M3 9h18M8 3v4M16 3v4"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>
    ),
    pin: (
      <>
        <path
          d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="12"
          cy="10"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>
    ),
    shield: (
      <path
        d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    ),
    ticket: (
      <path
        d="M4 8a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 4 2 2 0 010 4 2 2 0 01-2 2H6a2 2 0 01-2-2 2 2 0 000-4 2 2 0 010-4z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    ),
  };
  return (
    <div className="glass p-5">
      <div className="mb-2 flex items-center gap-2 text-violetx-bright">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          {icons[icon]}
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wide">
          {title}
        </span>
      </div>
      <p className="text-sm text-white">{children}</p>
    </div>
  );
}
