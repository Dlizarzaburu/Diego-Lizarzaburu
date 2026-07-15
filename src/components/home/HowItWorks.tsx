import { Reveal } from "@/components/Reveal";

const steps = [
  {
    n: "01",
    title: "Choose an event",
    body: "Browse Senior 2027 parties, prom, galas and fundraisers. Filter by category or date.",
    icon: (
      <path
        d="M4 6h16M4 12h16M4 18h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),
  },
  {
    n: "02",
    title: "Purchase a ticket",
    body: "Pick your tier, apply promo codes, and check out securely. Tickets are issued only after payment.",
    icon: (
      <>
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
      </>
    ),
  },
  {
    n: "03",
    title: "Receive a unique QR code",
    body: "Each ticket gets a secure, one-time QR code delivered to your email and My Tickets.",
    icon: (
      <>
        <rect
          x="4"
          y="4"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="13"
          y="4"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="4"
          y="13"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M14 14h2v2m4-2v6m-6 0h2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </>
    ),
  },
  {
    n: "04",
    title: "Scan at the entrance",
    body: "Show your QR code at the door. Staff scan it once — fast entry, no duplicates.",
    icon: (
      <>
        <path
          d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3m12-4v3a1 1 0 01-1 1h-3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M3 12h18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-grid-glow opacity-60" />
      <div className="container-x relative">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-neon-bright">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              From tap to entrance in four steps
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="glass-strong group relative h-full overflow-hidden p-6">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-accent-gradient text-white shadow-glow">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    {s.icon}
                  </svg>
                </div>
                <span className="absolute right-5 top-4 text-4xl font-black text-white/5">
                  {s.n}
                </span>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
