import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ApplyOrganizer } from "@/components/ApplyOrganizer";

export const metadata = { title: "Become an Organizer" };
export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/organizers/apply");

  return (
    <div className="container-x py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-violetx-bright">
          For Senior 2027 organizers
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Become an <span className="gradient-text">organizer</span>
        </h1>
        <p className="mt-4 text-slate-300">
          Approved Senior 2027 organizers can create events, sell tickets,
          manage scanner staff, and track sales. Apply below — an administrator
          will review your request.
        </p>
        <div className="mt-8">
          <ApplyOrganizer role={user.role} creatorStatus={user.creatorStatus} />
        </div>
      </div>
    </div>
  );
}
