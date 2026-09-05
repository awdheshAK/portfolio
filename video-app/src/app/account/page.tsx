'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AccountTabs from '@/components/account/AccountTabs';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import { User } from 'lucide-react';

interface Profile {
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/account/profile')
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.user);
        setName(d.user.name);
        setBio(d.user.bio ?? '');
      });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio }),
      });
      if (!res.ok) throw new Error('Could not save profile.');
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/account/avatar', { method: 'POST', body: form });
    const data = await res.json();
    if (res.ok) {
      toast.success('Avatar updated');
      setAvatarPreview(data.avatarUrl);
    } else {
      toast.error(data.error ?? 'Could not upload avatar.');
    }
  }

  if (!profile) return <div className="mx-auto max-w-2xl px-4 py-10 animate-pulse text-surface-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">Account settings</h1>
      <AccountTabs />

      <div className="flex items-center gap-4 mb-8">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-2xl font-bold text-brand-700 dark:text-brand-300">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User size={28} />
          )}
        </div>
        <label className="cursor-pointer text-sm font-medium text-brand-600">
          Change avatar
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </label>
      </div>

      <FormField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <FormField label="Username" value={profile.username} disabled />
      <FormField label="Email" value={profile.email} disabled />

      <label className="block mb-4">
        <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
        />
      </label>

      <Button onClick={save} loading={saving}>
        Save changes
      </Button>
    </div>
  );
}
