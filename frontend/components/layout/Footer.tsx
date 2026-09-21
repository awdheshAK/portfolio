import Link from "next/link";
import { footerNav, siteConfig } from "@/config/site";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="font-serif text-xl font-semibold text-neutral-900">{siteConfig.name}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">{siteConfig.description}</p>
            <div className="mt-6 max-w-sm">
              <NewsletterSignup compact />
            </div>
          </div>

          <FooterColumn title="Shop" items={footerNav.shop} />
          <FooterColumn title="Company" items={footerNav.company} />
          <FooterColumn title="Account" items={footerNav.account} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>
            {siteConfig.contactEmail} · {siteConfig.contactPhone}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-neutral-600 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
