'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function MobileNav({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-white dark:bg-surface-950 h-full p-4 shadow-xl animate-fade-in">
            <button onClick={() => setOpen(false)} className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
              <X size={18} />
            </button>
            <nav className="flex flex-col gap-1">
              <Link href="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-medium hover:bg-surface-100 dark:hover:bg-surface-800">
                Home
              </Link>
              <div className="mt-2 px-3 text-xs uppercase tracking-wide text-surface-400">Categories</div>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-800"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
