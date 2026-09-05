import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import MobileNav from './MobileNav';
import { Clapperboard } from 'lucide-react';

export default async function Header() {
  // Never let a database hiccup take down every page on the site - the
  // header degrades to "no category links" instead of throwing.
  const categories = await prisma.category
    .findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true },
      take: 8,
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[header] Could not load categories:', err);
      return [];
    });

  return (
    <header className="sticky top-0 z-40 border-b border-surface-100 dark:border-surface-800 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          <MobileNav categories={categories} />

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Clapperboard size={18} />
            </span>
            <span className="hidden sm:block text-lg font-bold tracking-tight">StreamVault</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="rounded-md px-3 py-2 text-surface-800/80 hover:bg-surface-100 hover:text-surface-950 dark:text-surface-100/80 dark:hover:bg-surface-800 dark:hover:text-white transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="flex-1 flex justify-center px-2">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
