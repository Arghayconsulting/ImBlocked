'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function Nav() {
  const { session, signOut, loading } = useAuth();
  const pathname = usePathname();

  const isScan = pathname?.startsWith('/scan');
  if (isScan) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
            iB
          </span>
          <span className="font-bold text-slate-900">imblocked.in</span>
        </Link>

        {/* Centre nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/how-it-works" className="hover:text-slate-900 transition-colors">
            How it works
          </Link>
          <Link href="/contact" className="hover:text-slate-900 transition-colors">
            Contact
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 text-sm font-medium">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-slate-600 hover:text-slate-900 transition-colors sm:block"
              >
                Dashboard
              </Link>
              {session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                <Link
                  href="/admin"
                  className="hidden text-slate-500 hover:text-red-600 transition-colors sm:block"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-slate-600 hover:text-slate-900 transition-colors sm:block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
