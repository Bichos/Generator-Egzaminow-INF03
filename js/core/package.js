// Składanie paczki do pobrania: arkusz, klucz, materiały dla zdającego i rozwiązanie wzorcowe.
// Obrazy są przekazywane przez funkcję renderImage (w przeglądarce: SVG -> canvas -> PNG/JPEG).
import { renderSheet } from './sheet.js';
import { renderKey } from './key.js';
import { placeholderSvg, framesStripSvg } from './placeholders.js';
import { creditsText } from './images.js';

export function examFolderName(exam) {
  return `${exam.code}_${exam.seed}`;
}

// Obrazy w dwóch wersjach: docelowej (rozwiązanie, podgląd) i oryginale dla zdającego - większym,
// gdy zadanie graficzne każe go przeskalować lub skadrować.
export function imageSourcesFor(exam) {
  const list = [];
  const add = (file, svg, sourceSvg) => { if (!list.some((x) => x.file === file)) list.push({ file, svg, sourceSvg: sourceSvg || svg }); };
  for (const f of exam.imageFiles) {
    const logo = f === exam.theme.images.logo;
    const z = exam.sizing?.sizes[f] || (logo ? { w: 300, h: 300 } : { w: 640, h: 440 });
    const src = exam.graphics?.sources?.[f];
    add(f, placeholderSvg(f, { width: z.w, height: z.h, transparentBg: logo }), src ? placeholderSvg(f, { width: src.w, height: src.h, transparentBg: logo }) : null);
  }
  if (exam.animation) add('klatki.png', framesStripSvg(exam.animation.frames, exam.animation.size));
  return list;
}

export async function buildPackageEntries(exam, renderImage, prefix = '') {
  const root = `${prefix}${examFolderName(exam)}/`;
  const entries = [
    { name: `${root}arkusz.html`, data: renderSheet(exam) },
    { name: `${root}klucz.html`, data: renderKey(exam) },
    { name: `${root}CZYTAJ_MNIE.txt`, data: readme(exam) },
  ];
  const archive = `${root}dla_zdajacego/${exam.archive.name}/`;
  if (exam.hasDb) entries.push({ name: `${archive}${exam.theme.sqlFile}`, data: exam.dump });
  // zdjęcia z Pixabay (jeśli pobrane), w pozostałych przypadkach grafiki zastępcze
  const images = await Promise.all(imageSourcesFor(exam).map(async (img) => {
    const photo = exam.photos?.[img.file];
    const bytes = photo?.bytes || await renderImage(img.svg, img.file);
    const sourceBytes = photo?.sourceBytes || photo?.bytes || (img.sourceSvg === img.svg ? bytes : await renderImage(img.sourceSvg, img.file));
    return { ...img, bytes, sourceBytes };
  }));
  for (const img of images) entries.push({ name: `${archive}${img.file}`, data: img.sourceBytes });
  const sol = `${root}rozwiazanie/`;
  for (const [name, code] of Object.entries(exam.solution)) entries.push({ name: `${sol}${name}`, data: code });
  for (const img of images) if (img.file !== 'klatki.png') entries.push({ name: `${sol}${img.file}`, data: img.bytes });
  const credits = creditsText(exam);
  if (credits) {
    entries.push({ name: `${root}zrodla_zdjec.txt`, data: credits });
    entries.push({ name: `${archive}zrodla_zdjec.txt`, data: credits });
  }
  return entries;
}

function readme(exam) {
  return [
    `Arkusz ćwiczeniowy ${exam.code} (seed: ${exam.seed})`,
    `Temat: ${exam.theme.app}; wariant: ${exam.mode}; poziom: ${exam.difficulty}`,
    '',
    'arkusz.html         - treść zadania dla zdającego (do druku: Ctrl+P -> Zapisz jako PDF)',
    'klucz.html          - zapytania z oczekiwanymi wynikami, kryteria oceniania, rozwiązanie wzorcowe',
    `dla_zdajacego/      - zawartość archiwum ${exam.archive.name}; spakuj ją programem 7-Zip z hasłem: ${exam.archive.password}`,
    'rozwiazanie/        - przykładowe rozwiązanie (uruchom w XAMPP: htdocs + import bazy)',
    '',
    Object.keys(exam.photos || {}).length
      ? 'Zdjęcia pochodzą z Pixabay (licencja Pixabay Content License), autorzy w pliku zrodla_zdjec.txt. Brakujące obrazy to grafiki zastępcze.'
      : 'Obrazy są grafikami zastępczymi wygenerowanymi automatycznie (zdjęcia z Pixabay wymagają klucza API w ustawieniach).',
    'Arkusz nie jest oficjalnym materiałem CKE.',
  ].join('\r\n');
}
