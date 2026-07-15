"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role, CreatorStatus } from "@prisma/client";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/tickets", label: "My Tickets" },
  { href: "/account/orders", label: "Order History" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav({
  name,
  email,
  role,
  creatorStatus,
}: {
  name: string;
  email: string;
  role: Role;
  creatorStatus: CreatorStatus;
}) {
  const pathname = usePathname();
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="glass-strong mb-4 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-accent-gradient font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {links.map((l) => {
          const active =
            pathname === l.href ||
            (l.href !== "/account" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          );
        })}

        {role === "CREATOR" && (
          <Link
            href="/creator"
            className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-violetx-bright hover:bg-white/5"
          >
            Creator Dashboard
          </Link>
        )}
        {role === "ADMIN" && (
          <Link
            href="/admin"
            className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-violetx-bright hover:bg-white/5"
          >
            Admin Dashboard
          </Link>
        )}
        {role === "CUSTOMER" && creatorStatus === "NONE" && (
          <Link
            href="/organizers/apply"
            className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Become an organizer
          </Link>
        )}
        {creatorStatus === "PENDING" && (
          <span className="rounded-xl px-4 py-2.5 text-xs text-amber-300">
            Organizer application pending
          </span>
        )}
      </nav>
    </aside>
  );
}
