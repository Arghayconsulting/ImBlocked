export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-600">Legal</p>
        <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: July 2026</p>
      </div>

      <div className="prose prose-slate max-w-none">
        <Section title="1. Acceptance">
          <p>
            By creating an account or using imblocked.in, you agree to these Terms of Service.
            If you do not agree, please do not use the service.
          </p>
        </Section>

        <Section title="2. What imblocked.in does">
          <p>
            imblocked.in is a vehicle notification service. Registered vehicle owners place QR
            stickers on their windshields. Third parties who are blocked by that vehicle can scan
            the sticker to send an anonymous notification to the owner. The service facilitates
            communication only — it does not tow, move, or take any direct action regarding
            any vehicle.
          </p>
        </Section>

        <Section title="3. Your responsibilities">
          <p>
            You must provide accurate information when registering. You are responsible for
            ensuring your sticker details are up to date. You must not use the service to harass
            or intimidate other users. Misuse of the notification system (e.g. sending false
            incidents) may result in account termination.
          </p>
        </Section>

        <Section title="4. Service availability">
          <p>
            We provide imblocked.in on a best-effort basis. We do not guarantee 100% uptime.
            SMS and WhatsApp notifications are currently inactive pending regulatory approval
            (TRAI DLT registration); the dashboard notification system remains fully operational
            in the meantime.
          </p>
        </Section>

        <Section title="5. Liability">
          <p>
            imblocked.in is a communication tool. We are not liable for any disputes,
            damages, or losses arising from parking situations, vehicle interactions, or
            the actions of any user. Use this service responsibly and in compliance with
            local laws.
          </p>
        </Section>

        <Section title="6. Intellectual property">
          <p>
            All branding, code, and content on imblocked.in is our intellectual property.
            You may not reproduce or redistribute any part of the service without written consent.
          </p>
        </Section>

        <Section title="7. Changes to these terms">
          <p>
            We may update these terms at any time. Continued use of the service after changes
            are posted constitutes acceptance of the new terms.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>Questions? Write to hello@imblocked.in.</p>
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
