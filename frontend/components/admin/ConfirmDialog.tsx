"use client";

import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  isSubmitting,
  onConfirm,
  onCancel,
  tone = "danger",
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: "danger" | "default";
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      {description && <p className="text-sm text-neutral-600">{description}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
            tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 hover:bg-neutral-700"
          )}
        >
          {isSubmitting ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
