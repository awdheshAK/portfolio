import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersListClient } from "@/components/admin/OrdersListClient";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false },
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<TextLineSkeleton lines={6} />}>
      <OrdersListClient />
    </Suspense>
  );
}
