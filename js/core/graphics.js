// Zadania z grafiki rastrowej i animacji (wykonywane przez zdającego np. w GIMP-ie).
import { q } from './util.js';

// Operacje i ich częstość w zadaniach graficznych z arkuszy 2018-2026 (kadrowanie 137, skalowanie 101,
// przezroczystość 57, obrót/odbicie 17, skala szarości 8).
const OPERATIONS = [
  [(f, rng) => {
    const [w, hgt] = rng.pick([[300, 200], [400, 300], [200, 200], [600, 150], [1000, 100]]);
    return { text: `grafikę ${f} należy skadrować tak, aby widoczny był jedynie główny motyw, a następnie przeskalować do wymiarów dokładnie ${w} px na ${hgt} px`, check: `Grafika ${f} jest skadrowana do głównego motywu i ma wymiary ${w} px na ${hgt} px` };
  }, 5],
  [(f, rng) => {
    const w = rng.pick([200, 250, 300, 400]);
    return { text: `grafikę ${f} należy przeskalować z zachowaniem proporcji do szerokości ${w} px`, check: `Grafika ${f} ma szerokość ${w} px, proporcje są zachowane` };
  }, 4],
  [(f, rng) => {
    const hgt = rng.pick([150, 200, 250]);
    return { text: `grafikę ${f} należy przeskalować z zachowaniem proporcji do wysokości ${hgt} px`, check: `Grafika ${f} ma wysokość ${hgt} px, proporcje są zachowane` };
  }, 3],
  [(f) => ({ text: `grafikę ${f} należy odbić w poziomie (lustrzane odbicie względem osi pionowej)`, check: `Grafika ${f} jest odbita w poziomie` }), 1],
  [(f) => ({ text: `grafikę ${f} należy obrócić o 90 stopni w prawo (zgodnie z ruchem wskazówek zegara)`, check: `Grafika ${f} jest obrócona o 90° w prawo` }), 1],
  [(f) => ({ text: `grafikę ${f} należy przekształcić do odcieni szarości`, check: `Grafika ${f} jest w odcieniach szarości` }), 1],
];

export function buildGraphics(theme, rng, site) {
  const tasks = [];
  const logo = theme.images.logo;
  tasks.push({
    text: `dla grafiki ${logo} należy nadać tło przezroczyste (usunąć jednolite tło wokół motywu) i zapisać pod tą samą nazwą w formacie PNG`,
    check: `Grafika ${logo} ma przezroczyste tło (motyw bez jednolitego tła), zapisana w formacie PNG`,
  });
  const candidates = [theme.images.main, ...site.files.filter((f) => /\.jpe?g$/.test(f))].filter((f, i, a) => a.indexOf(f) === i);
  const target = rng.pick(candidates.slice(0, 2));
  const first = rng.weighted(OPERATIONS);
  tasks.push(first(target, rng));
  if (rng.chance(0.3)) {
    // drugie przekształcenie tylko z grupy niezmieniającej wymiarów
    tasks.push(rng.weighted(OPERATIONS.slice(3))(target, rng));
  }
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
