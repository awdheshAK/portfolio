import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomizerWizard } from "@/components/customizer/CustomizerWizard";

export const metadata: Metadata = {
  title: "Customize Your Garment",
  description: "Design your own garment with a real-time layered preview: choose fabric, color, size, logo, text, embroidery and more.",
  alternates: { canonical: "/customize" },
};

export default function CustomizePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-neutral-500">Loading customizer…</div>}>
      <CustomizerWizard />
    </Suspense>
  );
}
