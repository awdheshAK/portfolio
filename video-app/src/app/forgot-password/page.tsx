'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="text-brand-600 font-medium">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-surface-600 dark:text-surface-300">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent. In local
          development, check the server console for the email contents.
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          <FormField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
