"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";

/**
 * The admin dashboard (app/admin/**) renders its own persistent shell
 * (sidebar + top bar via components/admin/AdminShell) — it isn't a
 * storefront page, so the public announcement bar / header / footer / cart
 * drawer would just double up on navigation and pull focus toward
 * storefront concerns (newsletter signup, cart) that don't apply there.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <AnnouncementBar />
      <Header />
      {children}
      <Footer />
      <CartDrawer />
    </>
  );
}
