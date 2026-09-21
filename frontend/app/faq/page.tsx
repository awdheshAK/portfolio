import type { Metadata } from "next";
import { FaqAccordion } from "@/components/faq/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ordering, customizing and shipping.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-neutral-900">Frequently Asked Questions</h1>
      <div className="mt-8">
        <FaqAccordion />
      </div>
    </div>
  );
}
