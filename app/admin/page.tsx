'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { PLANS, type Vehicle, type Incident, type AdminUser, type Plan } from '@/lib/types';

interface AdminStats {
  totalStickers: number;
  activeStickers: number;
  totalIncidents: number;
  pendingIncidents: number;
  resolvedIncidents: number;
}

interface RecentIncident extends Incident {
  vehicle_hint: string | null;
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

export default function AdminPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && !session) { router.replace('/login'); return; }
    if (!authLoading && session && !isAdmin) { router.replace('/dashboard'); }
  }, [authLoading, session, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoadingData(true);
      try {
        const [stickersRes, incidentsRes] = await Promise.all([
          supabase.from('stickers').select('id, status, vehicle_hint, vehicle_type, created_at, owner_user_id'),
          supabase.from('incidents').select('id, sticker_id, status, created_at, resolved_at').order('created_at', { ascending: false }).limit(50),
        ]);

        if (stickersRes.error) throw stickersRes.error;
        if (incidentsRes.error) throw incidentsRes.error;

        const stickers = (stickersRes.data ?? []) as Vehicle[];
        const incidents = (incidentsRes.data ?? []) as Incident[];

        const stickerMap = new Map(stickers.map((s) => [s.id, s.vehicle_hint]));

        setVehicles(stickers);
        setRecentIncidents(
          incidents.map((i) => ({ ...i, vehicle_hint: stickerMap.get(i.sticker_id) ?? null }))
        );
        setStats({
          totalStickers: stickers.length,
          activeStickers: stickers.filter((s) => s.status === 'active').length,
          totalIncidents: incidents.length,
          pendingIncidents: incidents.filter((i) => i.status === 'pending' || i.status === 'notified').length,
          resolvedIncidents: incidents.filter((i) => i.status === 'resolved').length,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data. Check admin RLS policies.');
      } finally {
        setLoadingData(false);
      }
    })();

    // Isolated: a failure here (e.g. admin RPC not deployed/migrated yet) shouldn't
    // blank out the rest of the admin page's stats/incidents/vehicles.
    (async () => {
      setLoadingUsers(true);
      const { data, error: usersErr } = await supabase.rpc('admin_list_users');
      if (usersErr) { setUsersError(usersErr.message); setLoadingUsers(false); return; }
      setUsers((data ?? []) as AdminUser[]);
      setLoadingUsers(false);
    })();
  }, [isAdmin]);

  async function handleChangePlan(userId: string, plan: Plan) {
    setSavingUserId(userId);
    const { error: rpcError } = await supabase.rpc('admin_set_user_plan', { p_user_id: userId, p_plan: plan });
    setSavingUserId(null);
    if (rpcError) { alert(`Failed to update plan: ${rpcError.message}`); return; }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan } : u)));
  }

  if (authLoading || !session || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-500">imblocked.in system overview</p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">Limited data access</p>
          <p className="mt-1 text-xs text-amber-700">{error}</p>
          <p className="mt-2 text-xs text-amber-600">
            To see all users data, add an admin RLS policy in Supabase granting your account SELECT on all rows.
          </p>
        </div>
      )}

      {/* Stats grid */}
      {loadingData ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <AdminStat label="Total stickers" value={stats.totalStickers} color="slate" />
          <AdminStat label="Active stickers" value={stats.activeStickers} color="green" />
          <AdminStat label="Total incidents" value={stats.totalIncidents} color="slate" />
          <AdminStat label="Pending alerts" value={stats.pendingIncidents} color="red" />
          <AdminStat label="Resolved" value={stats.resolvedIncidents} color="green" />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent incidents — 3 cols */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Recent incidents</h2>
              <p className="text-xs text-slate-400">Last 50 incidents across all vehicles</p>
            </div>
            <div className="divide-y divide-slate-100">
              {loadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  </div>
                ))
              ) : recentIncidents.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-400">No incidents found.</p>
              ) : (
                recentIncidents.slice(0, 20).map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {incident.vehicle_hint ?? 'Unknown vehicle'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(incident.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <StatusBadge status={incident.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Vehicles — 2 cols */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Registered vehicles</h2>
              <p className="text-xs text-slate-400">{vehicles.length} total</p>
            </div>
            <div className="divide-y divide-slate-100">
              {loadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-4">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                  </div>
                ))
              ) : vehicles.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-400">No vehicles found.</p>
              ) : (
                vehicles.slice(0, 15).map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{v.vehicle_hint ?? 'Unnamed'}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(v.created_at).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System status card */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">System status</h2>
            <div className="flex flex-col gap-3">
              <StatusRow label="Supabase Realtime" status="operational" />
              <StatusRow label="Scan page (QR)" status="operational" />
              <StatusRow label="SMS / WhatsApp" status="pending" note="DLT pending" />
              <StatusRow label="Static export (Vercel)" status="operational" />
            </div>
          </div>
        </div>
      </div>

      {/* Users & Subscriptions */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Users & Subscriptions</h2>
          <p className="text-xs text-slate-400">
            {users.length} users · Premium/Premium Pro have no self-serve payment flow yet — change a user&apos;s plan here to grant it manually.
          </p>
        </div>
        {usersError && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold text-amber-800">Couldn&apos;t load users</p>
            <p className="mt-1 text-xs text-amber-700">{usersError}</p>
          </div>
        )}
        <div className="divide-y divide-slate-100">
          {loadingUsers ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              </div>
            ))
          ) : usersError ? null : users.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{u.name ?? 'Unnamed user'}</p>
                  <p className="truncate text-xs text-slate-400">{u.phone_number ?? 'No phone number'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={u.plan}
                    disabled={savingUserId === u.id}
                    onChange={(e) => handleChangePlan(u.id, e.target.value as Plan)}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
                  >
                    {PLANS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  {savingUserId === u.id && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminStat({ label, value, color }: { label: string; value: number; color: 'slate' | 'red' | 'green' }) {
  const map = { slate: 'bg-slate-50 text-slate-900', red: 'bg-red-50 text-red-700', green: 'bg-green-50 text-green-700' };
  return (
    <div className={`rounded-2xl p-5 ${map[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-70">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    notified: 'bg-orange-100 text-orange-700',
    resolved: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

function StatusRow({ label, status, note }: { label: string; status: 'operational' | 'pending' | 'down'; note?: string }) {
  const dot = { operational: 'bg-green-500', pending: 'bg-yellow-500', down: 'bg-red-500' };
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-600">{label}</p>
      <div className="flex items-center gap-1.5">
        {note && <span className="text-xs text-slate-400">{note}</span>}
        <span className={`h-2 w-2 rounded-full ${dot[status]}`} />
      </div>
    </div>
  );
}
