"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EventCard } from "@/components/EventCard";
import type { EventLike } from "@/lib/events";

type SortKey = "soonest" | "latest";

export function EventsExplorer({
  events,
  heading = "Upcoming events",
  subheading,
}: {
  events: EventLike[];
  heading?: string;
  subheading?: string;
}) {
  const reduce = useReducedMotion();
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(events.map((e) => e.category)))],
    [events],
  );
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortKey>("soonest");
  const [when, setWhen] = useState<"any" | "month" | "week">("any");

  const filtered = useMemo(() => {
    const now = Date.now();
    const horizon =
      when === "week"
        ? now + 7 * 864e5
        : when === "month"
          ? now + 31 * 864e5
          : Infinity;
    return events
      .filter((e) => category === "All" || e.category === category)
      .filter((e) => new Date(e.startsAt).getTime() <= horizon)
      .sort((a, b) => {
        const da = new Date(a.startsAt).getTime();
        const db = new Date(b.startsAt).getTime();
        return sort === "soonest" ? da - db : db - da;
      });
  }, [events, category, sort, when]);

  return (
    <section className="container-x py-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            {heading}
          </h2>
          {subheading && (
            <p className="mt-2 max-w-lg text-slate-400">{subheading}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={when}
            onChange={(e) => setWhen(e.target.value as typeof when)}
            className="rounded-full border border-white/10 bg-ink-800 px-4 py-2 text-sm text-white outline-none"
            aria-label="Filter by date"
          >
            <option value="any">Any date</option>
            <option value="week">Next 7 days</option>
            <option value="month">Next 30 days</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-white/10 bg-ink-800 px-4 py-2 text-sm text-white outline-none"
            aria-label="Sort events"
          >
            <option value="soonest">Soonest first</option>
            <option value="latest">Latest first</option>
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              category === c
                ? "bg-accent-gradient text-white shadow-glow"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass grid place-items-center gap-2 py-20 text-center">
          <p className="text-lg font-semibold text-white">No events found</p>
          <p className="text-sm text-slate-400">
            Try a different category or date range.
          </p>
        </div>
      ) : (
        <motion.div
          layout={!reduce}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((event) => (
              <motion.div
                key={event.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
