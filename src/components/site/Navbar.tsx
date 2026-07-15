"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import type { SessionUser } from "@/lib/auth";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/account/tickets", label: "My Tickets" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ user }: { user: SessionUser | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const dashHref =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "CREATOR"
        ? "/creator"
        : null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-ink-950/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {dashHref && (
            <Link
              href={dashHref}
              className="rounded-full px-4 py-2 text-sm font-medium text-violetx-bright hover:text-white"
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link href="/account" className="btn-ghost">
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="btn-secondary">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                Create Account
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-5 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-white transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-ink-950/95 backdrop-blur-xl lg:hidden">
          <div className="container-x flex flex-col gap-1 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-4 py-3 text-base font-medium text-slate-200 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
            {dashHref && (
              <Link
                href={dashHref}
                className="rounded-xl px-4 py-3 text-base font-medium text-violetx-bright hover:bg-white/5"
              >
                Dashboard
              </Link>
            )}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link href="/account" className="btn-secondary flex-1">
                    Account
                  </Link>
                  <button onClick={logout} className="btn-ghost flex-1">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary flex-1">
                    Login
                  </Link>
                  <Link href="/register" className="btn-primary flex-1">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
