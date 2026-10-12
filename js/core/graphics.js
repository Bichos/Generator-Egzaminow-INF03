// Zadania z grafiki rastrowej i animacji (wykonywane przez zdającego np. w GIMP-ie).
import { q } from './util.js';

const OPERATIONS = [
  (f, rng) => {
    const w = rng.pick([200, 250, 300, 400]);
    return { text: `grafikę ${f} należy przeskalować z zachowaniem proporcji do szerokości ${w} px`, check: `szerokość ${f} = ${w} px, proporcje zachowane` };
  },
  (f, rng) => {
    const hgt = rng.pick([150, 200, 250]);
    return { text: `grafikę ${f} należy przeskalować z zachowaniem proporcji do wysokości ${hgt} px`, check: `wysokość ${f} = ${hgt} px, proporcje zachowane` };
  },
  (f) => ({ text: `grafikę ${f} należy odbić w poziomie (lustrzane odbicie względem osi pionowej)`, check: `${f} odbita w poziomie` }),
  (f) => ({ text: `grafikę ${f} należy przekształcić do odcieni szarości (desaturacja)`, check: `${f} w odcieniach szarości` }),
  (f, rng) => {
    const s = rng.pick([200, 250, 300]);
    return { text: `grafikę ${f} należy skadrować do kwadratu (zachowując środek obrazu), a następnie przeskalować do wymiarów ${s} px na ${s} px`, check: `${f} ma wymiary ${s}×${s} px` };
  },
  (f) => ({ text: `grafikę ${f} należy obrócić o 90 stopni w prawo (zgodnie z ruchem wskazówek zegara)`, check: `${f} obrócona o 90° w prawo` }),
];

export function buildGraphics(theme, rng, site) {
  const tasks = [];
  const logo = theme.images.logo;
  tasks.push({
    text: `dla grafiki ${logo} należy nadać tło przezroczyste (usunąć jednolite tło wokół motywu) i zapisać pod tą samą nazwą w formacie PNG`,
    check: `${logo} ma przezroczyste tło`,
  });
  const candidates = [theme.images.main, ...site.files.filter((f) => /\.jpe?g$/.test(f))].filter((f, i, a) => a.indexOf(f) === i);
  const target = rng.pick(candidates.slice(0, 2));
  for (const op of rng.sample(OPERATIONS, 1)) tasks.push(op(target, rng));
  return { files: [logo, target], tasks };
}

export function buildAnimation(theme, rng) {
  const frames = rng.pick([4, 5, 6]);
  const size = rng.pick([150, 200]);
  const delay = rng.pick([0.5, 1, 1.5]);
  const loop = rng.chance(0.7);
  const file = `${theme.images.logo.replace(/\.\w+$/, '')}.gif`;
  return {
    file, alt: 'Animacja', frames, size, delay, loop, source: 'klatki.png',
    lines: [
      `każdą klatką animacji jest jeden z ${frames} kwadratów grafiki klatki.png (kolejno od lewej do prawej) – razem ${frames} klatek`,
      `wymiary każdej klatki: ${size} px na ${size} px`,
      `animacja jest powtarzana ${loop ? 'w nieskończoność' : 'jednokrotnie (bez zapętlenia)'}, opóźnienie między klatkami ${String(delay).replace('.', ',')} s`,
      `udokumentuj ustawienie parametrów animacji za pomocą zrzutu ekranu o nazwie parametry.jpg. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań`,
      `animację zapisz jako ${file}`,
    ],
    checks: [`${file}: ${frames} klatek ${size}×${size} px`, `opóźnienie ${delay} s, ${loop ? 'zapętlenie' : 'bez zapętlenia'}`, 'zrzut parametry.jpg'],
    caption: `${q(file)}`,
  };
}
