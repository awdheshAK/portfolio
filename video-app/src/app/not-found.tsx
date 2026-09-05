import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <FileQuestion size={48} className="text-surface-300 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-surface-500 mb-6">The video or page you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
      <Link href="/" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        Back to home
      </Link>
    </div>
  );
}
