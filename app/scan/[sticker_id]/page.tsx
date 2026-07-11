import ScanClient from './ScanClient';

// In production (output: 'export'), we pre-render a single placeholder page at /scan/_/
// and the Vercel rewrite in vercel.json serves it for every real /scan/:uuid URL.
// The real sticker id is recovered client-side via usePathname() in ScanClient.
//
// In development, output: 'export' is disabled (see next.config.mjs) so Next.js
// runs as a normal server and dynamicParams must be true so real UUIDs resolve.
export const dynamicParams = process.env.NODE_ENV !== 'production';

export function generateStaticParams() {
  return [{ sticker_id: '_' }];
}

export default function ScanPage() {
  return <ScanClient />;
}
