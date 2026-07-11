'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: 'https://imblocked.in/auth/confirm',
      },
    });
    setLoading(false);
    if (error) {
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists') ||
        error.message.toLowerCase().includes('user already')
      ) {
        setError('An account with this email already exists. Please log in or reset your password.');
      } else {
        setError(error.message);
      }
      return;
    }
    // Supabase silently succeeds for existing confirmed emails — detect by checking identities
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists. Please log in or reset your password.');
      return;
    }
    if (data.session) { router.push('/dashboard'); } else { setConfirmEmailSent(true); }
  }

  if (confirmEmailSent) {
    return (
      <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Check your email</h1>
          <p className="mb-6 text-slate-500">
            We sent a confirmation link to <span className="font-semibold text-slate-700">{email}</span>. Click it to activate your account.
          </p>
          <Link href="/login" className="inline-block rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-64px)]">
      {/* Left panel */}
      <div className="hidden flex-col justify-between bg-slate-900 p-12 lg:flex lg:w-5/12">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">iB</span>
          <span className="font-bold text-white">imblocked.in</span>
        </Link>
        <div className="flex flex-col gap-5">
          <Benefit icon="🏷️" text="Get a unique QR sticker for every vehicle you own" />
          <Benefit icon="⚡" text="Real-time dashboard alerts when someone is blocked" />
          <Benefit icon="🔒" text="Your phone number is never shared with anyone" />
          <Benefit icon="🆓" text="Completely free — no hidden fees, no subscriptions" />
        </div>
        <p className="text-xs text-slate-500">Join hundreds of vehicle owners across India.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Get your first QR sticker in under a minute.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Your name</label>
              <input
                required
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
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
                minLength={6}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
                {(error.includes('already exists') || error.includes('already registered')) && (
                  <div className="mt-2 flex gap-3">
                    <Link href="/login" className="font-semibold underline">Log in</Link>
                    <Link href="/forgot-password" className="font-semibold underline">Reset password</Link>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create free account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-red-600 hover:text-red-700">
              Log in
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-slate-400">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-600">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}
