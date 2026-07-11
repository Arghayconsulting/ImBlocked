import type { ReactNode } from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold text-gray-900">How imblocked.in works</h1>
        <p className="text-lg text-gray-600">
          Two sides to the same sticker — the owner who registers, and the finder who scans.
        </p>
      </div>

      {/* Owner side */}
      <section className="mb-14">
        <div className="mb-6">
          <span className="rounded-full bg-gray-900 px-3 py-1 text-sm font-semibold text-white">
            For vehicle owners
          </span>
        </div>
        <ol className="flex flex-col gap-6">
          <OwnerStep
            n={1}
            title="Create a free account"
            body={
              <>
                Go to{' '}
                <Link href="/signup" className="font-medium text-red-600 underline">
                  imblocked.in/signup
                </Link>{' '}
                and register with your email. No credit card, no subscription.
              </>
            }
          />
          <OwnerStep
            n={2}
            title="Add your vehicle"
            body='In your dashboard, click "Add vehicle" and enter a label — your license plate works fine. Each vehicle gets a unique QR sticker linked only to that registration.'
          />
          <OwnerStep
            n={3}
            title="Print and stick"
            body="Download the QR code from your dashboard. Print it on weatherproof sticker paper (A4 label sheets from any stationery shop work) and stick it on your windshield, ideally bottom-left or bottom-right where it is visible but not obstructing your view."
          />
          <OwnerStep
            n={4}
            title="Keep the dashboard tab open"
            body="While SMS/WhatsApp alerts are pending DLT registration, incidents appear in real time on your dashboard via Supabase Realtime. Keep the tab open when parked somewhere you might block traffic."
          />
          <OwnerStep
            n={5}
            title="Move and mark resolved"
            body='When you see an incident, move your car. Hit "Mark resolved" so the blocked driver knows you are on it.'
          />
        </ol>
      </section>

      {/* Finder side */}
      <section className="mb-14">
        <div className="mb-6">
          <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
            For the blocked driver (finder)
          </span>
        </div>
        <ol className="flex flex-col gap-6">
          <FinderStep
            n={1}
            title="Point your camera at the QR sticker"
            body="Open your phone camera (no app needed) and point it at the imblocked.in sticker on the windshield. Tap the notification that appears."
          />
          <FinderStep
            n={2}
            title="Tap Notify Owner Now"
            body="The scan page loads instantly in your browser. One tap on the red button sends a live incident to the owner's dashboard. No account needed."
          />
          <FinderStep
            n={3}
            title="Wait — the owner is on their way"
            body="You will see a confirmation that the owner has been notified. Once they move the car, tap Yes, resolved to close the incident."
          />
        </ol>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Frequently asked questions</h2>
        <div className="flex flex-col gap-5">
          <FAQ
            q="Does the finder need to install an app?"
            a="No. They scan the QR with any phone camera (iOS or Android) and the page opens in their browser — no Play Store, no App Store, no sign-in."
          />
          <FAQ
            q="Is my phone number shared with the finder?"
            a="Never. The finder only sends a notification; they never see your contact details."
          />
          <FAQ
            q="What if I am not watching the dashboard?"
            a="SMS and WhatsApp push notifications are built and will activate once our Mtalkz DLT sender ID clears (India's TRAI requirement). Until then, keep the dashboard open when parked where blocking is likely."
          />
          <FAQ
            q="Can I register multiple vehicles?"
            a="Yes — there is no limit. Each vehicle gets its own independent QR sticker."
          />
          <FAQ
            q="What happens if someone scans an inactive or invalid sticker?"
            a="They see a friendly error: sticker code is invalid or no longer active. Nothing is sent."
          />
          <FAQ
            q="Is this service free?"
            a="Yes, completely free for now. No ads, no data selling, no subscription."
          />
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-gray-50 px-8 py-10 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">Ready to register your vehicle?</h2>
        <p className="mb-6 text-gray-600">Your QR sticker is ready to download in under a minute.</p>
        <Link
          href="/signup"
          className="inline-block rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white hover:bg-red-700"
        >
          Create free account
        </Link>
      </div>
    </div>
  );
}

function OwnerStep({ n, title, body }: { n: number; title: string; body: ReactNode }) {
  return (
    <li className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
        {n}
      </div>
      <div>
        <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{body}</p>
      </div>
    </li>
  );
}

function FinderStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
        {n}
      </div>
      <div>
        <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{body}</p>
      </div>
    </li>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <p className="mb-1.5 font-semibold text-gray-900">{q}</p>
      <p className="text-sm text-gray-600">{a}</p>
    </div>
  );
}
