// Renderowanie arkusza egzaminacyjnego do samodzielnego dokumentu HTML (A4, gotowy do druku / zapisu PDF).
import { escapeHtml as h, q } from './util.js';
import { pageHtml } from './site.js';
import { placeholderSvg, svgDataUri, framesStripSvg, animatedPreviewSvg } from './placeholders.js';

export function renderLines(lines) {
  if (!lines || !lines.length) return '';
  return `<ul class="dash">${lines.map((l) => (typeof l === 'string'
    ? `<li>${h(l)}</li>`
    : `<li>${h(l.text)}${renderLines(l.children)}</li>`)).join('')}</ul>`;
}

const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function imageResolverFor(exam) {
  const cache = new Map();
  return (file) => {
    if (exam.photos?.[file]) return exam.photos[file].src; // zdjęcie z Pixabay
    if (cache.has(file)) return cache.get(file);
    let svg;
    if (exam.animation && file === exam.animation.file) svg = animatedPreviewSvg(exam.animation.frames, exam.animation.size, exam.animation.delay);
    else {
      const z = exam.sizing?.sizes[file];
      const logo = file === exam.theme.images.logo;
      svg = placeholderSvg(file, { width: z ? z.w : logo ? 160 : 240, height: z ? z.h : logo ? 160 : 160, transparentBg: logo });
    }
    const uri = svgDataUri(svg);
    cache.set(file, uri);
    return uri;
  };
}

export function previewHtml(exam, page = 0) {
  const css = `html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n${exam.css.css}`;
  return pageHtml(exam.site, exam.theme, { page, preview: true, inlineCss: css, imageResolver: imageResolverFor(exam) });
}

const srcdoc = (html) => html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const MYSQLI_TABLE = [
  ['mysqli_connect(serwer, użytkownik, hasło, nazwa_bazy)', 'id połączenia lub FALSE, gdy niepowodzenie'],
  ['mysqli_select_db(id_polaczenia, nazwa_bazy)', 'TRUE/FALSE w zależności od stanu operacji'],
  ['mysqli_error(id_polaczenia)', 'Tekst komunikatu błędu'],
  ['mysqli_close(id_polaczenia)', 'TRUE/FALSE w zależności od stanu operacji'],
  ['mysqli_query(id_polaczenia, zapytanie)', 'Wynik zapytania'],
  ['mysqli_fetch_row(wynik_zapytania)', 'Tablica numeryczna odpowiadająca wierszowi zapytania'],
  ['mysqli_fetch_array(wynik_zapytania)', 'Tablica zawierająca kolejny wiersz z podanych w wyniku zapytania lub FALSE, jeżeli nie ma więcej wierszy'],
  ['mysqli_num_rows(wynik_zapytania)', 'Liczba wierszy w podanym zapytaniu'],
  ['mysqli_real_escape_string(id_polaczenia, napis)', 'Napis z zabezpieczonymi znakami specjalnymi'],
  ['isset($zmienna)', 'TRUE/FALSE w zależności od tego, czy $zmienna istnieje'],
  ['intval($zmienna)', 'Wartość całkowita zmiennej'],
];

const DOM_TABLE = [
  ['document.getElementById(id)', 'element.innerHTML = "wartość"'],
  ['document.getElementsByClassName(nazwa)', 'element.value (wartość pola formularza)'],
  ['document.querySelector(selektor CSS)', 'element.checked (stan pola wyboru / opcji)'],
  ['document.querySelectorAll(selektor CSS)', 'element.style.właściwość = "wartość"'],
  ['window.addEventListener("load", funkcja)', 'element.src, element.alt (atrybuty obrazu)'],
  ['Zdarzenia: onclick, oninput, onchange, onload', 'new Date(): getDate(), getMonth(), getFullYear()'],
  ['Number(tekst), parseInt(tekst), parseFloat(tekst)', 'liczba.toFixed(n), tekst.toLowerCase(), tekst.trim()'],
];

