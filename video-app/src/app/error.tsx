'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle size={48} className="text-red-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-surface-500 mb-6">An unexpected error occurred. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
