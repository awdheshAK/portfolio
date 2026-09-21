"use client";

import { useState } from "react";
import { isValidEmail } from "@/utils/validators";
import { subscribeToNewsletter } from "@/services/newsletter";
import { getErrorMessage } from "@/lib/http";
import { cn } from "@/lib/cn";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      await subscribeToNewsletter(email);
      setStatus("success");
      setMessage("You're subscribed! Watch your inbox for updates.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, "Couldn't subscribe right now. Please try again later."));
    }
  }

  return (
    <div>
      {!compact && (
        <>
          <h3 className="text-base font-semibold text-neutral-900">Stay in the loop</h3>
          <p className="mt-1 text-sm text-neutral-600">New arrivals, customizer features and offers — no spam.</p>
        </>
      )}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full min-w-0 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p className={cn("mt-2 text-xs", status === "error" ? "text-red-600" : "text-emerald-700")} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
