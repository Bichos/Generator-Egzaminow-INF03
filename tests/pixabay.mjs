// Test integracji z Pixabay na zasymulowanym API (bez prawdziwego klucza i sieci). Trzy scenariusze:
//  A. npm start (server.mjs z pośrednikiem) i przeglądarka odcięta od pixabay.com
//     -> zdjęcia przez pośrednika, trafiają do arkusza i ZIP;
//  B. zwykły serwer plików, Pixabay bez nagłówków CORS
//     -> wyszukiwanie przez JSONP, zdjęcia w podglądzie, czytelna informacja, że do ZIP potrzeba npm start;
//  C. zwykły serwer plików, Pixabay z CORS -> zdjęcia bezpośrednio, również w ZIP.
// Dodatkowo: błędny klucz daje komunikat. Uruchomienie: NODE_PATH=$(npm root -g) node tests/pixabay.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const problems = [];
const check = (cond, msg) => { if (!cond) problems.push(msg); };

// --- przykładowy JPEG ---
const browser = await chromium.launch();
const tmpPage = await browser.newPage();
const jpeg = Buffer.from((await tmpPage.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 800;
  c.height = 600;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, '#2a6f97');
  grad.addColorStop(1, '#f4a261');
  g.fillStyle = grad;
  g.fillRect(0, 0, 800, 600);
  return c.toDataURL('image/jpeg', 0.9);
})).split(',')[1], 'base64');
await tmpPage.close();

const listen = (server) => new Promise((r) => server.listen(0, () => r(server.address().port)));
const hitsFor = (q, imgBase) => ({ total: 5, totalHits: 5, hits: Array.from({ length: 5 }, (_, i) => ({ id: i, webformatURL: `${imgBase}/${encodeURIComponent(q)}-${i}_640.jpg`, user: `autor${i}`, pageURL: `https://pixabay.com/photos/test-${i}/`, tags: q })) });

// --- atrapa Pixabay (dla pośrednika w server.mjs) ---
const upstream = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/') {
    if (url.searchParams.get('key') !== 'TEST-KEY') { res.writeHead(400); return res.end('[ERROR 400] "key" is invalid'); }
    // brak nagłówków CORS - jak przy blokadzie w prawdziwej przeglądarce; JSONP przez parametr callback
    const body = JSON.stringify(hitsFor(url.searchParams.get('q'), `http://localhost:${upPort}/img`));
    const cb = url.searchParams.get('callback');
    res.writeHead(200, { 'Content-Type': cb ? 'application/javascript' : 'application/json' });
    return res.end(cb ? `${cb}(${body});` : body);
  }
  res.writeHead(200, { 'Content-Type': 'image/jpeg' });
  res.end(jpeg);
});
const upPort = await listen(upstream);

