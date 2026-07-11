// Local preview server for the `out/` static export. Mimics the hosting-level rewrite in
// vercel.json (/scan/:id -> /scan/_/index.html), which `next dev` does not apply — dev mode
// only serves the exact generateStaticParams() entries, so this is the only way to preview the
// real dynamic /scan/<sticker_id> behavior without deploying.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'out');
const PORT = 3000;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith('/scan/')) {
    pathname = '/scan/_/index.html';
  } else if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  } else if (!extname(pathname)) {
    pathname = `${pathname.replace(/\/$/, '')}/index.html`;
  }

  try {
    const filePath = join(ROOT, pathname);
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    try {
      const notFound = await readFile(join(ROOT, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(notFound);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
}).listen(PORT, () => {
  console.log(`Serving out/ at http://localhost:${PORT} (with /scan/* rewrite)`);
});
