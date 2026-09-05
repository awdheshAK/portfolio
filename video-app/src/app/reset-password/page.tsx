'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const uid = params.get('uid') ?? '';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, uid, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Reset failed.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token || !uid) {
    return <p className="text-sm text-red-500">This password reset link is invalid.</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      <FormField
        label="New password"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">
        Reset password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <Link href="/login" className="text-brand-600 font-medium">
          Back to log in
        </Link>
      }
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
