'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn('credentials', { redirect: false, email, password });
      if (res?.error) {
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password.' : res.error);
        return;
      }
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue to StreamVault."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-600 font-medium">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <FormField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mb-4 text-right">
          <Link href="/forgot-password" className="text-sm text-brand-600 font-medium">
            Forgot password?
          </Link>
        </div>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
