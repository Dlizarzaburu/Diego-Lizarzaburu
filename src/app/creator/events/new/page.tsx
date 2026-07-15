import { requireRole } from "@/lib/auth";
import { EventForm } from "@/components/dashboard/EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireRole("CREATOR", "ADMIN");
  return (
    <div>
      <h1 className="mb-1 text-2xl font-black text-white sm:text-3xl">
        Create event
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Fill in the details and add your ticket tiers.
      </p>
      <EventForm mode="create" />
    </div>
  );
}
