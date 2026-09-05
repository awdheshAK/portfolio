import { cx } from '@/lib/utils';

export default function Button({
  variant = 'primary',
  className,
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-surface-100 text-surface-900 hover:bg-surface-200 dark:bg-surface-800 dark:text-white dark:hover:bg-surface-700',
    ghost: 'text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button className={cx(base, variants[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}
