'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { Vehicle, Incident } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { session, profile, loading: authLoading, refreshProfile } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [vehicleHint, setVehicleHint] = useState('');
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [addVehicleError, setAddVehicleError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/login');
  }, [authLoading, session, router]);

  useEffect(() => {
    if (profile) { setName(profile.name ?? ''); setPhone(profile.phone_number ?? ''); }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      const { data: vehicleRows } = await supabase
        .from('stickers')
        .select('id, status, vehicle_hint, created_at')
        .eq('owner_user_id', profile.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      const owned = (vehicleRows as Vehicle[]) ?? [];
      setVehicles(owned);
      if (owned.length > 0) {
        const { data: incidentRows } = await supabase
          .from('incidents')
          .select('id, sticker_id, status, created_at, resolved_at')
          .in('sticker_id', owned.map((v) => v.id))
          .order('created_at', { ascending: false });
        if (!cancelled) setIncidents((incidentRows as Incident[]) ?? []);
      }
      setLoadingData(false);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const ownedVehicleIds = vehicles.map((v) => v.id).join(',');

  useEffect(() => {
    if (!profile || !ownedVehicleIds) return;
    const ownedIds = new Set(ownedVehicleIds.split(','));
    const channel = supabase
      .channel('owner-incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        const row = (payload.new ?? payload.old) as Incident;
        if (!row || !ownedIds.has(row.sticker_id)) return;
        setIncidents((prev) => {
          if (payload.eventType === 'DELETE') return prev.filter((i) => i.id !== row.id);
          const next = prev.filter((i) => i.id !== row.id);
          return [row, ...next].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, ownedVehicleIds]);

  async function handleAddVehicle(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setAddingVehicle(true);
    setAddVehicleError(null);
    const { data, error } = await supabase
      .from('stickers')
      .insert({ owner_user_id: profile.id, vehicle_hint: vehicleHint || null, status: 'active' })
      .select('id, status, vehicle_hint, created_at')
      .single();
    setAddingVehicle(false);
    if (error || !data) { setAddVehicleError(error?.message ?? 'Failed to add vehicle'); return; }
    setVehicles((prev) => [data as Vehicle, ...prev]);
    setVehicleHint('');
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setProfileSaved(false);
    const { error } = await supabase
      .from('users')
      .update({ name, phone_number: phone || null })
      .eq('id', profile.id);
    setSavingProfile(false);
    if (!error) { setProfileSaved(true); await refreshProfile(); }
  }

  async function handleResolve(incidentId: string) {
    await supabase.rpc('resolve_incident', { p_incident_id: incidentId });
  }

  async function handleDeleteVehicle(vehicleId: string) {
    if (!confirm('Delete this vehicle and its QR code? This cannot be undone.')) return;
    const { error } = await supabase.from('stickers').delete().eq('id', vehicleId);
    if (!error) setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  }

  if (authLoading || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
      </div>
    );
  }

  const pendingCount = incidents.filter((i) => i.status === 'pending' || i.status === 'notified').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Manage your vehicles and view notifications.</p>
      </div>

      {/* Stats strip */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="Vehicles" value={vehicles.length} color="slate" />
        <StatCard label="Active alerts" value={pendingCount} color="red" />
        <StatCard label="Resolved" value={resolvedCount} color="green" />
      </div>

      {/* Profile */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Your profile</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 sm:flex-row">
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <input
            placeholder="Phone (e.g. +91XXXXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save'}
          </button>
        </form>
        {profileSaved && <p className="mt-2 text-xs text-green-600">Profile saved successfully.</p>}
        <p className="mt-3 text-xs text-slate-400">
          Phone is used for SMS/WhatsApp alerts (coming soon — DLT registration pending).
        </p>
      </section>

      {/* Vehicles */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Your vehicles</h2>
          <span className="text-xs text-slate-400">{vehicles.length} registered</span>
        </div>
        <form onSubmit={handleAddVehicle} className="mb-5 flex gap-3">
          <input
            placeholder="License plate or description (e.g. MH12AB1234)"
            value={vehicleHint}
            onChange={(e) => setVehicleHint(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <button
            type="submit"
            disabled={addingVehicle}
            className="shrink-0 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {addingVehicle ? 'Adding...' : '+ Add vehicle'}
          </button>
        </form>
        {addVehicleError && <p className="mb-3 text-xs text-red-600">{addVehicleError}</p>}

        {loadingData ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
            <p className="text-2xl mb-2">🚗</p>
            <p className="text-sm font-medium text-slate-600">No vehicles yet</p>
            <p className="text-xs text-slate-400">Add one above to get your scannable QR sticker.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onDelete={handleDeleteVehicle} />
            ))}
          </div>
        )}
      </section>

      {/* Incidents */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Incident log</h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {pendingCount} active
            </span>
          )}
        </div>
        {incidents.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-medium text-slate-600">No incidents yet</p>
            <p className="text-xs text-slate-400">When someone scans your sticker, it will appear here.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {incidents.map((incident) => {
              const vehicleHint = vehicles.find((v) => v.id === incident.sticker_id)?.vehicle_hint;
              const isPending = incident.status === 'pending' || incident.status === 'notified';
              return (
                <li
                  key={incident.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                    isPending ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {vehicleHint ?? 'Unknown vehicle'}
                      </p>
                      <StatusBadge status={incident.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(incident.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      {incident.resolved_at && (
                        <span className="ml-2 text-green-600">
                          Resolved {new Date(incident.resolved_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                        </span>
                      )}
                    </p>
                  </div>
                  {isPending && (
                    <button
                      onClick={() => handleResolve(incident.id)}
                      className="ml-4 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                    >
                      Mark resolved
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'slate' | 'red' | 'green' }) {
  const colorMap = {
    slate: 'bg-slate-50 text-slate-900',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  };
  return (
    <div className={`rounded-2xl p-5 ${colorMap[color]}`}>
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
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

function VehicleCard({ vehicle, onDelete }: { vehicle: Vehicle; onDelete: (id: string) => void }) {
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/scan/${vehicle.id}`;
    setScanUrl(url);
    QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: '#0f172a', light: '#ffffff' } }).then(setQrDataUrl);
  }, [vehicle.id]);

  function downloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `imblocked-${vehicle.vehicle_hint ?? vehicle.id}.png`;
    a.click();
  }

  return (
    <div className="flex items-center gap-5 rounded-xl border border-slate-200 p-4">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR code" className="h-20 w-20 shrink-0 rounded-lg cursor-pointer" onClick={downloadQR} title="Click to download" />
      ) : (
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-lg bg-slate-100" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900">{vehicle.vehicle_hint ?? 'Unnamed vehicle'}</p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          vehicle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {vehicle.status}
        </span>
        {scanUrl && (
          <p className="mt-1.5 truncate text-xs text-slate-400">{scanUrl}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        {scanUrl && (
          <a
            href={scanUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 text-center"
          >
            Test scan
          </a>
        )}
        {qrDataUrl && (
          <button
            onClick={downloadQR}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Download QR
          </button>
        )}
        <button
          onClick={() => onDelete(vehicle.id)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
