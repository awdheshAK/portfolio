'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: '!bg-surface-900 !text-surface-100 !border !border-surface-800',
            duration: 4000,
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
