'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase().includes('email not confirmed')
        ? 'Please confirm your email before logging in. Check your inbox for the verification link.'
        : error.message;
      setError(msg);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-[calc(100dvh-64px)]">
      {/* Left panel */}
      <div className="hidden flex-col justify-between bg-slate-900 p-12 lg:flex lg:w-5/12">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">iB</span>
          <span className="font-bold text-white">imblocked.in</span>
        </Link>
        <div>
          <blockquote className="text-xl font-medium leading-relaxed text-white">
            "Finally a solution for India's double-parking problem. My sticker has already saved me three times this week."
          </blockquote>
          <p className="mt-4 text-sm text-slate-400">— Priya S., Mumbai</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-slate-400">App installs needed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">30s</p>
            <p className="text-xs text-slate-400">To notify an owner</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Free</p>
            <p className="text-xs text-slate-400">Always</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Log in to manage your vehicles and incidents.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <Link href="/signup" className="font-semibold text-red-600 hover:text-red-700">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
