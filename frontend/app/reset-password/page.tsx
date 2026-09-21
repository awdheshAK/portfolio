"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/auth";
import { getErrorMessage, getFieldErrors } from "@/lib/http";
import { checkPasswordStrength } from "@/utils/validators";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  const missingLink = !token || !email;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors(undefined);

    const strength = checkPasswordStrength(password);
    if (!strength.valid) {
      setStatus("error");
      setMessage(strength.message ?? "Please choose a stronger password.");
      return;
    }
    if (password !== passwordConfirmation) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    try {
      await resetPassword({ token, email, password, password_confirmation: passwordConfirmation });
      setStatus("done");
      setMessage("Your password has been reset. You can now sign in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, "That reset link is invalid or has expired."));
      setFieldErrors(getFieldErrors(err));
    }
  }

  if (missingLink) {
    return (
      <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
        This reset link is missing required details. Please request a new one from the{" "}
        <Link href="/forgot-password" className="font-medium underline">
          forgot password
        </Link>{" "}
        page.
      </p>
    );
  }

  if (status === "done") {
    return <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-neutral-600">Resetting password for {email}</p>
      <FormField label="New password" error={fieldErrors?.password?.[0]}>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      <FormField label="Confirm new password">
        <input
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </FormField>
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {status === "loading" ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set a new password" subtitle="Choose a new password for your account.">
      <Suspense fallback={<p className="text-sm text-neutral-600">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-4 text-sm text-neutral-600">
        <Link href="/login" className="font-medium text-neutral-900 underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
