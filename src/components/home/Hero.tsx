"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Countdown } from "@/components/Countdown";

export function Hero({
  nextEvent,
}: {
  nextEvent: { title: string; slug: string; startsAt: string } | null;
}) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.8,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="grain relative flex min-h-[92vh] items-center overflow-hidden">
      {/* Background image + effects */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=2000&q=80"
          alt=""
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/85 to-ink-950" />
        <div className="absolute inset-0 bg-grid-glow" />
      </div>
      <div className="aurora" />

      <div className="container-x relative z-10 py-28">
        <motion.div {...rise(0)}>
          <span className="chip border-violetx/40 bg-violetx/10 text-violetx-bright">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-violetx" />
            The official Senior 2027 ticketing platform
          </span>
        </motion.div>

        <motion.h1
          {...rise(0.1)}
          className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl"
        >
          SENIOR <span className="gradient-text">2027</span>
          <br />
          EVENTS
        </motion.h1>

        <motion.p
          {...rise(0.2)}
          className="mt-6 max-w-xl text-lg text-slate-300 sm:text-xl"
        >
          One year. Every event. Your ticket to unforgettable experiences.
        </motion.p>

        <motion.div {...rise(0.3)} className="mt-9 flex flex-wrap gap-3">
          <Link href="/events" className="btn-primary text-base">
            Explore Events
          </Link>
          <Link href="/account/tickets" className="btn-secondary text-base">
            My Tickets
          </Link>
        </motion.div>

        {nextEvent && (
          <motion.div
            {...rise(0.45)}
            className="mt-14 inline-flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Next event
              </p>
              <Link
                href={`/events/${nextEvent.slug}`}
                className="text-lg font-bold text-white hover:text-violetx-bright"
              >
                {nextEvent.title}
              </Link>
            </div>
            <Countdown target={nextEvent.startsAt} />
          </motion.div>
        )}
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block">
        <div className="h-10 w-6 rounded-full border-2 border-white/20 p-1">
          <div className="mx-auto h-2 w-1 animate-float rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  );
}
