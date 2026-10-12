// Zadania z grafiki rastrowej i animacji (wykonywane przez zdającego np. w GIMP-ie).
import { q } from './util.js';

// Operacje i ich częstość w zadaniach graficznych z arkuszy 2018-2026 (kadrowanie 137, skalowanie 101,
// przezroczystość 57, obrót/odbicie 17, skala szarości 8).
const OPERATIONS = [
  [(f, rng, z) => ({
    text: `grafikę ${f} należy skadrować tak, aby widoczny był jedynie główny motyw, a następnie przeskalować do wymiarów dokładnie ${z.w} px na ${z.h} px${z.why}`,
    check: `Grafika ${f} jest skadrowana do głównego motywu i ma wymiary ${z.w} px na ${z.h} px`,
    source: { w: Math.round(z.w * 1.8), h: Math.round(z.w * 1.8 * 0.75) },
  }), 5],
  [(f, rng, z) => ({
    text: `grafikę ${f} należy przeskalować z zachowaniem proporcji do szerokości ${z.w} px${z.why}`,
    check: `Grafika ${f} ma szerokość ${z.w} px, proporcje są zachowane`,
    source: { w: z.w * 2, h: z.h * 2 },
  }), 4],
  [(f, rng, z) => ({
    text: `grafikę ${f} należy przeskalować z zachowaniem proporcji do wysokości ${z.h} px${z.why}`,
    check: `Grafika ${f} ma wysokość ${z.h} px, proporcje są zachowane`,
    source: { w: z.w * 2, h: z.h * 2 },
  }), 3],
  [(f) => ({ text: `grafikę ${f} należy odbić w poziomie (lustrzane odbicie względem osi pionowej)`, check: `Grafika ${f} jest odbita w poziomie` }), 1],
  [(f) => ({ text: `grafikę ${f} należy obrócić o 90 stopni w prawo (zgodnie z ruchem wskazówek zegara)`, check: `Grafika ${f} jest obrócona o 90° w prawo` }), 1],
  [(f) => ({ text: `grafikę ${f} należy przekształcić do odcieni szarości`, check: `Grafika ${f} jest w odcieniach szarości` }), 1],
];

// sizing: wynik computeImageSizes - wymiary docelowe wynikają z szerokości strony i bloku
export function buildGraphics(theme, rng, site, sizing) {
  const tasks = [];
  const sources = {};
  const logo = theme.images.logo;
  const logoSize = sizing?.sizes[logo];
  tasks.push({
    text: `dla grafiki ${logo} należy nadać tło przezroczyste (usunąć jednolite tło wokół motywu)${logoSize ? ` i przeskalować ją do wymiarów ${logoSize.w} px na ${logoSize.h} px (${logoSize.note || 'wymiary bloku'})` : ''}, a następnie zapisać pod tą samą nazwą w formacie PNG`,
    check: `Grafika ${logo} ma przezroczyste tło (motyw bez jednolitego tła)${logoSize ? `, wymiary ${logoSize.w}×${logoSize.h} px` : ''}, zapisana w formacie PNG`,
  });
  if (logoSize) sources[logo] = { w: logoSize.w * 2, h: logoSize.h * 2 };
  // zadanie dotyczy zdjęcia widocznego na stronie (ma wymiary wynikające z bloku), a gdy takiego brak - zdjęcia głównego
  const onPage = site.files.filter((f) => /\.jpe?g$/.test(f) && sizing?.sizes[f]);
  const target = onPage.length ? rng.pick(onPage.slice(0, 3)) : theme.images.main;
  const sz = sizing?.sizes[target] || { w: 300, h: 200 };
  const blockName = sz.block ? site.defs[sz.block]?.gen : null;
  let why = '';
  if (blockName && sz.from === 'css') why = ` (taką szerokość obrazy mają w witrynie według stylu CSS)`;
  else if (blockName && sizing?.fixed) why = ` (szerokość dopasowana do ${blockName}, który przy szerokości strony ${sizing.pagePx} px ma ${Math.round(sz.blockPx)} px)`;
  const z = { w: sz.w, h: sz.h, why };
  const firstOp = rng.weighted(OPERATIONS);
  const first = firstOp(target, rng, z);
  tasks.push(first);
  if (first.source) sources[target] = first.source;
  // drugie przekształcenie (bez zmiany wymiarów) - inne niż pierwsze
  const rest = OPERATIONS.slice(3).filter(([op]) => op !== firstOp);
  if (rng.chance(0.3)) tasks.push(rng.weighted(rest)(target, rng, z));
  return { files: [logo, target], tasks, sources };
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
