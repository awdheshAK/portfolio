import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Clapperboard size={20} />
          </span>
          <span className="text-xl font-bold">StreamVault</span>
        </Link>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-8 shadow-sm">
          <h1 className="text-xl font-bold mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-surface-500 mb-6">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-surface-500">{footer}</div>}
      </div>
    </div>
  );
}
