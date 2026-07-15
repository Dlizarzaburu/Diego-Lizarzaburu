import type { Metadata } from "next";
import { notFound } from "next/navigation";

const policies: Record<
  string,
  { title: string; sections: [string, string][] }
> = {
  refunds: {
    title: "Refund Policy",
    sections: [
      [
        "Overview",
        "Refund eligibility is set per event by the organizer. Each event page and your order confirmation state whether refunds are permitted.",
      ],
      [
        "Refund window",
        "Where refunds are allowed, requests can be made up to 7 days before the event start time from your Order History. After that cutoff, tickets are non-refundable.",
      ],
      [
        "Fundraisers",
        "Some fundraising events are marked as final sale. These are clearly labeled and no refunds are issued, as proceeds directly support Senior 2027.",
      ],
      [
        "How refunds are processed",
        "Approved refunds are returned to your original payment method. Tickets tied to a refunded order are voided and cannot be used for entry.",
      ],
    ],
  },
  terms: {
    title: "Terms & Conditions",
    sections: [
      [
        "Acceptance",
        "By creating an account or purchasing a ticket, you agree to these terms and to the policies of individual events.",
      ],
      [
        "Tickets",
        "Tickets are licenses for entry, not property. Each QR code may be scanned once. Duplicating, reselling above face value, or tampering with tickets is prohibited.",
      ],
      [
        "Conduct",
        "Attendees must follow venue rules and any age or entry requirements posted on the event page. Organizers may deny entry for policy violations.",
      ],
      [
        "Liability",
        "S27 Events is a demo platform operated for Senior 2027. Events are subject to change; organizers will communicate material changes to ticket holders.",
      ],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      [
        "Data we collect",
        "We store only what's needed to run the platform: your name, email, optional phone, orders, and tickets. We never store card numbers — payments are handled by our payment processor.",
      ],
      [
        "How we use it",
        "Your information is used to deliver tickets, send transactional emails, and provide entry at events. We do not sell personal data.",
      ],
      [
        "QR codes",
        "Ticket QR codes contain only an opaque token — never your personal information. The token is validated server-side at entry.",
      ],
      [
        "Your choices",
        "You can update your profile at any time and request account deletion by contacting support.",
      ],
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>;
}): Promise<Metadata> {
  const { policy } = await params;
  return { title: policies[policy]?.title ?? "Policy" };
}

export function generateStaticParams() {
  return Object.keys(policies).map((policy) => ({ policy }));
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const { policy } = await params;
  const doc = policies[policy];
  if (!doc) notFound();

  return (
    <div className="container-x py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black text-white">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated for the Senior 2027 season · Demo content.
        </p>
        <div className="mt-10 space-y-8">
          {doc.sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-xl font-bold text-white">{heading}</h2>
              <p className="mt-2 leading-relaxed text-slate-300">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
