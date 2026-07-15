"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

export function DashboardShell({
  title,
  items,
  userName,
  children,
}: {
  title: string;
  items: NavItem[];
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-ink-950/60 p-5 lg:flex">
        <Logo />
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-violetx-bright">
          {title}
        </span>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== items[0].href && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent-gradient text-white shadow-glow"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <p className="px-3 pb-1 text-xs text-slate-500">
            Signed in as <span className="text-slate-300">{userName}</span>
          </p>
          <Link
            href="/"
            className="block rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5"
          >
            ← Back to site
          </Link>
          <button
            onClick={logout}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-ink-950/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={logout} className="text-sm text-slate-400">
          Log out
        </button>
      </div>

      <div className="min-w-0">
        {/* Mobile nav scroller */}
        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 lg:hidden">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== items[0].href && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-white/10 text-white" : "text-slate-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
