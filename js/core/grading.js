// Zasady oceniania w formacie stosowanym w arkuszach INF.03: rezultaty R.1-R.5,
// kryteria R.x.y oceniane zero-jedynkowo (1 pkt), z uwagami dla egzaminatora.
// Liczebność kryteriów odpowiada średnim z 80 zasad oceniania INF.03 (R.1 ~6, R.2 ~9, R.3 ~5, R.4 ~10, R.5 ~8).
import { q, joinPl } from './util.js';

const flat = (lines) => lines.flatMap((l) => (typeof l === 'string' ? [l] : [`${l.text} ${(l.children || []).join('; ')}`]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const NOTES = {
  db: 'Uwaga: W przypadku oceny zrzutów należy uznać za prawidłowe, jeżeli widoczny jest cały obszar ekranu z widocznym paskiem zadań, a zapytanie ma charakter uniwersalny dla każdego zestawu danych. Nie należy oceniać wykadrowanych zrzutów ekranu. Jeżeli część rekordów nie jest widoczna, sprawdzić w phpMyAdmin.',
  content: 'Uwaga: W napisach widocznych na stronie dopuszcza się drobne błędy literowe (niezmieniające sensu tekstu), błędy wielkości liter i znaków diakrytycznych, tekst może być pisany w cudzysłowach lub bez.',
  action: 'Uwaga: Jeśli witryna nie uruchamia się z powodu błędów – sprawdzić według kryteriów w kodzie źródłowym strony.',
  css: 'Uwaga: Kryteria muszą działać na stronie (sprawdzić w inspektorze). Dopuszcza się sprawdzenie w kodzie CSS tylko wtedy, gdy formatowany element nie istnieje w HTML lub plik CSS nie został powiązany z witryną, a kod CSS jest zgodny ze składnią.',
  php: 'Uwaga: Kryteria należy sprawdzić w kodzie źródłowym oraz na działającej stronie (XAMPP). Instrukcje muszą być zgodne ze składnią oraz zawierać dane wynikające z zadania.',
  js: 'Uwaga: Kryteria należy sprawdzić w kodzie źródłowym oraz w przeglądarce. Instrukcje muszą być zgodne ze składnią oraz zawierać dane wynikające z zadania.',
};

const rowsWord = (n) => (n === 1 ? 'wiersz' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'wiersze' : 'wierszy');

function queryEvidence(x) {
  const k = x.spec.kind;
  if (k === 'select') {
    const n = x.result.rows.length;
    if (x.spec.random) return `widoczne są dokładnie ${n} ${rowsWord(n)} (rekordy losowe – mogą się różnić)`;
    if (x.spec.fields.every((f) => f.agg) && n === 1) {
      return `widoczny jest jeden wiersz z wartościami: ${x.result.columns.map((c, i) => `${c} = ${x.result.rows[0][i]}`).join(', ')}`;
    }
    const firsts = x.result.rows.map((r) => r[0]).filter((v) => v !== null);
    const sample = n <= 5 ? ` dla: ${firsts.join(', ')}` : '';
    return `widoczne są dokładnie ${n} ${rowsWord(n)}${sample}`;
  }
  if (k === 'insert') return 'widoczny jest komunikat o wstawieniu 1 rekordu';
  if (k === 'update') return `widoczny jest komunikat o zmianie ${x.result.affected} ${x.result.affected === 1 ? 'rekordu' : 'rekordów'}`;
  if (k === 'delete') return `widoczny jest komunikat o usunięciu ${x.result.affected} ${x.result.affected === 1 ? 'rekordu' : 'rekordów'}`;
  return 'widoczny jest komunikat o poprawnie wykonanym zapytaniu';
}

export function buildGrading(exam) {
  const { site, theme } = exam;
  const R = [];

  // R.1
  if (exam.hasDb) {
    R.push({
      title: 'Operacje na bazie danych',
      notes: [NOTES.db],
      items: [
        `Wykonany import tabel do bazy danych ${theme.dbName}, co jest udokumentowane w pliku import w formacie ${exam.importFmt[0]}`,
        'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
        ...exam.queries.map((x) => `Wykonane zapytanie ${x.number} ${x.text}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${x.sql.replace(/\n/g, ' ')} oraz wynik działania udokumentowany zrzutem kw${x.number}, na którym ${queryEvidence(x)}`),
      ],
    });
  } else {
    const a = exam.animation;
    R.push({
      title: 'Animacja',
      notes: ['Uwaga: Animację należy sprawdzić w przeglądarce oraz w programie graficznym.'],
      items: [
        `Plik ${a.file} zawiera animację złożoną z ${a.frames} klatek, kolejność klatek zgodna z plikiem klatki.png`,
        `Każda klatka ma wymiary ${a.size} px na ${a.size} px`,
        `Opóźnienie między klatkami wynosi ${String(a.delay).replace('.', ',')} s`,
        `Animacja jest ${a.loop ? 'zapętlona (powtarzana w nieskończoność)' : 'odtwarzana jednokrotnie'}`,
        'Zrzut ekranu parametry.jpg dokumentuje ustawienie parametrów animacji, obejmuje cały ekran z paskiem zadań',
      ],
    });
  }

  // R.2
  const content = [];
  if (exam.graphics) exam.graphics.tasks.forEach((t) => content.push(t.check));
  content.push(`Witryna internetowa zapisana w ${site.pages.length > 1 ? `plikach ${site.pages.map((p) => p.file).join(' i ')}` : `pliku ${site.pages[0].file}`} oraz zapisany jawnie standard kodowania polskich znaków, deklaracja HTML5 <!DOCTYPE html>, zadeklarowany język witryny polski np. <html lang="pl"> oraz nadany tytuł strony ${q(theme.siteTitle)}`);
  content.push(`Zdefiniowany układ strony dzielący ją na bloki: ${joinPl(site.blocks.map((b) => site.defs[b].nom))} przy pomocy semantycznych znaczników sekcji języka HTML5 zgodnie z ich znaczeniem, w tym do bloku nagłówkowego – header, do stopki – footer. Dopuszcza się dodatkowe użycie bloków div lub section`);
  for (const r of site.rendered) {
    const lines = flat(r.out.lines);
    if (!lines.length) continue;
    const where = r.block === 'footer' ? 'W stopce' : `W ${site.defs[r.block].gen.replace(/^bloku/, 'bloku')}`;
    content.push(`${where} umieszczone: ${lines.join('; ')}`);
    if (r.out.page2) content.push(`Na stronie ${site.pages[1].file} w ${site.defs[r.block].gen}: ${flat(r.out.page2.lines).join('; ')}`);
  }
  R.push({ title: 'Zawartość witryny internetowej', notes: [NOTES.content], items: content });

  // R.3
  const action = [
    `Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracją układu bloków w arkuszu egzaminacyjnym`,
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów o nazwie styl.css, formatowanie CSS pochodzi jedynie z tego arkusza. Kryterium nie jest spełnione, gdy zdający źle przypisał selektor do bloku (np. kropka zamiast #)',
  ];
  if (site.tags.has('form')) action.push('Formularz wysyła dane metodą wynikającą z treści zadania (POST lub GET), a kontrolki mają typy zgodne z treścią (np. number, radio, checkbox)');
  if (site.tags.has('a')) action.push('Odnośniki prowadzą do adresów wynikających z treści zadania');
  for (const s of site.scripts) action.push(`Po uruchomieniu strony widoczny jest efekt działania skryptu ${s.number}${s.where ? ` (${s.where})` : ''} zgodny z treścią zadania`);
  R.push({ title: 'Działanie witryny internetowej', notes: [NOTES.action], items: action });

  // R.4
  const css = exam.css.rules.map((r) => `Ustawione ${r.selector === '*' ? 'dla wszystkich selektorów (*)' : `dla ${r.selector}`}: ${exam.css.text[exam.css.rules.indexOf(r)].replace(/^[^:]*:\s*/, '')}`);
  R.push({
    title: 'Styl CSS witryny internetowej',
    notes: [NOTES.css, ...(exam.css.tagOnly.length ? [`Kryteria dotyczące selektorów ${exam.css.tagOnly.join(', ')} są spełnione jedynie wtedy, gdy styl jest zdefiniowany dla selektora znacznika; nie są spełnione, gdy zdefiniowano styl klasy lub identyfikatora.`] : [])],
    items: css,
  });

  // R.5
  const scriptItems = exam.mode === 'server'
    ? [`Skrypt jest napisany w języku PHP i łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza ${theme.dbName} (np. mysqli_connect)`]
    : ['Skrypt jest napisany w języku JavaScript i zawiera co najmniej jedną poprawną składniowo instrukcję wynikającą z treści zadania'];
  for (const s of site.scripts) {
    const lines = flat(s.lines);
    const head = lines.slice(0, 2);
    const rest = lines.slice(2);
    head.forEach((l) => scriptItems.push(`Skrypt ${s.number}: ${l}`));
    if (rest.length) scriptItems.push(`Skrypt ${s.number}: ${rest.join('; ')}`);
  }
  scriptItems.push(exam.mode === 'server' ? 'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)' : 'Zastosowano znaczące nazewnictwo zmiennych i funkcji');
  R.push({ title: exam.results[4].charAt(0).toUpperCase() + exam.results[4].slice(1), notes: [exam.mode === 'server' ? NOTES.php : NOTES.js], items: scriptItems });

  return R.map((r, i) => ({
    id: `R.${i + 1}`,
    result: r.title,
    notes: r.notes,
    items: r.items.map((text, j) => ({ id: `R.${i + 1}.${j + 1}`, text })),
  }));
}
