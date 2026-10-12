// Składanie paczki do pobrania: arkusz, klucz, materiały dla zdającego i rozwiązanie wzorcowe.
// Obrazy są przekazywane przez funkcję renderImage (w przeglądarce: SVG -> canvas -> PNG/JPEG).
import { renderSheet } from './sheet.js';
import { renderKey } from './key.js';
import { placeholderSvg, framesStripSvg } from './placeholders.js';

export function examFolderName(exam) {
  return `${exam.code}_${exam.seed}`;
}

export function imageSourcesFor(exam) {
  const list = [];
  const add = (file, svg) => { if (!list.some((x) => x.file === file)) list.push({ file, svg }); };
  for (const f of exam.imageFiles) {
    add(f, f === exam.theme.images.logo ? placeholderSvg(f, { width: 300, height: 300, transparentBg: true }) : placeholderSvg(f, { width: 640, height: 440 }));
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
  const images = await Promise.all(imageSourcesFor(exam).map(async (img) => ({ ...img, bytes: await renderImage(img.svg, img.file) })));
  for (const img of images) entries.push({ name: `${archive}${img.file}`, data: img.bytes });
  const sol = `${root}rozwiazanie/`;
  for (const [name, code] of Object.entries(exam.solution)) entries.push({ name: `${sol}${name}`, data: code });
  for (const img of images) if (img.file !== 'klatki.png') entries.push({ name: `${sol}${img.file}`, data: img.bytes });
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
    'Obrazy są grafikami zastępczymi wygenerowanymi automatycznie.',
    'Arkusz nie jest oficjalnym materiałem CKE.',
  ].join('\r\n');
}
