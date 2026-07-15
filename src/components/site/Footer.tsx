import Link from "next/link";
import { Logo } from "@/components/Logo";

const cols = [
  {
    title: "Platform",
    links: [
      { href: "/events", label: "Browse Events" },
      { href: "/account/tickets", label: "My Tickets" },
      { href: "/scanner", label: "Scanner" },
      { href: "/organizers/apply", label: "Become an Organizer" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/policies/refunds", label: "Refund Policy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/policies/terms", label: "Terms & Conditions" },
      { href: "/policies/privacy", label: "Privacy Policy" },
    ],
  },
];

const socials = ["Instagram", "TikTok", "X", "YouTube"];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-ink-950">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-slate-400">
            The official ticketing platform for Senior 2027 events. One year.
            Every event. Your ticket to unforgettable experiences.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {s[0]}
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold text-white">{c.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm link-muted">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} S27 Events · Senior 2027. Demo
            platform.
          </p>
          <p>Built for Senior 2027 fundraising events.</p>
        </div>
      </div>
    </footer>
  );
}
