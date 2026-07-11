'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { Sticker } from '@/lib/types';

type FlowState =
  | { step: 'loading' }
  | { step: 'not_found' }
  | { step: 'ready'; sticker: Sticker }
  | { step: 'sending' }
  | { step: 'sent'; incidentId: string }
  | { step: 'send_failed'; message: string }
  | { step: 'resolved' };

function getStickerIdFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

export default function ScanClient() {
  const pathname = usePathname();
  const stickerId = getStickerIdFromPath(pathname ?? '');
  const [state, setState] = useState<FlowState>({ step: 'loading' });

  useEffect(() => {
    if (!stickerId || stickerId === '_') { setState({ step: 'not_found' }); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('stickers')
        .select('id, status, vehicle_hint')
        .eq('id', stickerId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data || data.status !== 'active') { setState({ step: 'not_found' }); return; }
      setState({ step: 'ready', sticker: data as Sticker });
    })();
    return () => { cancelled = true; };
  }, [stickerId]);

  async function handleNotify() {
    setState({ step: 'sending' });
    const { data, error } = await supabase.rpc('create_incident', { p_sticker_id: stickerId });
    if (error || !data) {
      setState({ step: 'send_failed', message: error?.message ?? 'Something went wrong. Please try again.' });
      return;
    }
    setState({ step: 'sent', incidentId: data as string });
  }

  async function handleResolved(incidentId: string) {
    await supabase.rpc('resolve_incident', { p_incident_id: incidentId });
    setState({ step: 'resolved' });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-xs font-bold">iB</span>
          <span className="text-sm font-semibold text-slate-300">imblocked.in</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">

        {state.step === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
            <p className="text-slate-400">Loading sticker info...</p>
          </div>
        )}

        {state.step === 'not_found' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-4xl">❌</div>
            <div>
              <h1 className="text-xl font-bold text-white">Sticker not found</h1>
              <p className="mt-2 max-w-xs text-sm text-slate-400">
                This sticker code is invalid or no longer active.
              </p>
            </div>
            <Link href="/" className="text-sm text-slate-400 underline hover:text-white">
              Learn about imblocked.in
            </Link>
          </div>
        )}

        {state.step === 'ready' && (
          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-600/10 text-5xl ring-1 ring-red-600/30">
              🚗
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vehicle blocked</p>
              <h1 className="mt-2 text-2xl font-bold text-white">
                {state.sticker.vehicle_hint ?? 'A car is blocking you'}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Tap the button below to alert the owner. They will be notified instantly on their dashboard.
              </p>
            </div>
            <button
              onClick={handleNotify}
              className="w-full rounded-2xl bg-red-600 py-5 text-lg font-bold text-white shadow-lg shadow-red-600/30 transition active:scale-95 active:bg-red-700"
            >
              Notify Owner Now
            </button>
            <p className="text-xs text-slate-600">No account needed. Your identity stays private.</p>
          </div>
        )}

        {state.step === 'sending' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
            <p className="text-slate-400">Notifying owner...</p>
          </div>
        )}

        {state.step === 'sent' && (
          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-600/10 text-5xl ring-1 ring-green-600/30">
              ✅
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Owner notified!</h1>
              <p className="mt-2 text-sm text-slate-400">
                The owner can see this alert on their live dashboard and is on their way.
              </p>
            </div>
            <div className="w-full rounded-2xl bg-slate-800 p-5">
              <p className="mb-4 text-sm font-semibold text-slate-300">Was it resolved?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolved(state.incidentId)}
                  className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                >
                  Yes, resolved
                </button>
                <button
                  onClick={() => setState(state)}
                  className="flex-1 rounded-xl border border-slate-600 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-400"
                >
                  Not yet
                </button>
              </div>
            </div>
          </div>
        )}

        {state.step === 'send_failed' && (
          <div className="flex w-full max-w-sm flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600/10 text-4xl ring-1 ring-red-600/30">
              ⚠️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
              <p className="mt-2 text-sm text-slate-400">{state.message}</p>
            </div>
            <button
              onClick={handleNotify}
              className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {state.step === 'resolved' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-600/10 text-5xl ring-1 ring-green-600/30">
              🎉
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">All sorted!</h1>
              <p className="mt-2 text-sm text-slate-400">Thanks for confirming. Glad it worked out.</p>
            </div>
            <Link href="/" className="text-sm text-slate-500 underline hover:text-white">
              Learn about imblocked.in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
