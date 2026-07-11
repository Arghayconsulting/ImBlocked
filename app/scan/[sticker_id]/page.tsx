'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Phase = 'loading' | 'ready' | 'notifying' | 'notified' | 'error' | 'invalid';

export default function ScanPage() {
  const { sticker_id } = useParams<{ sticker_id: string }>();
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sticker_id || !UUID_RE.test(sticker_id)) { setPhase('invalid'); return; }
    setPhase('ready');
  }, [sticker_id]);

  async function handleNotify() {
    setPhase('notifying');
    try {
      const { error } = await supabase.functions.invoke('trigger-sms', { body: { sticker_id } });
      if (error) throw error;
      setPhase('notified');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setPhase('error');
    }
  }

  if (phase === 'loading') return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
    </div>
  );

  if (phase === 'invalid') return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-6xl mb-4">🚫</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid QR code</h1>
        <p className="text-slate-500 mb-6">This QR code is not registered with imblocked.in.</p>
        <Link href="/" className="inline-block rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">Go to homepage</Link>
      </div>
    </div>
  );

  if (phase === 'notified') return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Owner notified!</h1>
        <p className="text-slate-500 mb-6">The vehicle owner has been alerted and should move their car shortly.</p>
        <p className="text-xs text-slate-400">Powered by <span className="font-semibold">imblocked.in</span></p>
      </div>
    </div>
  );

  if (phase === 'error') return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Could not notify</h1>
        <p className="text-slate-500 mb-6 text-sm">{errorMsg}</p>
        <button onClick={() => setPhase('ready')} className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">Try again</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <span className="text-4xl">🚗</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle blocking your way?</h1>
          <p className="mt-2 text-slate-500">Tap below to alert the owner instantly. No app needed.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <span className="text-xl">⚠️</span>
            <p className="text-sm text-amber-800">Only use this if the vehicle is genuinely blocking you. The owner will be notified immediately.</p>
          </div>

          <button
            onClick={handleNotify}
            disabled={phase === 'notifying'}
            className="w-full rounded-xl bg-red-600 py-4 text-base font-bold text-white transition hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {phase === 'notifying' ? (
              <><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />Notifying owner…</>
            ) : '🔔 Notify the owner'}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">The owner's phone number stays private at all times.</p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by <Link href="/" className="font-semibold text-slate-600 hover:text-red-600">imblocked.in</Link>
        </p>
      </div>
    </div>
  );
}
