import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with our team for order, product or customization questions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-neutral-900">Contact Us</h1>
      <p className="mt-3 text-sm text-neutral-600">
        {siteConfig.contactEmail} · {siteConfig.contactPhone} · {siteConfig.supportHours}
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
