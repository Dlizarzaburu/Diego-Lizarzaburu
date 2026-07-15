import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { icon } from "@/components/dashboard/icons";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/creator");
  // Server-side role gate — hiding links is never sufficient.
  if (user.role !== "CREATOR" && user.role !== "ADMIN") redirect("/account");

  const items = [
    { href: "/creator", label: "Overview", icon: icon.grid },
    { href: "/creator/events/new", label: "Create event", icon: icon.plus },
  ];

  return (
    <DashboardShell title="Organizer" items={items} userName={user.name}>
      {children}
    </DashboardShell>
  );
}
