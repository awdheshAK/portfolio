"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/services/auth";
import { getErrorMessage } from "@/lib/http";
import { isValidEmail } from "@/utils/validators";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
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
      await requestPasswordReset(email);
      setStatus("sent");
      setMessage("If an account exists for that email, we've sent a reset link.");
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, "Couldn't send reset link right now."));
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to reset it.">
      {status === "sent" ? (
        <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            />
          </FormField>
          {status === "error" && <p className="text-sm text-red-600">{message}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-neutral-600">
        <Link href="/login" className="font-medium text-neutral-900 underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
