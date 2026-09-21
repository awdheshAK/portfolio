"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, roleCan } from "@/lib/admin-roles";
import type { User } from "@/types/api";
import { cn } from "@/lib/cn";

export function AdminShell({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const visibleNav = ADMIN_NAV.filter((item) => roleCan(user.role, item.roles));

  function isActive(item: (typeof ADMIN_NAV)[number]): boolean {
    if (item.href === "/admin") return pathname === "/admin";
    return pathname.startsWith(item.activePrefix ?? item.href);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-16 items-center border-b border-neutral-200 px-6">
            <Link href="/admin" className="font-serif text-lg font-semibold text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
              Admin
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin navigation">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                  isActive(item) ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-neutral-200 p-4 text-xs text-neutral-400">
            <Link href="/" className="hover:text-neutral-700 hover:underline">
              ← Back to storefront
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-neutral-200 bg-white">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <span className="font-serif text-lg font-semibold text-neutral-900 lg:hidden">Admin</span>
              <div className="ml-auto flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                  <p className="text-xs capitalize text-neutral-500">{user.role.replace(/_/g, " ")}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                >
                  Sign out
                </button>
              </div>
            </div>
            <nav
              aria-label="Admin navigation (mobile)"
              className="flex gap-1 overflow-x-auto border-t border-neutral-100 px-4 py-2 lg:hidden"
            >
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                    isActive(item) ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