const SEMANTIC_TABLE = [
  ['<article>', 'Defines independent, self-contained content'],
  ['<aside>', 'Defines content aside from the page content'],
  ['<figure>', 'Specifies self-contained content, like illustrations, diagrams, photos'],
  ['<footer>', 'Defines a footer for a document or section'],
  ['<header>', 'Specifies a header for a document or section'],
  ['<main>', 'Specifies the main content of a document'],
  ['<mark>', 'Defines marked/highlighted text'],
  ['<nav>', 'Defines navigation links'],
  ['<section>', 'Defines a section in a document'],
  ['<time>', 'Defines a date/time'],
];

const table2 = (caption, head, rows) => `<table class="help"><caption>${h(caption)}</caption><tr>${head.map((x) => `<th>${h(x)}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</table>`;

export function renderSheet(exam, { embedPreview = true } = {}) {
  const { theme, site, mode } = exam;
  let ill = 0;
  const nextIll = () => ++ill;
  let tab = 0;
  const nextTab = () => ++tab;
  const june = exam.options.month === '06';
  const usesGraphicsEditor = Boolean(exam.graphics || exam.animation);
  const tools = june ? 'zainstalowane na komputerze aplikacje' : `${usesGraphicsEditor ? 'edytor grafiki rastrowej, ' : ''}pakiet XAMPP oraz edytor zaznaczający składnię`;
  const parts = [];

  // ---------- strona tytułowa ----------
  parts.push(`<section class="page title-page">
  <div class="notice">Arkusz ćwiczeniowy wygenerowany automatycznie.<br>Nie jest oficjalnym arkuszem CKE.</div>
  <p class="meta">Nazwa kwalifikacji: <b>Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych</b><br>
  Symbol kwalifikacji: <b>INF.03</b><br>Numer zadania: <b>${exam.taskNo}</b><br>Wersja arkusza: <b>SG</b></p>
  <div class="fill"><div class="fill-title">Wypełnia zdający</div>
    <div class="pesel"><span>Imię i nazwisko</span><span class="line"></span></div>
    <div class="pesel"><span>Numer z dziennika</span><span class="boxes">${'<i></i>'.repeat(2)}</span></div>
  </div>
  <div class="row-between"><span>Czas trwania egzaminu: <b>150 minut</b></span><span class="code">${h(exam.code)}</span></div>
  <div class="big">EGZAMIN ZAWODOWY – ARKUSZ ĆWICZENIOWY<br><small>Rok ${exam.options.year} · CZĘŚĆ PRAKTYCZNA · PODSTAWA PROGRAMOWA 2019</small></div>
  <h3>Instrukcja dla zdającego</h3>
  <ol class="instr">
    <li>Na pierwszej stronie arkusza wpisz w oznaczonym miejscu swoje imię i nazwisko oraz numer z dziennika.</li>
    <li>Sprawdź, czy arkusz egzaminacyjny zawiera wszystkie strony i nie zawiera błędów. Ewentualny brak stron lub inne usterki zgłoś przez podniesienie ręki przewodniczącemu zespołu nadzorującego.</li>
    <li>Zapoznaj się z treścią zadania oraz stanowiskiem egzaminacyjnym. Masz na to 10 minut. Czas ten nie jest wliczany do czasu trwania egzaminu.</li>
    <li>Czas rozpoczęcia i zakończenia pracy zapisze w widocznym miejscu przewodniczący zespołu nadzorującego.</li>
    <li>Wykonaj samodzielnie zadanie egzaminacyjne. Przestrzegaj zasad bezpieczeństwa i organizacji pracy.</li>
    <li>Po zakończeniu wykonania zadania pozostaw arkusz egzaminacyjny z rezultatami wykonania zadania na swoim stanowisku.</li>
  </ol>
  <p class="right"><b>Powodzenia!</b></p>
  <p class="small seed">Kod arkusza (seed): <b>${h(exam.seed)}</b> · temat: ${h(theme.id)} · wariant: ${h(mode)} · poziom: ${h(exam.difficulty)}</p>
