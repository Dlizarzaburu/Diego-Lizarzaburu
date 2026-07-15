import type { Metadata } from "next";
import { EventsExplorer } from "@/components/EventsExplorer";
import { getPublishedEvents } from "@/server/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse all upcoming Senior 2027 events.",
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="relative">
      <section className="relative overflow-hidden pb-4 pt-16">
        <div className="absolute inset-0 bg-grid-glow opacity-60" />
        <div className="aurora opacity-60" />
        <div className="container-x relative">
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            All <span className="gradient-text">events</span>
          </h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Every Senior 2027 event, from Halloween to prom to send-off. Filter
            by category or date to find your next night out.
          </p>
        </div>
      </section>

      <EventsExplorer events={events} heading="Browse events" />
    </div>
  );
}
