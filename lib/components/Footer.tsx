import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                iB
              </span>
              <span className="font-bold text-white">imblocked.in</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed">
              Scan the sticker, notify the driver, get unblocked. Built for Indian roads.
            </p>
            <p className="mt-4 text-xs text-slate-500">Made with love in India</p>
          </div>

          {/* Product */}
          <div>
            <p className="mb-4 text-sm font-semibold text-white">Product</p>
            <ul className="flex flex-col gap-3 text-sm">
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign up free</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Log in</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-sm font-semibold text-white">Company</p>
            <ul className="flex flex-col gap-3 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} imblocked.in. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