</section>`);

  // ---------- zadanie ----------
  const task = [];
  task.push(`<h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową ${h(theme.app)}, wykorzystując ${tools}.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${h(exam.archive.name)}</b> zabezpieczone hasłem: <b class="mono">${h(exam.archive.password)}</b>. Archiwum należy rozpakować.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>`);

  if (exam.hasDb) {
    const i1 = nextIll();
    const descs = theme.tables.map((t) => `Tabela ${t.name} opisuje ${t.desc}.`).join(' ');
    const cats = theme.tables.flatMap((t) => t.columns.filter((c) => c.role === 'cat' && c.values.length <= 5).map((c) => `W polu ${t.name}.${c.name} znajdują się wpisy: ${c.values.map((v) => `‘${v}’`).join(', ')}.`)).slice(0, 2).join(' ');
    const qlist = exam.queries.map((x) => `<li>Zapytanie ${x.number}: ${h(x.text)}</li>`).join('');
    task.push(`<h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera połączone relacją tabele przedstawione na ilustracji ${i1}. ${h(descs)} ${h(cats)}</p>
  <figure class="schema">${exam.schemaSvg}<figcaption>Ilustracja ${i1}. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>${h(theme.dbName)}</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku ${h(theme.sqlFile)} do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie ${exam.importFmt[0]} pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie ${h(theme.dbName)}. Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie ${exam.screenshotFmt[0]} i nadaj im nazwy ${exam.queries.map((x) => `kw${x.number}`).join(', ')}. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${qlist}</ul></li>
  </ul>`);
  }

  if (exam.animation) {
    const a = exam.animation;
    const i1 = nextIll();
    task.push(`<h3>Animacja</h3>
  <figure><img class="strip" src="${svgDataUri(framesStripSvg(a.frames, 80))}" alt="klatki animacji"><figcaption>Ilustracja ${i1}. Kolejne klatki animacji (plik klatki.png)</figcaption></figure>
  <p>Na podstawie wypakowanego obrazu klatki.png wykonaj animację według wytycznych:</p>${renderLines(a.lines.map(capFirst))}`);
  }

  if (exam.graphics) {
    task.push(`<h3>Grafika</h3><p>Pliki graficzne znajdują się w rozpakowanym archiwum. Cechy grafiki:</p>${renderLines(exam.graphics.tasks.map((t) => capFirst(t.text)))}`);
  }

  // Witryna
  const iPrev = nextIll();
  const iPrev2 = site.pages.length > 1 ? nextIll() : null;
  const iLayout = nextIll();
  const notes = site.rendered.map((r) => r.out.previewNote).filter(Boolean);
  const frame = (html, n, caption) => (embedPreview
    ? `<figure class="preview"><div class="frame-wrap"><iframe class="site" srcdoc="${srcdoc(html)}" title="Podgląd witryny" loading="lazy"></iframe></div><figcaption>Ilustracja ${n}. ${h(caption)}</figcaption></figure>`
    : `<figure class="preview"><div class="frame-wrap placeholder">[podgląd witryny – ilustracja ${n}]</div><figcaption>Ilustracja ${n}. ${h(caption)}</figcaption></figure>`);
  const common = [
    'Zapisana w języku HTML5',
    'Zadeklarowany polski język zawartości witryny',
    'Jawnie zastosowany właściwy standard kodowania polskich znaków',
    `Tytuł strony widoczny na karcie przeglądarki: ${q(theme.siteTitle)}`,
    'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony',
    `Podział strony na bloki zrealizowany za pomocą semantycznych znaczników bloków języka HTML5 tak, aby po uruchomieniu w przeglądarce układ bloków na stronie był zgodny z ilustracją ${iLayout}`,
  ];
  const blockLines = (b, page) => site.rendered.filter((r) => r.block === b).flatMap((r) => (page === 1 && r.out.page2 ? r.out.page2.lines : r.out.lines));
  const mainLine = `Zawartość bloku głównego: ${site.mainBlocks.map((b) => site.defs[b].label).join(', ').replace(/, ([^,]*)$/, ' i $1')}`;
  const differs = (b) => site.rendered.some((r) => r.block === b && r.out.page2);
  const contentItems = [];
  for (const row of site.rows) {
    if (row.main) contentItems.push(mainLine);
    for (const b of row.blocks) {
      if (site.pages.length > 1 && differs(b)) continue;
      const lines = blockLines(b, 0);
      if (lines.length) contentItems.push({ text: `Zawartość ${site.defs[b].gen}:`, children: lines.map((l) => (typeof l === 'string' ? capFirst(l) : { ...l, text: capFirst(l.text) })) });
    }
  }
  let pagesHtml = '';
  if (site.pages.length > 1) {
    const b = site.blocks.find(differs);
    pagesHtml = site.pages.map((p, i) => `<p>Zawartość ${h(site.defs[b].gen)} strony ${h(p.file)}:</p>${renderLines(blockLines(b, i).map((l) => (typeof l === 'string' ? capFirst(l) : { ...l, text: capFirst(l.text) })))}`).join('');
  }
  const cap1 = `Wygląd witryny internetowej${site.pages.length > 1 ? `, strona ${site.pages[0].file}` : ''}${notes.length && site.pages.length === 1 ? ` (${notes.join('; ')})` : ''}; dane mogą się różnić`;
  task.push(`<h3>Witryna internetowa</h3>
  ${frame(previewHtml(exam, 0), iPrev, cap1)}
  ${iPrev2 ? frame(previewHtml(exam, 1), iPrev2, `Wygląd strony ${site.pages[1].file} (${notes.join('; ') || 'po wybraniu odnośnika'})`) : ''}
  <div class="with-layout"><div>
  <p>Cechy witryny:</p>
  <ul class="dash"><li>Składa się ${site.pages.length > 1 ? `ze stron ${site.pages.map((p) => p.file).join(' i ')}` : `ze strony o nazwie ${site.pages[0].file}`}</li></ul>
  ${site.pages.length > 1 ? '<p>Cechy wspólne dla obu stron:</p>' : ''}
  ${renderLines([...common, ...contentItems])}
  </div><figure class="layout">${exam.layoutSvg}<figcaption>Ilustracja ${iLayout}. Układ bloków</figcaption></figure></div>
  ${pagesHtml}`);

  // CSS
  task.push(`<h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(exam.css.text)}
  ${exam.cssNote ? `<p class="note">${h(exam.cssNote)}</p>` : ''}`);

  // Skrypty
  const phpScripts = site.scripts.filter((x) => x.lang === 'php');
  const jsScripts = site.scripts.filter((x) => x.lang === 'js');
  const tMysqli = phpScripts.length ? nextTab() : null;
  const tDom = jsScripts.length ? nextTab() : null;
  const tSem = nextTab();
  const scriptBlocks = (list) => list.map((s) => `<p class="script-name">Skrypt ${s.number}${s.where ? ` (${h(s.where)})` : ''}:</p>${renderLines(s.lines.map((l) => (typeof l === 'string' ? capFirst(l) : { ...l, text: capFirst(l.text) })))}`).join('');
  const exampleLines = site.rendered.map((r) => r.out.example).filter(Boolean);
  const plural = (list) => (list.length > 1 ? 'y' : '');
  const acting = (list) => (list.length > 1 ? 'Skrypty działające' : 'Skrypt działający');
  if (phpScripts.length) {
    task.push(`<h3>${jsScripts.length ? `${acting(phpScripts)} po stronie serwera (PHP)` : `Skrypt${plural(phpScripts)} połączenia z bazą`}</h3>
  <p>W tabeli ${tMysqli} zamieszczono wybrane funkcje PHP do obsługi bazy danych. Wymagania dotyczące skryptów:</p>
  <ul class="dash"><li>Napisane w języku PHP</li><li>Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim</li>
  <li>Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie ${h(theme.dbName)}</li>
  <li>Na końcu zamykane jest połączenie z serwerem</li></ul>${scriptBlocks(phpScripts)}`);
  }
  if (jsScripts.length) {
    task.push(`<h3>${acting(jsScripts)} po stronie klienta${phpScripts.length ? ' (JavaScript)' : ''}</h3>
  <p>W tabeli ${tDom} zamieszczono wybrane pola i metody modelu DOM w języku JavaScript. Wymagania dotyczące skryptów:</p>
  <ul class="dash"><li>Napisane w języku JavaScript, wykonywane po stronie przeglądarki${phpScripts.length ? '; kod JavaScript może być zapisany w pliku skrypt.js lub w znaczniku script' : ''}</li><li>Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim</li></ul>
  ${scriptBlocks(jsScripts)}${exampleLines.length ? `<p class="small">Przykład: ${h(exampleLines.join('; '))}.</p>` : ''}`);
  }

  // Tabele pomocy
  task.push(`<div class="help-tables">
  ${tMysqli ? table2(`Tabela ${tMysqli}. Wybór funkcji języka PHP do obsługi bazy MySQL i MariaDB`, ['Funkcje biblioteki mysqli', 'Zwracana wartość'], MYSQLI_TABLE) : ''}
  ${tDom ? table2(`Tabela ${tDom}. Wybrane pola i metody modelu DOM języka JavaScript`, ['Wyszukiwanie elementów i zdarzenia', 'Zmiana elementów i pomocnicze'], DOM_TABLE) : ''}
  ${table2(`Tabela ${tSem}. Semantic Elements in HTML`, ['Tag', 'Description'], SEMANTIC_TABLE)}
  </div>`);

  // Zakończenie
  task.push(`<p class="note">UWAGA: po zakończeniu pracy utwórz plik tekstowy o nazwie przeglądarka.txt. Zapisz w nim nazwę przeglądarki internetowej, w której weryfikowana była poprawność działania witryny. Umieść go w folderze z numerem zdającego.</p>
  <p>Nagraj płytę z rezultatami pracy. W folderze z numerem zdającego powinny znajdować się pliki: ${h(exam.resultFiles.join(', '))}, ewentualnie inne przygotowane pliki. Po nagraniu płyty sprawdź poprawność jej odczytu. Opisz płytę numerem zdającego i pozostaw zapakowaną w pudełku na stanowisku wraz z arkuszem egzaminacyjnym.</p>
  <p><b>Czas przeznaczony na wykonanie zadania wynosi 150 minut.</b></p>
  ${Object.keys(exam.photos || {}).length ? '<p class="small">Zdjęcia w ilustracjach i w archiwum pochodzą z serwisu Pixabay (pixabay.com) i są udostępnione na licencji Pixabay Content License; autorzy wymienieni są w pliku zrodla_zdjec.txt.</p>' : ''}
  <p>Ocenie podlegać będzie 5 rezultatów:</p>${renderLines(exam.results.map((r, i) => `${r}${i < 4 ? ',' : '.'}`))}`);

  parts.push(`<section class="page task">${task.join('\n')}</section>`);
  return wrapDocument(`${exam.code} – arkusz ćwiczeniowy`, parts.join('\n'), SHEET_CSS, AUTOSIZE_SCRIPT);
}

export function wrapDocument(title, body, css, script = '') {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(title)}</title>
<style>${css}</style>
</head>
<body>
${body}
${script ? `<script>${script}</script>` : ''}
</body>
</html>`;
}

