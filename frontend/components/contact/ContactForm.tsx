"use client";

import { useState } from "react";
import { submitContactForm } from "@/services/contact";
import { getErrorMessage } from "@/lib/http";
import { isValidEmail } from "@/utils/validators";

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(values.email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      await submitContactForm(values);
      setStatus("sent");
      setMessage("Thanks for reaching out — we'll get back to you within one business day.");
      setValues({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, "Couldn't send your message right now. Please try again or email us directly."));
    }
  }

  if (status === "sent") {
    return <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-900">Name</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-900">Email</span>
          <input
            type="email"
            required
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-900">Subject</span>
        <input
          required
          value={values.subject}
          onChange={(e) => setValues((v) => ({ ...v, subject: e.target.value }))}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-900">Message</span>
        <textarea
          required
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </label>
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