// --- zwykły serwer plików (bez pośrednika) ---
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
const plain = createServer((req, res) => {
  const p = join(ROOT, new URL(req.url, 'http://x').pathname.replace(/\/$/, '/index.html'));
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
const plainPort = await listen(plain);

// --- server.mjs z pośrednikiem wskazującym atrapę ---
const appPort = 18000 + Math.floor(Math.random() * 1000);
const app = spawn('node', [join(ROOT, 'server.mjs'), String(appPort)], {
  env: { ...process.env, PIXABAY_API: `http://localhost:${upPort}/api/`, PIXABAY_IMAGE_HOSTS: `localhost:${upPort}` }, stdio: 'ignore',
});
for (let i = 0; i < 50; i++) {
  try { await fetch(`http://localhost:${appPort}/api/health`); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
}

async function scenario(name, base, { key = 'TEST-KEY', cors, block = false, apiBase = null } = {}) {
  const context = await browser.newContext({ acceptDownloads: true });
  if (apiBase) await context.addInitScript((u) => { window.INF03_PIXABAY_API = u; }, apiBase);
  const apiCalls = [];
  await context.route('https://pixabay.com/api/**', (route) => {
    const url = new URL(route.request().url());
    apiCalls.push(url.searchParams);
    if (block) return route.abort('failed');
    const cb = url.searchParams.get('callback');
    const body = JSON.stringify(hitsFor(url.searchParams.get('q'), 'https://cdn.pixabay.com/photo/test'));
    if (cb) return route.fulfill({ contentType: 'application/javascript', body: `${cb}(${body});` });
    return route.fulfill({ contentType: 'application/json', headers: cors ? { 'Access-Control-Allow-Origin': '*' } : {}, body });
  });
  await context.route('https://cdn.pixabay.com/**', (route) => (block ? route.abort('failed')
    : route.fulfill({ contentType: 'image/jpeg', headers: cors ? { 'Access-Control-Allow-Origin': '*' } : {}, body: jpeg })));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${base}#s=FOTO1&t=kwiaciarnia&m=server&d=normal&q=auto&g=yes&mo=06&y=2026`);
  await page.fill('#pixabayKey', key);
  await page.dispatchEvent('#pixabayKey', 'change');
  await page.check('#usePixabay');
  await page.waitForFunction(() => {
    const t = document.querySelector('#photoStatus').textContent;
    return t && !t.startsWith('Pobieranie');
  }, null, { timeout: 30000 });
  const status = await page.textContent('#photoStatus');
  // pobranie paczki
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#downloadZip')]);
  const dir = mkdtempSync(join(tmpdir(), 'pixabay-'));
  await dl.saveAs(join(dir, 'p.zip'));
  execFileSync('unzip', ['-q', join(dir, 'p.zip'), '-d', dir]);
  const files = execFileSync('find', [dir, '-type', 'f']).toString().trim().split('\n');
  const jpg = files.find((f) => /dla_zdajacego\/.*\.jpg$/.test(f));
  const jpgInfo = jpg ? execFileSync('file', [jpg]).toString() : '';
  const previewSrcs = await page.$eval('#siteFrame', (f) => [...f.contentDocument.images].map((i) => i.src.slice(0, 40)));
  await context.close();
  console.log(`${name}: ${status}`);
  return { status, apiCalls, files, jpgInfo, previewSrcs, errors };
}

// A. pośrednik npm start, bezpośredni dostęp do Pixabay zablokowany
const a = await scenario('A (npm start)', `http://localhost:${appPort}/`, { block: true });
check(/Zdjęcia z Pixabay: (\d+) z \1\b/.test(a.status), `A: nie wszystkie zdjęcia: ${a.status}`);
check(a.apiCalls.length === 0, 'A: zapytania poszły bezpośrednio zamiast przez pośrednika');
check(/JPEG image data.*\d+x\d+/.test(a.jpgInfo), `A: w ZIP brak zdjęcia JPEG: ${a.jpgInfo}`);
check(a.files.some((f) => f.endsWith('zrodla_zdjec.txt')), 'A: brak zrodla_zdjec.txt');
check(a.previewSrcs.some((s) => s.startsWith('data:image/jpeg')), 'A: podgląd bez zdjęć');

// B. bez pośrednika, Pixabay bez CORS
// atrapa API na innym porcie = inny origin, bez nagłówków CORS -> przeglądarka naprawdę blokuje fetch
const b = await scenario('B (bez CORS)', `http://localhost:${plainPort}/`, { apiBase: `http://localhost:${upPort}/api/` });
check(/npm start/.test(b.status), `B: brak informacji o npm start: ${b.status}`);
check(b.previewSrcs.some((s) => s.startsWith(`http://localhost:${upPort}/img`)), `B: podgląd nie pokazuje zdjęć z Pixabay: ${b.previewSrcs}`);

// C. bez pośrednika, Pixabay z CORS
const c = await scenario('C (z CORS)', `http://localhost:${plainPort}/`, { cors: true });
check(/Zdjęcia z Pixabay: (\d+) z \1\b/.test(c.status), `C: ${c.status}`);
check(/JPEG image data.*\d+x\d+/.test(c.jpgInfo), `C: w ZIP brak zdjęcia: ${c.jpgInfo}`);

// D. błędny klucz (przez pośrednika)
const d = await scenario('D (zły klucz)', `http://localhost:${appPort}/`, { key: 'ZLY', block: true });
check(d.status.includes('Nieprawidłowy klucz'), `D: ${d.status}`);

for (const r of [a, b, c, d]) problems.push(...r.errors);
app.kill();
upstream.close();
plain.close();
await browser.close();
console.log(problems.length ? `✗ ${problems.join('\n✗ ')}` : '✓ Pixabay: pośrednik, JSONP/brak CORS, CORS i błędny klucz działają zgodnie z oczekiwaniami');
process.exit(problems.length ? 1 : 0);
