// Plan obrazów arkusza: dla każdego pliku graficznego (logo, zdjęcia witryny, zdjęcia z bazy)
// ustala wymiary, format i hasło wyszukiwania w serwisie Pixabay (po polsku, lang=pl).
import { hashSeed } from './rng.js';

// Hasło zapasowe dla tematu - używane, gdy wyszukiwanie po nazwie pliku/rekordu nic nie zwróci.
export const THEME_QUERY = {
  kwiaciarnia: 'kwiaty bukiet', biblioteka: 'książki biblioteka', schronisko: 'pies kot', hotel: 'hotel góry',
  pizzeria: 'pizza', silownia: 'siłownia fitness', koncerty: 'koncert scena', wypozyczalnia: 'samochód',
  szkolajazdy: 'samochód droga', sklepkomputerowy: 'komputer laptop', biuropodrozy: 'podróże plaża', weterynarz: 'zwierzęta weterynarz',
  wedkarstwo: 'wędkarstwo jezioro', pogoda: 'pogoda niebo chmury', fryzjer: 'fryzjer', piekarnia: 'pieczywo chleb',
  opony: 'opony samochód', szachy: 'szachy',
};

// Lepsze hasła dla obrazów z tematów (nazwy plików nie mają polskich znaków).
const FILE_QUERY = {
  roza: 'róża', bukiet: 'bukiet kwiatów', logo: 'książki', czytelnia: 'czytelnia biblioteka', ksiazka: 'książka okładka',
  lapa: 'łapa psa', szczeniak: 'szczeniak', kocieta: 'kocięta', hotel: 'hotel', widok: 'widok góry', pokoj: 'pokój hotelowy',
  pizza: 'pizza', piec: 'piec do pizzy', margherita: 'pizza margherita', capricciosa: 'pizza z szynką', diavola: 'pizza salami',
  hantle: 'hantle', sala: 'siłownia', joga: 'joga', crossfit: 'crossfit', spinning: 'rower stacjonarny',
  nuta: 'nuty muzyka', scena: 'scena koncert', gitara: 'gitara', perkusja: 'perkusja', mikrofon: 'mikrofon',
  auto: 'samochód', flota: 'parking samochody', kombi: 'samochód kombi', suv: 'samochód suv', van: 'furgonetka',
  kierownica: 'kierownica', plac: 'nauka jazdy samochód', 'kat a': 'motocykl', 'kat b': 'samochód osobowy', 'kat c': 'ciężarówka',
  chip: 'procesor', laptop: 'laptop', monitor: 'monitor komputera', klawiatura: 'klawiatura', mysz: 'mysz komputerowa',
  samolot: 'samolot', plaza: 'plaża', gory: 'góry', miasto: 'miasto zabytki', jezioro: 'jezioro',
  stetoskop: 'stetoskop', gabinet: 'weterynarz', pies: 'pies', kot: 'kot', chomik: 'chomik',
  ryba: 'ryba', szczupak: 'szczupak', karp: 'karp', okon: 'okoń ryba',
  slonce: 'słońce', chmury: 'chmury', deszcz: 'deszcz', snieg: 'śnieg', burza: 'burza błyskawica',
  nozyczki: 'nożyczki fryzjerskie', salon: 'salon fryzjerski', fryzura: 'fryzura',
  klos: 'kłos zboża', chleb: 'chleb', bulki: 'bułki', rogal: 'rogalik', sernik: 'sernik',
  opona: 'opona', warsztat: 'warsztat samochodowy', letnia: 'opona samochodowa', zimowa: 'opona zimowa', felga: 'felga',
  skoczek: 'skoczek szachy', szachownica: 'szachownica', krol: 'król szachy', hetman: 'hetman szachy', wieza: 'wieża szachy',
};

const baseName = (f) => f.replace(/\.\w+$/, '').replace(/[_-]+/g, ' ').replace(/\d+$/, '').trim();

// Nazwa rekordu, którego zdjęcie jest w pliku (np. kwiat3.jpg -> trzeci rekord tabeli kwiaty -> "Storczyk").
function recordNameFor(exam, file) {
  for (const t of exam.theme.tables) {
    const fileCol = t.columns.find((c) => c.role === 'file');
    if (!fileCol) continue;
    const row = exam.db.data[t.name].find((r) => r[fileCol.name] === file);
    if (!row) continue;
    const nameCol = t.columns.find((c) => c.role === 'name') || t.columns.find((c) => c.role === 'last');
    return nameCol ? String(row[nameCol.name]).replace(/\s\d+$/, '') : null;
  }
  return null;
}

export function imagePlan(exam) {
  const files = [...new Set([...exam.imageFiles])];
  const fallback = THEME_QUERY[exam.theme.id] || exam.theme.app;
  return files.map((file) => {
    const isLogo = file === exam.theme.images.logo;
    const record = recordNameFor(exam, file);
    const query = record ? `${record} ${fallback.split(' ')[0]}` : FILE_QUERY[baseName(file)] || baseName(file) || fallback;
    return {
      file,
      query,
      fallback,
      kind: isLogo ? 'illustration' : 'photo',
      // wymiary dopasowane do bloku strony (sizing.js); oryginał dla zdającego większy, gdy jest zadanie graficzne
      width: exam.sizing?.sizes[file]?.w || (isLogo ? 300 : 640),
      height: exam.sizing?.sizes[file]?.h || (isLogo ? 300 : 440),
      source: exam.graphics?.sources?.[file] || null,
      mime: /\.png$/i.test(file) ? 'image/png' : 'image/jpeg',
      // stały wybór spośród wyników, zależny od kodu arkusza - ten sam arkusz dostaje te same zdjęcia
      pick: hashSeed(`${exam.seed}:${file}`),
    };
  });
}

export function creditsText(exam) {
  const list = Object.entries(exam.photos || {}).filter(([, p]) => p.credit);
  if (!list.length) return '';
  return [
    'Źródła zdjęć (Pixabay, https://pixabay.com/)',
    'Zdjęcia udostępnione na licencji Pixabay Content License: https://pixabay.com/service/license-summary/',
    '',
    ...list.map(([file, p]) => `${file}: autor ${p.credit.user}, ${p.credit.pageURL}`),
  ].join('\r\n');
}
