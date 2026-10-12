// Deterministyczny generator liczb pseudolosowych (mulberry32) + pomocnicze funkcje losujące.
// Ten sam seed => ten sam arkusz, co pozwala odtworzyć zadanie na podstawie jego kodu.

export function hashSeed(text) {
  let h = 1779033703 ^ String(text).length;
  for (let i = 0; i < String(text).length; i++) {
    h = Math.imul(h ^ String(text).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export class Rng {
  constructor(seed) {
    this.seed = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
    this.state = this.seed || 0x9e3779b9;
  }
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  float(min, max, digits = 2) {
    return Number((min + this.next() * (max - min)).toFixed(digits));
  }
  chance(p) {
    return this.next() < p;
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  sample(arr, n) {
    return this.shuffle(arr).slice(0, Math.min(n, arr.length));
  }
  weighted(entries) {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [value, w] of entries) {
      if ((r -= w) < 0) return value;
    }
    return entries[entries.length - 1][0];
  }
  // Niezależny strumień dla podsystemu - zmiany w jednym module nie przesuwają losowań w innym.
  fork(label) {
    return new Rng(hashSeed(`${this.seed}:${label}`));
  }
}
