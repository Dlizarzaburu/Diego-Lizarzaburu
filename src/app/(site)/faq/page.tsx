import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  {
    q: "Who can buy tickets?",
    a: "Anyone with an S27 Events account. While events are organized by Seniors 2027, tickets are open to students, families, and friends.",
  },
  {
    q: "How do I receive my tickets?",
    a: "After a successful payment, your tickets appear instantly under My Tickets and are emailed to you with a unique QR code for each ticket.",
  },
  {
    q: "Is my QR code secure?",
    a: "Yes. Each ticket has a unique, unpredictable token. The QR code never contains any personal information — it's only a key the entrance scanner validates against our server.",
  },
  {
    q: "Can I transfer a ticket to a friend?",
    a: "If the event allows transfers, you can send a ticket to any other S27 Events member from the My Tickets page. They'll need an account first.",
  },
  {
    q: "Can I get a refund?",
    a: "Refunds depend on the event's policy. Where refunds are allowed, you can request one up to 7 days before the event from your Order History.",
  },
  {
    q: "What happens at the entrance?",
    a: "Staff scan your QR code once. A green screen means you're in; each code can only be used a single time to prevent duplicates.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-x py-20">
      <h1 className="text-4xl font-black text-white sm:text-5xl">
        Frequently asked questions
      </h1>
      <div className="mt-10 max-w-3xl divide-y divide-white/10">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-white">
              {f.q}
              <span className="text-violetx-bright transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
