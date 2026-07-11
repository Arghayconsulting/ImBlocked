import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-slate-900 px-6 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-red-600/5 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/10 px-4 py-1.5 text-sm text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Built for Indian roads
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            Blocked by a<br />
            <span className="text-red-500">parked car?</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 sm:text-xl">
            Register your vehicle, get a QR sticker for your windshield. Anyone blocked by your car scans it — you get notified instantly. No app needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 hover:shadow-red-600/40"
            >
              Get your free sticker
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-slate-600 px-8 py-4 text-base font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">Free forever. No credit card. No app install.</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-b border-slate-100 bg-white px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-slate-100">
          <Stat value="0" label="App installs needed" sub="for the finder" />
          <Stat value="&lt;30s" label="Notification time" sub="owner alerted instantly" />
          <Stat value="100%" label="Free, always" sub="no subscriptions" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-600">How it works</p>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Three steps to get unblocked</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step
              number="01"
              icon="🏷️"
              title="Register & get your sticker"
              body="Create a free account, add your vehicle, and download a unique QR code. Print it and stick it on your windshield."
            />
            <Step
              number="02"
              icon="📲"
              title="Blocked driver scans"
              body="Anyone blocked opens their phone camera, scans your sticker, and taps Notify Owner. No account, no app needed."
            />
            <Step
              number="03"
              icon="🚗"
              title="You see it, you move"
              body="The incident appears live on your dashboard. Move your car and mark it resolved in under a minute."
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-600">Features</p>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Everything you need, nothing you don't</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon="📱" title="No app for finders" body="Finders scan with any phone camera. The page opens in their browser — no Play Store, no sign-in." />
            <Feature icon="⚡" title="Real-time alerts" body="Incidents appear live on your dashboard via Supabase Realtime. No polling, no delay." />
            <Feature icon="🔒" title="Your number stays private" body="Finders never see your contact details. Notifications go only to you." />
            <Feature icon="🚙" title="Multiple vehicles" body="Register as many vehicles as you own. Each gets its own unique QR sticker." />
            <Feature icon="🔔" title="SMS & WhatsApp soon" body="Push notifications via SMS and WhatsApp are built — activating once DLT registration clears." />
            <Feature icon="✅" title="Incident tracking" body="View all past incidents, see resolution times, and track your full notification history." />
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-600">Where it helps</p>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Built for the chaos of Indian parking</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <UseCase title="Malls & multiplexes" body="Double-parked outside a mall? Your sticker means someone can reach you without calling security." />
            <UseCase title="Apartments & societies" body="Blocking the gate or a neighbour's spot? One scan and you know to move before trouble starts." />
            <UseCase title="Restaurants & dhabas" body="Quick chai stop that turned long? Your car won't cause a scene while you're inside." />
            <UseCase title="Markets & busy streets" body="Street parking in a tight bazaar? Give blocked drivers a way to reach you, not your windshield." />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-slate-900 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Ready to never be that car?</h2>
          <p className="mb-10 text-slate-400">
            Sign up in 30 seconds. Your sticker is ready to print the moment you add a vehicle.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-red-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700"
          >
            Create free account
          </Link>
          <p className="mt-5 text-sm text-slate-500">No credit card. No app. Just a QR code.</p>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="px-6 text-center first:pl-0 last:pr-0">
      <p className="text-3xl font-bold text-slate-900 sm:text-4xl" dangerouslySetInnerHTML={{ __html: value }} />
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function Step({ number, icon, title, body }: { number: string; icon: string; title: string; body: string }) {
  return (
    <div className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <span className="absolute right-6 top-6 text-4xl font-black text-slate-100">{number}</span>
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-red-200 hover:shadow-sm">
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="mb-1.5 font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

function UseCase({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
        <div className="h-2 w-2 rounded-full bg-red-600" />
      </div>
      <div>
        <h3 className="mb-1 font-bold text-slate-900">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{body}</p>
      </div>
    </div>
  );
}
