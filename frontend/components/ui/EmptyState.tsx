import Link from "next/link";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center", className)}>
      {icon && <div className="mb-4 text-neutral-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-neutral-600">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
