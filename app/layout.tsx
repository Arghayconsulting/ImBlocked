import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { Nav } from '@/lib/auth/Nav';
import { Footer } from '@/lib/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'imblocked.in — Get Unblocked in Seconds',
  description: 'Scan the QR sticker on a blocking car. The owner gets notified instantly. No app needed.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-slate-900 antialiased">
        <AuthProvider>
          <Nav />
          <div className="flex min-h-[calc(100dvh-65px)] flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
