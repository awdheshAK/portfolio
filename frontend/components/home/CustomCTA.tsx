import Link from "next/link";

export function CustomCTA() {
  return (
    <section className="bg-neutral-900 py-20 text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Can&apos;t find exactly what you want?</h2>
        <p className="max-w-xl text-neutral-300">
          Build it yourself. Choose the garment, fabric, color and size — add your logo, custom text, embroidery and
          patches — and watch it come together in a live preview before you order.
        </p>
        <Link
          href="/customize"
          className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Start Customizing
        </Link>
      </div>
    </section>
  );
}
