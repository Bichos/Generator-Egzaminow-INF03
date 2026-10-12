// Test integracji z Pixabay w przeglądarce, na zasymulowanym API (bez prawdziwego klucza i sieci).
// Podstawia odpowiedzi https://pixabay.com/api/ oraz obrazy z cdn.pixabay.com i sprawdza, że:
//  - aplikacja wysyła zapytania z kluczem i lang=pl,
//  - zdjęcia trafiają do arkusza i podglądu (data:image/...),
//  - paczka ZIP zawiera zdjęcia (zamiast grafik zastępczych) i plik zrodla_zdjec.txt,
//  - błędny klucz daje czytelny komunikat i grafiki zastępcze.
// Uruchomienie: NODE_PATH=$(npm root -g) node tests/pixabay.mjs  (wymaga serwera: npm start na porcie 8080
// albo zmiennej APP_URL)
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const APP = process.env.APP_URL || 'http://localhost:8080/';

const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
const problems = [];

// przykładowy JPEG wygenerowany w przeglądarce
const jpeg = Buffer.from((await page.evaluate(() => {
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

const requests = [];
let badKey = false;
await context.route('https://pixabay.com/api/**', (route) => {
  const url = new URL(route.request().url());
  requests.push(url.searchParams);
  if (badKey) return route.fulfill({ status: 400, body: '[ERROR 400] "key" is invalid', headers: { 'Access-Control-Allow-Origin': '*' } });
  const q = url.searchParams.get('q');
  const hits = Array.from({ length: 5 }, (_, i) => ({ id: i, webformatURL: `https://cdn.pixabay.com/photo/test/${encodeURIComponent(q)}-${i}_640.jpg`, user: `autor${i}`, pageURL: `https://pixabay.com/photos/test-${i}/`, tags: q }));
  return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ total: 5, totalHits: 5, hits }) });
});
await context.route('https://cdn.pixabay.com/**', (route) => route.fulfill({ contentType: 'image/jpeg', headers: { 'Access-Control-Allow-Origin': '*' }, body: jpeg }));

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${APP}#s=FOTO1&t=kwiaciarnia&m=server&d=normal&q=auto&g=yes&mo=06&y=2026`);
await page.fill('#pixabayKey', 'TEST-KEY-123');
await page.dispatchEvent('#pixabayKey', 'change');
await page.check('#usePixabay');
await page.waitForFunction(() => /Zdjęcia z Pixabay: \d+ z \d+/.test(document.querySelector('#photoStatus').textContent), null, { timeout: 30000 });
const status = await page.textContent('#photoStatus');
const m = status.match(/Zdjęcia z Pixabay: (\d+) z (\d+)/);
if (!m || m[1] !== m[2]) problems.push(`nie wszystkie zdjęcia: ${status}`);
if (!requests.length || requests.some((p) => p.get('key') !== 'TEST-KEY-123' || p.get('lang') !== 'pl')) problems.push('zapytania bez klucza lub lang=pl');
console.log('zapytania:', requests.map((p) => `${p.get('q')} [${p.get('image_type')}]`).join(' | '));

// arkusz i podgląd zawierają zdjęcia
await page.waitForTimeout(500);
const sheetHasPhoto = await page.$eval('#sheetFrame', (f) => f.contentDocument.documentElement.innerHTML.includes('data:image/jpeg'));
if (!sheetHasPhoto) problems.push('arkusz nie zawiera zdjęć');
await page.click('[data-tab="site"]');
await page.waitForTimeout(300);
const previewPhotos = await page.$eval('#siteFrame', (f) => [...f.contentDocument.images].filter((i) => i.src.startsWith('data:image/jpeg') || i.src.startsWith('data:image/png')).length);
if (!previewPhotos) problems.push('podgląd witryny bez zdjęć');
await page.screenshot({ path: join(tmpdir(), 'pixabay-preview.png') });

// paczka ZIP
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#downloadZip')]);
const dir = mkdtempSync(join(tmpdir(), 'pixabay-'));
const zipPath = join(dir, 'p.zip');
await dl.saveAs(zipPath);
execFileSync('unzip', ['-q', zipPath, '-d', dir]);
const list = execFileSync('find', [dir, '-type', 'f']).toString().trim().split('\n');
const credits = list.find((f) => f.endsWith('/zrodla_zdjec.txt'));
if (!credits) problems.push('brak zrodla_zdjec.txt w paczce');
else if (!readFileSync(credits, 'utf8').includes('autor')) problems.push('plik źródeł bez autorów');
const jpgs = list.filter((f) => /dla_zdajacego\/.*\.jpg$/.test(f));
const fileType = jpgs.length ? execFileSync('file', [jpgs[0]]).toString() : '';
if (!/JPEG image data.*640x440/.test(fileType)) problems.push(`zdjęcie w paczce nie ma 640x440 JPEG: ${fileType}`);
const png = list.find((f) => /dla_zdajacego\/.*\.png$/.test(f) && !f.endsWith('klatki.png'));
if (png && !/PNG image data, 300 x 300/.test(execFileSync('file', [png]).toString())) problems.push('logo nie jest PNG 300x300');

// błędny klucz
badKey = true;
await page.evaluate(() => { localStorage.clear(); });
await page.fill('#seed', 'FOTO2');
await page.selectOption('#theme', 'hotel'); // inne hasła - pamięć podręczna nie zadziała
await page.click('form button[type=submit]');
await page.waitForFunction(() => document.querySelector('#photoStatus').classList.contains('error'), null, { timeout: 15000 });
const errText = await page.textContent('#photoStatus');
if (!errText.includes('Nieprawidłowy klucz')) problems.push(`komunikat błędnego klucza: ${errText}`);

if (errors.length) problems.push(...errors);
await browser.close();
console.log(problems.length ? `✗ ${problems.join('\n✗ ')}` : '✓ integracja z Pixabay działa (zapytania, arkusz, podgląd, ZIP, błędny klucz)');
process.exit(problems.length ? 1 : 0);
