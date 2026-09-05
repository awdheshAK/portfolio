import Link from 'next/link';
import { Clapperboard, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-surface-100 dark:border-surface-800 mt-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Clapperboard size={18} />
            </span>
            <span className="text-lg font-bold">StreamVault</span>
          </Link>
          <p className="mt-3 text-sm text-surface-500">Share, watch and download video — built for creators.</p>
          <div className="mt-4 flex gap-3 text-surface-400">
            <Github size={18} />
            <Twitter size={18} />
          </div>
        </div>

        <FooterCol
          title="Product"
          links={[
            ['Browse', '/'],
            ['Upload', '/upload'],
            ['Search', '/search'],
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            ['Log in', '/login'],
            ['Sign up', '/register'],
            ['Creator dashboard', '/dashboard'],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ['Terms', '/terms'],
            ['Privacy', '/privacy'],
            ['Report content', '/report'],
          ]}
        />
      </div>
      <div className="border-t border-surface-100 dark:border-surface-800 py-4 text-center text-xs text-surface-400">
        © {new Date().getFullYear()} StreamVault. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-surface-500 hover:text-surface-950 dark:hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
