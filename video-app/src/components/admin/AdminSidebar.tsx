'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Film,
  Upload,
  Users,
  FolderTree,
  Tags,
  Flag,
  ShieldAlert,
  Sparkles,
  HardDrive,
  Settings,
  ScrollText,
} from 'lucide-react';
import { cx } from '@/lib/utils';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/videos', label: 'Videos', icon: Film },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/tags', label: 'Tags', icon: Tags },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/moderation', label: 'Moderation', icon: ShieldAlert },
  { href: '/admin/ai-tools', label: 'AI Tools', icon: Sparkles },
  { href: '/admin/storage', label: 'Storage', icon: HardDrive },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/logs', label: 'System Logs', icon: ScrollText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-surface-100 dark:border-surface-800 p-4 lg:block">
      <nav className="space-y-0.5">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
