import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${siteConfig.name}, our craftsmanship and our approach to custom clothing.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-neutral-900">About {siteConfig.name}</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-neutral-700">
        <p>
          {siteConfig.name} was founded on a simple idea: clothing should fit your life, not the other way around. We
          combine premium, quality-checked fabrics with modern manufacturing so you can shop ready-to-wear pieces or
          build something entirely your own.
        </p>
        <p>
          Our customizer isn&apos;t a gimmick — every design you build, from logo placement to embroidery thread color, is
          priced and produced exactly as shown, with a real production team reviewing every order before it goes into
          manufacturing.
        </p>
        <p>
          We&apos;re a small team obsessed with fit, fabric quality and getting the details right — down to the stitch.
        </p>
      </div>
    </div>
  );
}
