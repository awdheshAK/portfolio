'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/lib/utils';

const TABS = [
  { href: '/account', label: 'Profile' },
  { href: '/account/history', label: 'Watch history' },
  { href: '/account/favorites', label: 'Favorites' },
  { href: '/account/downloads', label: 'Downloads' },
];

export default function AccountTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-8 flex gap-1 overflow-x-auto border-b border-surface-200 dark:border-surface-800">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cx(
            'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            pathname === t.href
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-white',
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
