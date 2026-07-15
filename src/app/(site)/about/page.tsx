import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-x py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-violetx-bright">
          About
        </p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black text-white sm:text-5xl">
          The official home of{" "}
          <span className="gradient-text">Senior 2027</span> events
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          S27 Events is the ticketing platform run by and for the Senior class
          of 2027. Every party, prom, gala, and fundraiser lives here — with
          secure checkout, QR tickets, and fast entry. While our events are
          organized by Seniors 2027, anyone can create an account and buy
          tickets.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Built for fundraising",
            body: "Proceeds from ticket sales support Senior 2027 activities and celebrations throughout the year.",
          },
          {
            title: "Secure by design",
            body: "Every ticket carries a unique, unpredictable QR code. Payments are verified server-side before tickets are issued.",
          },
          {
            title: "Open to everyone",
            body: "Students, families, alumni, and friends can all create an account and join the celebration.",
          },
        ].map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08}>
            <div className="glass-strong h-full p-6">
              <h3 className="text-lg font-bold text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-14">
        <Link href="/events" className="btn-primary">
          Explore events
        </Link>
      </div>
    </div>
  );
}
