export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-600">Legal</p>
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: July 2026</p>
      </div>

      <div className="prose prose-slate max-w-none">
        <Section title="1. What we collect">
          <p>
            When you create an account, we collect your name, email address, and optionally your
            phone number. When you register a vehicle, we store a text description (e.g. your
            license plate). When a scan incident is created, we store a timestamp and the sticker
            UUID — no personal data from the finder is collected.
          </p>
        </Section>

        <Section title="2. How we use it">
          <p>
            Your email and phone number are used solely to send you parking alerts (email
            confirmation and, once active, SMS or WhatsApp notifications). We do not sell, rent,
            or trade your personal data to any third party.
          </p>
        </Section>

        <Section title="3. What finders see">
          <p>
            A finder who scans your QR sticker sees only a generic notification page. They never
            see your name, email, or phone number. The only thing they can do is send an
            anonymous alert to your dashboard.
          </p>
        </Section>

        <Section title="4. Data storage">
          <p>
            All data is stored on Supabase (Postgres + Auth), hosted on AWS infrastructure.
            Row-Level Security (RLS) policies ensure each user can only access their own data.
            Anonymous finders interact only through SECURITY DEFINER RPCs that insert a minimal
            incident record with no reference to their identity.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>
            We use a single session cookie managed by Supabase Auth to keep you logged in. No
            tracking or advertising cookies are set.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            You can delete your account and all associated data at any time by emailing
            hello@imblocked.in. We will process the request within 7 working days.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            For any privacy-related queries, write to us at hello@imblocked.in.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2>
      <div className="text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}
