"use client";

import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "info";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-neutral-200 bg-white text-neutral-900",
};

export function Toast({
  title,
  description,
  variant = "info",
  onClose,
}: {
  title: string;
  description?: string;
  variant?: ToastVariant;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg shadow-black/5 transition-all",
        VARIANT_STYLES[variant]
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-0.5 text-sm opacity-80">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded p-1 text-current/70 hover:text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        ×
      </button>
    </div>
  );
}
