import "server-only";
import fs from "fs";
import path from "path";
import { env } from "./env";

export type EmailAttachment = {
  filename: string;
  content: Buffer | Uint8Array; // raw bytes
  contentType?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

// Email provider abstraction. Swap the transport by setting EMAIL_MODE.
// "dev"    -> writes .html files to ./dev-outbox (no network, no secrets).
// "resend" -> calls the Resend HTTP API when RESEND_API_KEY is set.
export async function sendEmail(msg: EmailMessage): Promise<{ id: string }> {
  if (env.emailMode === "resend" && env.resendApiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        attachments: msg.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString("base64"),
        })),
      }),
    });
    if (!res.ok) throw new Error(`Resend error: ${res.status}`);
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }

  // Dev transport — persist so the flow is fully verifiable without a provider.
  const dir = path.join(process.cwd(), "dev-outbox");
  fs.mkdirSync(dir, { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const file = path.join(dir, `${id}.html`);
  fs.writeFileSync(
    file,
    `<!-- to: ${msg.to} | subject: ${msg.subject} -->\n${msg.html}`,
  );
  // Persist attachments next to the email so the PDF is inspectable in dev.
  for (const a of msg.attachments ?? []) {
    fs.writeFileSync(path.join(dir, `${id}-${a.filename}`), a.content);
  }
  // eslint-disable-next-line no-console
  console.log(
    `[email:dev] wrote ${file} (to=${msg.to} subject=${msg.subject}, ${msg.attachments?.length ?? 0} attachment(s))`,
  );
  return { id };
}
