'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed.');

      const signInRes = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });
      if (signInRes?.error) throw new Error('Account created. Please log in.');

      toast.success('Welcome to StreamVault!');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join StreamVault to upload, share, and manage videos."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 font-medium">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <FormField
          label="Full name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <FormField
          label="Username"
          required
          pattern="[a-zA-Z0-9_]+"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <FormField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <FormField
          label="Password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
