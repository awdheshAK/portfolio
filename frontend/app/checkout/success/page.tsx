import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessClient } from "@/components/checkout/CheckoutSuccessClient";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-500">Loading…</div>}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
