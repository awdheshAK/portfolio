import type { Metadata } from "next";
import Link from "next/link";
import { HowCustomizationWorks } from "@/components/home/HowCustomizationWorks";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How ordering ready-to-wear and fully custom clothing works, from browsing to delivery.",
  alternates: { canonical: "/how-it-works" },
};

const STAGES = [
  { title: "Browse or Design", body: "Shop our ready-to-wear catalog, or head to the Customizer to design a garment from scratch." },
  { title: "Live Preview & Pricing", body: "Every choice updates a live canvas preview and a server-calculated price — no surprises at checkout." },
  { title: "Secure Checkout", body: "Pay securely via Razorpay. We verify every payment server-side before confirming your order." },
  { title: "Production & Quality Check", body: "Custom orders go through customization review, production and quality check before shipping." },
  { title: "Shipping & Delivery", body: "Track your order status from your account until it's delivered to your door." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-neutral-900">How It Works</h1>
      <div className="mt-10 space-y-8">
        {STAGES.map((stage, i) => (
          <div key={stage.title} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">{stage.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{stage.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 border-t border-neutral-200 pt-12">
        <HowCustomizationWorks />
      </div>
      <div className="mt-8 text-center">
        <Link href="/customize" className="inline-flex items-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700">
          Try the Customizer
        </Link>
      </div>
    </div>
  );
}
