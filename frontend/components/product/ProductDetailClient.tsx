"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product, Review } from "@/types/api";
import * as catalogService from "@/services/catalog";
import { PriceDisplay, DiscountBadge } from "@/components/product/PriceDisplay";
import { ColorSwatchGroup } from "@/components/product/ColorSwatch";
import { SizeSelector } from "@/components/product/SizeSelector";
import { ReviewList } from "@/components/product/ReviewList";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/http";

export function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [colorId, setColorId] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let active = true;
    catalogService
      .getProductBySlug(slug)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        setColorId(data.colors?.[0]?.id ?? null);
        setSizeId(data.sizes?.[0]?.id ?? null);
        setReviews(data.reviews ?? []);
      })
      .catch((err) => active && setError(getErrorMessage(err, "This product couldn't be loaded.")));
    return () => {
      active = false;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Product unavailable" description={error} actionLabel="Back to shop" actionHref="/shop" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/4" />
          <TextLineSkeleton lines={4} />
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants?.find(
    (v) => (colorId ? v.color?.id === colorId : true) && (sizeId ? v.size?.id === sizeId : true)
  );

  async function handleAddToCart(redirectToCheckout = false) {
    setIsAdding(true);
    try {
      await addItem({
        type: "product",
        product_variant_id: selectedVariant?.id,
        quantity,
      });
      showToast({ title: "Added to cart", description: product!.name, variant: "success" });
      if (redirectToCheckout) router.push("/checkout");
    } catch (err) {
      showToast({ title: "Couldn't add to cart", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsAdding(false);
    }
  }

  const images = product.images?.length ? product.images : [{ id: 0, url: "/placeholders/product.svg", alt: product.name }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link href="/shop" className="hover:text-neutral-900">
          Shop
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/shop/${product.category.slug}`} className="hover:text-neutral-900">
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-neutral-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={images[activeImage]?.url}
              alt={images[activeImage]?.alt || product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              className="object-cover"
            />
            <DiscountBadge priceMinor={product.price_minor} salePriceMinor={product.sale_price_minor} />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === activeImage}
                  className={`relative h-20 w-16 overflow-hidden rounded-md border-2 ${i === activeImage ? "border-neutral-900" : "border-transparent"}`}
                >
                  <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">{product.name}</h1>
          {typeof product.rating_avg === "number" && (
            <p className="mt-1 text-sm text-neutral-500">
              {product.rating_avg.toFixed(1)} ★ ({product.reviews_count ?? reviews.length} reviews)
            </p>
          )}
          <PriceDisplay priceMinor={product.price_minor} salePriceMinor={product.sale_price_minor} size="lg" className="mt-4" />

          {product.short_description && <p className="mt-4 text-sm leading-relaxed text-neutral-600">{product.short_description}</p>}

          {product.colors?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-neutral-900">Color</p>
              <ColorSwatchGroup colors={product.colors} selectedId={colorId} onChange={setColorId} />
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-neutral-900">Size</p>
              <SizeSelector sizes={product.sizes} selectedId={sizeId} onChange={setSizeId} />
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <p className="text-sm font-medium text-neutral-900">Quantity</p>
            <div className="flex items-center rounded-full border border-neutral-300">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-neutral-700"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-6 text-center text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-1.5 text-neutral-700"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              disabled={isAdding}
              className="flex-1 rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
            >
              {isAdding ? "Adding…" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={isAdding}
              className="flex-1 rounded-full border border-neutral-900 py-3.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-60"
            >
              Buy Now
            </button>
          </div>

          <Link
            href={`/customize?garment=${product.slug}`}
            className="mt-4 inline-block text-sm font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
          >
            Customize this garment →
          </Link>

          {product.description && (
            <div className="mt-10 border-t border-neutral-200 pt-6">
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">Description</h2>
              <p className="text-sm leading-relaxed text-neutral-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 border-t border-neutral-200 pt-10">
        <h2 className="mb-6 font-serif text-xl font-semibold text-neutral-900">Reviews</h2>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <ReviewList reviews={reviews} />
          <ReviewForm productId={product.id} onSubmitted={(review) => setReviews((prev) => [review, ...prev])} />
        </div>
      </section>

      {product.related_products && product.related_products.length > 0 && (
        <section className="mt-16 border-t border-neutral-200 pt-10">
          <h2 className="mb-6 font-serif text-xl font-semibold text-neutral-900">You May Also Like</h2>
          <ProductGrid products={product.related_products} />
        </section>
      )}
    </div>
  );
}
