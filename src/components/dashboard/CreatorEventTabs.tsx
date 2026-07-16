"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CreatorEventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/creator/events/${eventId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/sales`, label: "Ticket sales" },
    { href: `${base}/buyers`, label: "Buyers" },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-white/10">
      {tabs.map((t) => {
        const active =
          t.href === base ? pathname === base : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
              active ? "text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent-gradient" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
