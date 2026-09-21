import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-32 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">404</p>
      <h1 className="font-serif text-3xl font-semibold text-neutral-900">Page not found</h1>
      <p className="text-neutral-600">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Back to home
      </Link>
    </div>
  );
}
