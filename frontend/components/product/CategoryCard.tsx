import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/api";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/shop/${category.slug}`} className="group relative block overflow-hidden rounded-xl">
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={category.image_url || "/placeholders/category.svg"}
          alt={category.name}
          fill
          sizes="(min-width: 1024px) 20vw, 40vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
      </div>
      <p className="mt-3 text-center text-sm font-medium text-neutral-900">{category.name}</p>
    </Link>
  );
}
