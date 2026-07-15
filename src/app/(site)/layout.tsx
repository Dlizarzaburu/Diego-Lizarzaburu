import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getCurrentUser, toSessionUser } from "@/lib/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user ? toSessionUser(user) : null} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
