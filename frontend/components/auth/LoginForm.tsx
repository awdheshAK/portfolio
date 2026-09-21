"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage, getFieldErrors } from "@/lib/http";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setErrors({});
    try {
      await login(email, password);
      const next = searchParams.get("next") || "/account";
      router.push(next);
    } catch (err) {
      setErrors(getFieldErrors(err) || {});
      setFormError(getErrorMessage(err, "Couldn't sign you in. Check your details and try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage orders, saved designs and your wishlist.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" error={errors.email?.[0]}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
        </FormField>
        <FormField label="Password" error={errors.password?.[0]}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          />
        </FormField>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-neutral-600 underline hover:text-neutral-900">
          Forgot password?
        </Link>
        <Link href="/register" className="font-medium text-neutral-900 underline">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}
