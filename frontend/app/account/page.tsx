"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const QUICK_LINKS = [
  { label: "Order History", href: "/account/orders", description: "Track and review your past orders." },
  { label: "Saved Designs", href: "/account/designs", description: "Pick up a custom design where you left off." },
  { label: "Wishlist", href: "/account/wishlist", description: "Products you've saved for later." },
  { label: "Addresses", href: "/account/addresses", description: "Manage your shipping addresses." },
  { label: "Measurements", href: "/account/measurements", description: "Saved fit profiles for the customizer." },
];

export default function AccountOverviewPage() {
  const { user } = useAuth();
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-neutral-900">Welcome back, {user?.name?.split(" ")[0] || "there"}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-xl border border-neutral-200 p-5 transition-colors hover:border-neutral-900">
            <p className="text-sm font-semibold text-neutral-900">{link.label}</p>
            <p className="mt-1 text-sm text-neutral-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
