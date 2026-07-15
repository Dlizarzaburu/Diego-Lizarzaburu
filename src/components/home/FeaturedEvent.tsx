import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { Reveal } from "@/components/Reveal";
import { formatDateTime, formatMoney } from "@/lib/format";
import { availability, type EventLike } from "@/lib/events";

type EventWithTiers = EventLike & {
  description: string;
};

export function FeaturedEvent({ event }: { event: EventWithTiers }) {
  const a = availability(event);
  return (
    <section className="container-x py-20">
      <Reveal>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violetx-bright">
              Featured
            </p>
            <h2 className="mt-1 text-3xl font-black text-white sm:text-4xl">
              Don&apos;t miss this one
            </h2>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-strong grid overflow-hidden lg:grid-cols-2">
          <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImage}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent lg:bg-gradient-to-r" />
            <span className="absolute left-4 top-4 chip border-white/20 bg-black/40 backdrop-blur">
              {event.category}
            </span>
          </div>

          <div className="flex flex-col gap-5 p-7 sm:p-10">
            <h3 className="text-3xl font-black leading-tight text-white">
              {event.title}
            </h3>

            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <Info
                label="Date & time"
                value={formatDateTime(event.startsAt)}
              />
              <Info label="Venue" value={event.venueName} />
              <Info
                label="From"
                value={a.minPrice === 0 ? "Free" : formatMoney(a.minPrice)}
              />
              <Info
                label="Availability"
                value={
                  a.soldOut
                    ? "Sold out"
                    : a.limited
                      ? `Limited — ${a.remaining} left`
                      : `${a.remaining} available`
                }
              />
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">
                Starts in
              </p>
              <Countdown target={event.startsAt} />
            </div>

            <div className="mt-auto flex flex-wrap gap-3 pt-2">
              <Link
                href={`/events/${event.slug}`}
                className={a.soldOut ? "btn-secondary" : "btn-primary"}
              >
                {a.soldOut ? "View details" : "Get Tickets"}
              </Link>
              <Link href="/events" className="btn-ghost">
                All events
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 font-semibold text-white">{value}</p>
    </div>
  );
}
