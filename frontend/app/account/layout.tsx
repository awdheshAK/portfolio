"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Saved Designs", href: "/account/designs" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Measurements", href: "/account/measurements" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated, user, logout } = useRequireAuth(pathname);

  if (isLoading || !isAuthenticated) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-neutral-500">Loading your account…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">My Account</h1>
        <p className="text-sm text-neutral-500">Signed in as {user?.email}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account navigation" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                pathname === item.href ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => logout()}
            className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
