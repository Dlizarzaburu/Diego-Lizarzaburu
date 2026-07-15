import { redirect } from "next/navigation";
import { getCurrentUser, toSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/site/Navbar";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="min-h-screen">
      <Navbar user={toSessionUser(user)} />
      <div className="container-x grid gap-8 pb-20 pt-24 lg:grid-cols-[240px_1fr]">
        <AccountNav
          name={user.name}
          email={user.email}
          role={user.role}
          creatorStatus={user.creatorStatus}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
