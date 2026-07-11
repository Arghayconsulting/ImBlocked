export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-600">Get in touch</p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Contact us</h1>
        <p className="mt-3 text-slate-500">
          Have a question, a partnership idea, or feedback? We would love to hear from you.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ContactCard
          icon="📧"
          title="Email us"
          detail="hello@imblocked.in"
          sub="We reply within 24 hours."
          href="mailto:hello@imblocked.in"
          linkLabel="Send email"
        />
        <ContactCard
          icon="🐛"
          title="Report a bug"
          detail="bugs@imblocked.in"
          sub="Found something broken? Tell us."
          href="mailto:bugs@imblocked.in"
          linkLabel="Report bug"
        />
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-8">
        <h2 className="mb-1 font-semibold text-slate-900">Frequently asked</h2>
        <p className="mb-6 text-sm text-slate-500">
          Before reaching out, check if your question is already answered.
        </p>
        <a
          href="/how-it-works"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-700"
        >
          View FAQ
          <span>→</span>
        </a>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-900 p-8 text-white">
        <h2 className="mb-2 font-semibold">Business & partnerships</h2>
        <p className="mb-4 text-sm text-slate-400">
          Interested in bulk sticker printing for apartment complexes, parking lots, or fleet operators?
          We would love to talk.
        </p>
        <a
          href="mailto:partnerships@imblocked.in"
          className="inline-block rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          partnerships@imblocked.in
        </a>
      </div>
    </div>
  );
}

function ContactCard({
  icon, title, detail, sub, href, linkLabel,
}: {
  icon: string; title: string; detail: string; sub: string; href: string; linkLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm font-medium text-slate-700">{detail}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      <a
        href={href}
        className="mt-4 inline-block text-sm font-semibold text-red-600 hover:text-red-700"
      >
        {linkLabel} →
      </a>
    </div>
  );
}
