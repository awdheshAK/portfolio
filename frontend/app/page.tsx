import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CustomCTA } from "@/components/home/CustomCTA";
import { HowCustomizationWorks } from "@/components/home/HowCustomizationWorks";
import { PopularFabrics } from "@/components/home/PopularFabrics";
import { LatestCollection } from "@/components/home/LatestCollection";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { Testimonials } from "@/components/home/Testimonials";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — Premium & Custom Clothing`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ShopByCategory />
      <FeaturedProducts />
      <CustomCTA />
      <HowCustomizationWorks />
      <PopularFabrics />
      <LatestCollection />
      <WhyChooseUs />
      <Testimonials />
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <NewsletterSignup />
      </section>
    </>
  );
}
