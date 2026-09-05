import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'StreamVault — Share, Watch, Download',
    template: '%s | StreamVault',
  },
  description: 'A modern video sharing and download platform.',
};

// The header renders live categories from the database and most pages read
// the live session/DB on every request, so nothing in this app benefits
// from static prerendering. Forcing dynamic rendering here (rather than
// leaving Next to decide) is also what makes `npm run build` succeed
// without a database connection available at build time.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
