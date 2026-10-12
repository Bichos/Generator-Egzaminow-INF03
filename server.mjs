// Lokalny serwer aplikacji (bez zależności, Node.js >= 18).
//  - serwuje pliki statyczne generatora,
//  - pośredniczy w zapytaniach do Pixabay: /api/pixabay?... oraz /api/pixabay-image?url=...
// Dzięki pośrednikowi przeglądarka pobiera wyniki i zdjęcia z tej samej domeny, więc nie blokuje ich
// polityka CORS i zdjęcia można zapisać w paczce ZIP.
// Uruchomienie: node server.mjs [port]   (domyślnie 8080)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const PIXABAY_API = process.env.PIXABAY_API || 'https://pixabay.com/api/';
const IMAGE_HOSTS = (process.env.PIXABAY_IMAGE_HOSTS || 'cdn.pixabay.com,pixabay.com').split(',');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

async function proxyApi(url, res) {
  const params = new URLSearchParams(url.search);
  if (!params.get('key')) return send(res, 400, 'Brak klucza API');
  const upstream = await fetch(`${PIXABAY_API}?${params}`);
  const body = Buffer.from(await upstream.arrayBuffer());
  send(res, upstream.status, body, upstream.headers.get('content-type') || 'application/json');
}

async function proxyImage(url, res) {
  let target;
  try {
    target = new URL(url.searchParams.get('url'));
  } catch {
    return send(res, 400, 'Nieprawidłowy adres obrazu');
  }
  // tylko obrazy z Pixabay - serwer nie jest otwartym pośrednikiem
  if (!IMAGE_HOSTS.includes(target.host)) return send(res, 403, 'Dozwolone są tylko obrazy z Pixabay');
  const upstream = await fetch(target);
  if (!upstream.ok) return send(res, upstream.status, `Pixabay: ${upstream.status}`);
  const body = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(200, { 'Content-Type': upstream.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'max-age=86400' });
  res.end(body);
}

async function serveStatic(url, res) {
  const path = decodeURIComponent(url.pathname);
  const file = normalize(join(ROOT, path.endsWith('/') ? `${path}index.html` : path));
  if (!file.startsWith(ROOT) || file.split(sep).includes('.git') || file.split(sep).includes('node_modules')) return send(res, 403, 'Brak dostępu');
  try {
    if (!(await stat(file)).isFile()) return send(res, 404, 'Nie znaleziono');
    send(res, 200, await readFile(file), TYPES[extname(file).toLowerCase()] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Nie znaleziono');
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/api/health') return send(res, 200, JSON.stringify({ pixabayProxy: true }), 'application/json');
    if (url.pathname === '/api/pixabay') return await proxyApi(url, res);
    if (url.pathname === '/api/pixabay-image') return await proxyImage(url, res);
    return await serveStatic(url, res);
  } catch (err) {
    send(res, 502, `Błąd połączenia z Pixabay: ${err.message}`);
  }
}).listen(PORT, () => {
  console.log(`Generator arkuszy INF.03: http://localhost:${PORT}/`);
});
