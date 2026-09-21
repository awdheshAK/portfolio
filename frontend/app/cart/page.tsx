import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false },
};

export default function CartPage() {
  return <CartPageClient />;
}
