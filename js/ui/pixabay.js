// Pobieranie zdjęć z Pixabay (https://pixabay.com/api/docs/) dla obrazów arkusza.
// Wymaga darmowego klucza API. Wyniki wyszukiwania są przechowywane w pamięci podręcznej przez 24 h,
// zgodnie z zasadami API. Pobrane zdjęcia są kadrowane do docelowych wymiarów i zapisywane
// w formacie wynikającym z nazwy pliku (JPEG/PNG), aby trafiły do paczki ZIP.
import { imagePlan } from '../core/images.js';

const API = 'https://pixabay.com/api/';
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

export async function search(apiKey, query, kind) {
  const q = query.slice(0, 100);
  const key = `pixabay:${kind}:${q}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const params = new URLSearchParams({ key: apiKey, q, lang: 'pl', image_type: kind, safesearch: 'true', per_page: '20', orientation: kind === 'photo' ? 'horizontal' : 'all' });
  const res = await fetch(`${API}?${params}`);
  if (res.status === 400 || res.status === 401) throw new PixabayError('Nieprawidłowy klucz API Pixabay');
  if (res.status === 429) throw new PixabayError('Przekroczono limit zapytań Pixabay (100 na minutę) – spróbuj za chwilę');
  if (!res.ok) throw new PixabayError(`Pixabay odpowiedział błędem ${res.status}`);
  const data = await res.json();
  const hits = (data.hits || []).map((x) => ({ id: x.id, url: x.webformatURL, user: x.user, pageURL: x.pageURL, tags: x.tags }));
  cacheSet(key, hits);
  return hits;
}

// Kadrowanie "cover" do zadanych wymiarów i zapis do JPEG/PNG.
async function toImage(url, width, height, mime) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`obraz ${res.status}`);
  const bitmap = await createImageBitmap(await res.blob());
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
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.85));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const dataUrl = canvas.toDataURL(mime, 0.85);
  return { bytes, dataUrl };
}

// Zwraca mapę plik -> { dataUrl, bytes, credit }. Obrazy, których nie udało się pobrać, są pomijane
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
          const img = await toImage(hit.url, item.width, item.height, item.mime);
          photos[item.file] = { ...img, credit: { user: hit.user, pageURL: hit.pageURL, query: item.query } };
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
