import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { icon } from "@/components/dashboard/icons";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  // Server-side admin gate.
  if (user.role !== "ADMIN") redirect("/account");

  const items = [
    { href: "/admin", label: "Overview", icon: icon.chart },
    { href: "/admin/users", label: "People", icon: icon.users },
    { href: "/admin/events", label: "Events", icon: icon.calendar },
    { href: "/admin/orders", label: "Orders", icon: icon.receipt },
    { href: "/admin/audit", label: "Audit log", icon: icon.shield },
    { href: "/admin/settings", label: "Settings", icon: icon.cog },
  ];

  return (
    <DashboardShell title="Admin" items={items} userName={user.name}>
      {children}
    </DashboardShell>
  );
}
