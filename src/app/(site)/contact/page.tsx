import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-x py-20">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-violetx-bright">
            Contact
          </p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
            Get in touch
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Questions about an event, your tickets, or organizing with S27
            Events? Reach out — the Senior 2027 events team is here to help.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <div className="glass p-4">
              <p className="text-slate-400">Email</p>
              <p className="font-semibold text-white">hello@s27events.dev</p>
            </div>
            <div className="glass p-4">
              <p className="text-slate-400">Support hours</p>
              <p className="font-semibold text-white">Mon–Fri · 9am – 6pm</p>
            </div>
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
