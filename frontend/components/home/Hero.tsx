import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      <Image
        src="/placeholders/hero.svg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-70"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">Made to your measure</p>
        <h1 className="max-w-xl font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          Clothing that fits your story, not just your size.
        </h1>
        <p className="max-w-md text-base text-neutral-300 sm:text-lg">
          Shop premium ready-to-wear, or design a completely custom garment — your fabric, your colors, your logo — with a
          live preview as you build it.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Shop Collection
          </Link>
          <Link
            href="/customize"
            className="inline-flex items-center justify-center rounded-full border border-white/70 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Customize Your Garment
          </Link>
        </div>
      </div>
    </section>
  );
}
