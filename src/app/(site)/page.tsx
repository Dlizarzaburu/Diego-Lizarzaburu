import { Hero } from "@/components/home/Hero";
import { FeaturedEvent } from "@/components/home/FeaturedEvent";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ExecBoard } from "@/components/home/ExecBoard";
import { EventsExplorer } from "@/components/EventsExplorer";
import { Reveal } from "@/components/Reveal";
import Link from "next/link";
import {
  getPublishedEvents,
  getFeaturedEvent,
  getNextEvent,
} from "@/server/events";

// Render on each request (reads live event data from the database) instead of
// being prerendered at build time, so the build never needs the database.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, featured, next] = await Promise.all([
    getPublishedEvents(),
    getFeaturedEvent(),
    getNextEvent(),
  ]);

  return (
    <>
      <Hero
        nextEvent={
          next
            ? {
                title: next.title,
                slug: next.slug,
                startsAt: next.startsAt.toISOString(),
              }
            : null
        }
      />

      {featured && <FeaturedEvent event={featured} />}

      <EventsExplorer
        events={events}
        heading="Upcoming events"
        subheading="Every Senior 2027 event in one place. Filter by category or date and grab your tickets before they sell out."
      />

      <HowItWorks />

      <ExecBoard />

      {/* CTA band */}
      <section className="container-x py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-accent-gradient p-10 text-center sm:p-16">
            <div className="grain absolute inset-0 opacity-30" />
            <div className="relative">
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                Ready for the year of your life?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/90">
                Create your free account and never miss a Senior 2027 event.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/register"
                  className="btn bg-white text-ink-900 hover:bg-slate-100"
                >
                  Create Account
                </Link>
                <Link
                  href="/events"
                  className="btn border border-white/40 text-white hover:bg-white/10"
                >
                  Explore Events
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
