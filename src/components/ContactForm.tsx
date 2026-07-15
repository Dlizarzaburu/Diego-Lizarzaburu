"use client";

import { useState } from "react";
import { FormMessage } from "@/components/FormMessage";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Demo handler — in production this would POST to a support inbox / ticketing system.
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="glass-strong space-y-4 p-6">
      {sent && (
        <FormMessage type="success">
          Thanks! Your message has been received (demo form). We&apos;ll get
          back to you soon.
        </FormMessage>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" required className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="subject">
          Subject
        </label>
        <input id="subject" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          required
          className="input resize-none"
        />
      </div>
      <button type="submit" className="btn-primary">
        Send message
      </button>
    </form>
  );
}
