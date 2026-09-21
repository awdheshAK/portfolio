"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CUSTOMIZER_TABS } from "@/lib/admin-roles";
import { cn } from "@/lib/cn";

export default function CustomizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-neutral-900">Customizer options</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The fabrics, colors, sizes and add-ons customers choose from in the garment customizer.
      </p>
      <nav aria-label="Customizer sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {CUSTOMIZER_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                active ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-800"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
