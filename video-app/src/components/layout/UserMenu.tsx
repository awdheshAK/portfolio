'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Upload, LayoutDashboard, History, Heart, Download, LogOut, ShieldCheck } from 'lucide-react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (status === 'loading') return <div className="h-9 w-9 rounded-full skeleton" />;

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initials = session.user.name?.slice(0, 1).toUpperCase() ?? 'U';

  return (
    <div className="relative" ref={ref}>
      <Link
        href="/upload"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2 text-sm font-medium mr-1 hover:bg-surface-100 dark:hover:bg-surface-800"
      >
        <Upload size={15} /> Upload
      </Link>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl p-2 animate-fade-in z-50">
          <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800 mb-1">
            <p className="text-sm font-semibold truncate">{session.user.name}</p>
            <p className="text-xs text-surface-400 truncate">@{session.user.username}</p>
          </div>
          <MenuLink href="/account" icon={<User size={15} />} label="Profile" />
          <MenuLink href="/dashboard" icon={<LayoutDashboard size={15} />} label="Creator dashboard" />
          <MenuLink href="/account/history" icon={<History size={15} />} label="Watch history" />
          <MenuLink href="/account/favorites" icon={<Heart size={15} />} label="Favorites" />
          <MenuLink href="/account/downloads" icon={<Download size={15} />} label="Download history" />
          {session.user.role === 'ADMIN' && (
            <MenuLink href="/admin" icon={<ShieldCheck size={15} />} label="Admin dashboard" />
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800">
      {icon}
      {label}
    </Link>
  );
}
