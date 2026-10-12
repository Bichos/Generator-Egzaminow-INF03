// Pobieranie zdjęć z Pixabay (https://pixabay.com/api/docs/) dla obrazów arkusza.
// Wymaga darmowego klucza API. Wyniki wyszukiwania są przechowywane w pamięci podręcznej przez 24 h,
// zgodnie z zasadami API. Pobrane zdjęcia są kadrowane do docelowych wymiarów i zapisywane
// w formacie wynikającym z nazwy pliku (JPEG/PNG), aby trafiły do paczki ZIP.
import { imagePlan } from '../core/images.js';

// adres API można podmienić (testy na atrapie serwisu)
const API = globalThis.INF03_PIXABAY_API || 'https://pixabay.com/api/';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const memory = new Map();

function cacheGet(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, hits } = JSON.parse(raw);
    if (Date.now() - t > CACHE_TTL) return null;
    memory.set(key, hits);
    return hits;
  } catch {
    return null;
  }
}

function cacheSet(key, hits) {
  memory.set(key, hits);
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), hits }));
  } catch {
    /* pełna lub zablokowana pamięć - wystarczy pamięć podręczna w RAM */
  }
}

export class PixabayError extends Error {}

// Lokalny pośrednik (server.mjs, uruchamiany przez npm start) omija ograniczenia CORS.
let proxyCheck = null;
export function hasProxy() {
  if (!proxyCheck) {
    proxyCheck = fetch('api/health', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => Boolean(j && j.pixabayProxy))
      .catch(() => false);
  }
  return proxyCheck;
}

function checkStatus(status) {
  if (status === 400 || status === 401) throw new PixabayError('Nieprawidłowy klucz API Pixabay');
  if (status === 429) throw new PixabayError('Przekroczono limit zapytań Pixabay (100 na minutę) – spróbuj za chwilę');
  if (status >= 300) throw new PixabayError(`Pixabay odpowiedział błędem ${status}`);
}

// Zapasowe pobranie wyników przez JSONP (gdy przeglądarka blokuje zwykłe zapytanie).
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const name = `pixabayCb${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement('script');
    const cleanup = () => { delete window[name]; script.remove(); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 15000);
    window[name] = (data) => { clearTimeout(timer); cleanup(); resolve(data); };
    script.onerror = () => { clearTimeout(timer); cleanup(); reject(new Error('jsonp')); };
    script.src = `${url}&callback=${name}`;
    document.head.appendChild(script);
  });
}

export async function search(apiKey, query, kind) {
  const q = query.slice(0, 100);
  const key = `pixabay:${kind}:${q}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const params = new URLSearchParams({ key: apiKey, q, lang: 'pl', image_type: kind, safesearch: 'true', per_page: '20', orientation: kind === 'photo' ? 'horizontal' : 'all' });
  let data;
  if (await hasProxy()) {
    const res = await fetch(`api/pixabay?${params}`);
    checkStatus(res.status);
    data = await res.json();
  } else {
    try {
      const res = await fetch(`${API}?${params}`);
      checkStatus(res.status);
      data = await res.json();
    } catch (err) {
      if (err instanceof PixabayError) throw err;
      try {
        data = await jsonp(`${API}?${params}`);
      } catch {
        throw new PixabayError('przeglądarka nie może połączyć się z API Pixabay (blokada CORS lub brak sieci). Uruchom generator poleceniem npm start – serwer pośredniczy w połączeniu z Pixabay');
      }
    }
  }
  const hits = (data.hits || []).map((x) => ({ id: x.id, url: x.webformatURL, user: x.user, pageURL: x.pageURL, tags: x.tags }));
  cacheSet(key, hits);
  return hits;
}

// Kadrowanie "cover" do zadanych wymiarów i zapis do JPEG/PNG.
async function toImage(blob, width, height, mime) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const w = bitmap.width * scale;
  const hgt = bitmap.height * scale;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, width, height);
  g.drawImage(bitmap, (width - w) / 2, (height - hgt) / 2, w, hgt);
  const out = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.85));
  return { bytes: new Uint8Array(await out.arrayBuffer()), src: canvas.toDataURL(mime, 0.85) };
}

async function downloadImage(url) {
  const res = await fetch((await hasProxy()) ? `api/pixabay-image?url=${encodeURIComponent(url)}` : url);
  if (!res.ok) throw new Error(`obraz ${res.status}`);
  return res.blob();
}

// Zwraca mapę plik -> { src, bytes, credit } (bytes = null, gdy zdjęcia nie da się zapisać do ZIP). Obrazy, których nie udało się pobrać, są pomijane
// (zostają grafiki zastępcze). onProgress(gotowe, wszystkie).
export async function fetchPhotos(exam, apiKey, { onProgress, concurrency = 3 } = {}) {
  const plan = imagePlan(exam);
  const photos = {};
  const errors = [];
  let done = 0;
  let fatal = null;
  const queue = plan.slice();
  const worker = async () => {
    while (queue.length && !fatal) {
      const item = queue.shift();
      try {
        let hits = await search(apiKey, item.query, item.kind);
        if (!hits.length) hits = await search(apiKey, item.fallback, item.kind);
        if (hits.length) {
          const hit = hits[item.pick % Math.min(hits.length, 10)];
          const credit = { user: hit.user, pageURL: hit.pageURL, query: item.query };
          try {
            photos[item.file] = { ...(await toImage(await downloadImage(hit.url), item.width, item.height, item.mime)), credit };
          } catch {
            // Przeglądarka nie pozwala odczytać obrazu (CORS): zdjęcie widać w podglądzie, ale nie trafi do ZIP.
            photos[item.file] = { src: hit.url, bytes: null, credit };
          }
        }
      } catch (err) {
        if (err instanceof PixabayError) fatal = err;
        else errors.push(`${item.file}: ${err.message}`);
      }
      done++;
      onProgress?.(done, plan.length);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (fatal) throw fatal;
  return { photos, errors, total: plan.length };
}