// Dopasowanie wysokości ramek z podglądem witryny do ich zawartości (skala 0.62).
const AUTOSIZE_SCRIPT = `
function dopasujRamki() {
  document.querySelectorAll('iframe.site').forEach(function (f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.body) return;
      var hgt = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
      f.style.height = hgt + 'px';
      f.parentElement.style.height = Math.ceil(hgt * 0.62) + 'px';
    } catch (e) {}
  });
}
document.querySelectorAll('iframe.site').forEach(function (f) { f.addEventListener('load', dopasujRamki); });
window.addEventListener('load', dopasujRamki);
window.addEventListener('beforeprint', dopasujRamki);
`;

export const SHEET_CSS = `
:root { --ink: #111; --line: #333; --paper: #fff; }
* { box-sizing: border-box; }
html { background: #e9e9ec; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; padding: 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.38; color: var(--ink); }
.page { background: var(--paper); width: 210mm; max-width: 100%; margin: 0 auto 16px; padding: 18mm 18mm 20mm; box-shadow: 0 1px 6px rgba(0,0,0,.18); }
.title-page { min-height: 297mm; }
h2.task-title { font-size: 13pt; margin: 0 0 8px; }
h3 { font-size: 11pt; margin: 16px 0 6px; break-after: avoid; }
p { margin: 5px 0; }
ul.dash { list-style: none; padding-left: 20px; margin: 4px 0; }
ul.dash > li { position: relative; margin: 2px 0; }
ul.dash > li::before { content: '−'; position: absolute; left: -15px; }
.notice { border: 2px solid #b00; color: #b00; padding: 6px 10px; text-align: center; font-weight: bold; margin-bottom: 14px; }
.meta { font-size: 10.5pt; }
.fill { border: 1px solid var(--line); padding: 10px; margin: 14px 0; }
.fill-title { text-align: center; font-weight: bold; margin-bottom: 8px; }
.pesel { display: flex; align-items: center; justify-content: space-between; margin: 6px 0; gap: 10px; flex-wrap: wrap; }
.pesel .line { flex: 1; min-width: 200px; max-width: 60%; border-bottom: 1px solid var(--line); height: 22px; }
.boxes { display: inline-flex; }
.boxes i { width: 22px; height: 26px; border: 1px solid var(--line); margin-left: -1px; display: inline-block; }
.row-between { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.code { font-weight: bold; border: 1px solid var(--line); padding: 2px 8px; }
.big { text-align: center; font-weight: bold; font-size: 15pt; margin: 18px 0; }
.big small { font-size: 10pt; font-weight: normal; }
.instr li { margin: 4px 0; }
.right { text-align: right; }
.small { font-size: 9pt; color: #333; }
.seed { margin-top: 30px; color: #555; }
.mono { font-family: 'Courier New', monospace; }
figure { margin: 10px 0; text-align: center; break-inside: avoid; }
figcaption { font-size: 9.5pt; margin-top: 4px; }
figure.schema svg { max-width: 100%; height: auto; }
img.strip { max-width: 100%; border: 1px solid #999; }
.frame-wrap { width: 100%; height: 420px; overflow: hidden; border: 1px solid #888; position: relative; background: #fff; }
.frame-wrap.placeholder { display: flex; align-items: center; justify-content: center; color: #777; height: 160px; }
iframe.site { border: 0; width: 161.3%; height: 680px; transform: scale(0.62); transform-origin: 0 0; position: absolute; left: 0; top: 0; }
.with-layout { display: flex; gap: 14px; align-items: flex-start; }
.with-layout > div { flex: 1; min-width: 0; }
figure.layout { flex: 0 0 230px; margin-top: 30px; }
figure.layout svg { width: 100%; height: auto; }
.note { margin: 8px 0; }
.script-name { font-weight: bold; margin-top: 8px; }
.help-tables { margin-top: 14px; }
table.help { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9pt; break-inside: avoid; }
table.help caption { text-align: left; font-weight: bold; margin-bottom: 3px; }
table.help th, table.help td { border: 1px solid var(--line); padding: 3px 6px; text-align: left; vertical-align: top; }
table.help th { background: #eee; }
@media (max-width: 700px) {
  .page { padding: 16px; }
  .with-layout { flex-direction: column; }
  figure.layout { flex: none; width: 100%; max-width: 300px; margin: 0 auto; }
}
@page { size: A4; margin: 14mm 14mm 16mm;
  @bottom-center { content: "Strona " counter(page) " z " counter(pages); font: 9pt Arial, sans-serif; } }
@media print {
  html, body { background: #fff; padding: 0; }
  .page { box-shadow: none; margin: 0; padding: 0; width: auto; min-height: 0; }
  .title-page { break-after: page; }
}
`;
