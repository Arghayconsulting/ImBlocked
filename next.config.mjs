/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only in production; dev server runs normally so dynamic
  // routes like /scan/[sticker_id] work without generateStaticParams limitations.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
