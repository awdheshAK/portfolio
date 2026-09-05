'use client';

import { X } from 'lucide-react';

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-surface-900 p-6 shadow-2xl animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
