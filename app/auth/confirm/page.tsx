'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus('success');
        setTimeout(() => router.replace('/dashboard'), 2000);
      } else if (event === 'TOKEN_REFRESHED') {
        setStatus('success');
        setTimeout(() => router.replace('/dashboard'), 2000);
      }
    });

    // Also check if session already exists (token already exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('success');
        setTimeout(() => router.replace('/dashboard'), 2000);
      } else {
        // Give it 3 seconds for the hash exchange, then show error
        setTimeout(() => {
          setStatus((prev) => prev === 'loading' ? 'error' : prev);
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <p className="text-slate-600">Confirming your email…</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Email confirmed!</h1>
          <p className="text-slate-500">Your account is active. Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Link expired</h1>
        <p className="mb-6 text-slate-500">This confirmation link has expired or already been used.</p>
        <Link href="/signup" className="inline-block rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">
          Sign up again
        </Link>
      </div>
    </div>
  );
}
