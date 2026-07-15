import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { availability, type EventLike } from "@/lib/events";

export function EventCard({ event }: { event: EventLike }) {
  const a = availability(event);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group card-hover glass-strong relative flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.coverImage}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
        <span className="absolute left-3 top-3 chip border-white/20 bg-black/40 backdrop-blur">
          {event.category}
        </span>
        {a.soldOut ? (
          <span className="absolute right-3 top-3 chip border-ember/50 bg-ember/20 text-ember-warm">
            Sold out
          </span>
        ) : a.limited ? (
          <span className="absolute right-3 top-3 chip border-magenta/50 bg-magenta/20 text-magenta-bright">
            Limited
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-medium text-violetx-bright">
          {formatDate(event.startsAt)}
        </p>
        <h3 className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-violetx-bright">
          {event.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-slate-400">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0"
          >
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
          </svg>
          {event.venueName}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              From
            </span>
            <p className="text-base font-bold text-white">
              {a.minPrice === 0 ? "Free" : formatMoney(a.minPrice)}
            </p>
          </div>
          <span className="btn-secondary !px-4 !py-2 !text-xs">
            View event →
          </span>
        </div>
      </div>
    </Link>
  );
}
