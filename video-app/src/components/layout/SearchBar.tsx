'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock } from 'lucide-react';

const RECENT_KEY = 'streamvault:recent-searches';

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function pushRecent(query: string) {
  const recent = [query, ...getRecent().filter((q) => q !== query)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions ?? []);
        }
      } catch {
        // ignore - suggestions are a non-critical enhancement
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    pushRecent(trimmed);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
        className="flex items-center rounded-full border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 focus-within:ring-2 focus-within:ring-brand-500/50 transition-shadow"
      >
        <Search size={16} className="ml-4 text-surface-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search videos, tags, categories, or ask AI…"
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-surface-400"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="mr-2 text-surface-400 hover:text-surface-600">
            <X size={14} />
          </button>
        )}
      </form>

      {open && (query.length > 0 ? suggestions.length > 0 : recent.length > 0) && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-xl overflow-hidden animate-fade-in z-50">
          {query.length === 0 && recent.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs uppercase tracking-wide text-surface-400">Recent searches</div>
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => submit(r)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left hover:bg-surface-100 dark:hover:bg-surface-800"
                >
                  <Clock size={14} className="text-surface-400" />
                  {r}
                </button>
              ))}
            </div>
          )}
          {query.length > 0 && suggestions.length > 0 && (
            <div className="p-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left hover:bg-surface-100 dark:hover:bg-surface-800"
                >
                  <Search size={14} className="text-surface-400" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
