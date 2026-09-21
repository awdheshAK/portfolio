import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersListClient } from "@/components/admin/CustomersListClient";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false },
};

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<TextLineSkeleton lines={6} />}>
      <CustomersListClient />
    </Suspense>
  );
}
