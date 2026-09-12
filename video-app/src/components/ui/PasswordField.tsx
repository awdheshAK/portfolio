'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  label,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block mb-4">
      <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">{label}</span>
      <div className="relative">
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          className="w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
