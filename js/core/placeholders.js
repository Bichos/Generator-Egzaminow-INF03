// Obrazy zastępcze (SVG) - używane w podglądzie witryny i jako materiały dla zdającego.
import { escapeXml } from './util.js';

function hue(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function placeholderSvg(name, { width = 240, height = 160, transparentBg = false } = {}) {
  const h = hue(name);
  const label = name.replace(/\.\w+$/, '');
  const bg = transparentBg ? `<rect width="100%" height="100%" fill="hsl(${h},20%,92%)"/>` : `<rect width="100%" height="100%" fill="hsl(${h},45%,78%)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bg}`
    + `<circle cx="${width * 0.28}" cy="${height * 0.38}" r="${Math.min(width, height) * 0.16}" fill="hsl(${(h + 40) % 360},60%,60%)"/>`
    + `<path d="M0 ${height} L${width * 0.35} ${height * 0.5} L${width * 0.6} ${height * 0.75} L${width * 0.8} ${height * 0.45} L${width} ${height} Z" fill="hsl(${h},40%,45%)"/>`
    + `<text x="50%" y="${height - 14}" font-family="Arial, sans-serif" font-size="${Math.max(12, Math.round(width / 16))}" text-anchor="middle" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="0.6">${escapeXml(label)}</text></svg>`;
}

export const svgDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// Pasek klatek animacji (klatki.png) - kolejne kwadraty z obracającym się elementem.
export function framesStripSvg(frames, size) {
  const parts = [];
  for (let i = 0; i < frames; i++) {
    const angle = (360 / frames) * i;
    const cx = i * size + size / 2;
    parts.push(`<rect x="${i * size}" y="0" width="${size}" height="${size}" fill="hsl(${(i * 50) % 360},70%,85%)" stroke="#333"/>`,
      `<g transform="rotate(${angle} ${cx} ${size / 2})"><circle cx="${cx}" cy="${size / 2}" r="${size * 0.32}" fill="none" stroke="#333" stroke-width="4"/>`
      + `<circle cx="${cx}" cy="${size * 0.18}" r="${size * 0.09}" fill="#c0392b"/></g>`,
      `<text x="${cx}" y="${size - 8}" font-size="${size / 9}" font-family="Arial" text-anchor="middle">${i + 1}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${frames * size}" height="${size}" viewBox="0 0 ${frames * size} ${size}">${parts.join('')}</svg>`;
}

// Animowany podgląd pliku GIF (SMIL) - tylko do ilustracji w arkuszu.
export function animatedPreviewSvg(frames, size, delay) {
  const dur = frames * delay;
  const groups = [];
  for (let i = 0; i < frames; i++) {
    const angle = (360 / frames) * i;
    const values = Array.from({ length: frames }, (_, k) => (k === i ? 'visible' : 'hidden')).join(';');
    groups.push(`<g visibility="${i === 0 ? 'visible' : 'hidden'}"><animate attributeName="visibility" values="${values}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>`
      + `<rect width="${size}" height="${size}" fill="hsl(${(i * 50) % 360},70%,85%)"/>`
      + `<g transform="rotate(${angle} ${size / 2} ${size / 2})"><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.32}" fill="none" stroke="#333" stroke-width="4"/><circle cx="${size / 2}" cy="${size * 0.18}" r="${size * 0.09}" fill="#c0392b"/></g></g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${groups.join('')}</svg>`;
}
