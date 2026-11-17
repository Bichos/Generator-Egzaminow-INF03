// Wspólne elementy arkuszy przykładowych (przyklady/*/zbuduj.mjs): strona tytułowa, podgląd witryny
// w ramce, tabele pomocy, klucz z zasadami oceniania. Wygląd A4 jak w generatorze (js/core/sheet.js).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { wrapDocument, SHEET_CSS, renderLines } from '../js/core/sheet.js';
import { schemaSvg } from '../js/core/db.js';
import { escapeHtml as h } from '../js/core/util.js';

export { renderLines, schemaSvg, h };

export const MYSQLI = [
  ['mysqli_connect(serwer, użytkownik, hasło, nazwa_bazy)', 'id połączenia lub FALSE, gdy niepowodzenie'],
  ['mysqli_query(id_polaczenia, zapytanie)', 'Wynik zapytania'],
  ['mysqli_fetch_row(wynik_zapytania)', 'Tablica numeryczna odpowiadająca wierszowi zapytania'],
  ['mysqli_fetch_array(wynik_zapytania)', 'Tablica z kolejnym wierszem wyniku lub FALSE, gdy nie ma więcej wierszy'],
  ['mysqli_num_rows(wynik_zapytania)', 'Liczba wierszy w wyniku zapytania'],
  ['mysqli_close(id_polaczenia)', 'TRUE/FALSE w zależności od stanu operacji'],
];

export const KEY_NOTES = [
  'Uwaga: W przypadku oceny zrzutów należy uznać za prawidłowe, jeżeli widoczny jest cały obszar ekranu z widocznym paskiem zadań, a zapytanie ma charakter uniwersalny dla każdego zestawu danych.',
  'Uwaga: W napisach widocznych na stronie dopuszcza się drobne błędy literowe, błędy wielkości liter i znaków diakrytycznych.',
  'Uwaga: Jeśli witryna nie uruchamia się z powodu błędów PHP – sprawdzić według kryteriów w kodzie źródłowym strony.',
  'Uwaga: Kryteria muszą działać na stronie (sprawdzić w inspektorze). Kryteria dotyczące selektorów znaczników są spełnione jedynie dla stylu zdefiniowanego selektorem znacznika.',
  'Uwaga: Kryteria należy sprawdzić w kodzie źródłowym oraz na działającej stronie (XAMPP).',
];

export function project(dir) {
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const sol = (f) => read(`rozwiazanie/${f}`);
  const dataUri = (f, mime) => `data:${mime};base64,${readFileSync(join(dir, 'rozwiazanie', f)).toString('base64')}`;
  return { read, sol, dataUri, write: (p, s) => writeFileSync(join(dir, p), s) };
}

// Podgląd: wynik działania index.php (podglad.html) z wstawionym stylem, skryptem i obrazami.
export function previewDoc(sol, { extraCss = '', images = {}, file = 'podglad.html' } = {}) {
  let html = sol(file)
    .replace('<link rel="stylesheet" href="styl.css">', `<style>html{-webkit-print-color-adjust:exact;print-color-adjust:exact}\n${sol('styl.css')}\n${extraCss}</style>`)
    .replace('<script src="skrypt.js"></script>', `<script>${sol('skrypt.js')}</script>`);
  for (const [file, uri] of Object.entries(images)) html = html.split(`src="${file}"`).join(`src="${uri}"`);
  return html;
}

const srcdoc = (html) => html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// Ramka z podglądem strony w podanej szerokości okna, pomniejszona o scale. click: id elementu klikanego po załadowaniu.
export function frame(html, n, caption, width, scale, { click = null, cls = '' } = {}) {
  return `<figure class="preview ${cls}"${click ? ` data-click="${click}"` : ''}><div class="frame-wrap" style="width:${Math.round(width * scale)}px;max-width:100%;margin:0 auto" data-scale="${scale}"><iframe class="site" style="width:${width}px;transform:scale(${scale})" srcdoc="${srcdoc(html)}" title="Podgląd witryny"></iframe></div><figcaption>Ilustracja ${n}. ${h(caption)}</figcaption></figure>`;
}

export const table2 = (caption, head, rows) => `<table class="help"><caption>${h(caption)}</caption><tr>${head.map((x) => `<th>${h(x)}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
export const esc = (rows) => rows.map((r) => r.map(h));

export function layoutSvg(boxes, width = 340) {
  let y = 4;
  const parts = boxes.map(([label, hgt, dashed]) => {
    const out = `<rect x="4" y="${y}" width="${width - 8}" height="${hgt}" fill="#fff" stroke="#222" stroke-width="1.5"${dashed ? ' stroke-dasharray="5 3"' : ''}/><text x="${width / 2}" y="${y + hgt / 2 + 4}" font-size="12" text-anchor="middle">${h(label)}</text>`;
    y += hgt + 4;
    return out;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${y}" width="${width}" height="${y}" font-family="Arial, sans-serif">${parts.join('')}</svg>`;
}

// opcje: czas (np. '2 × 150 minut'), naglowek (np. arkusz projektowy) - domyślnie jak arkusz ćwiczeniowy.
export function titlePage(kod, zadanie, { czas = '150 minut', naglowek = 'EGZAMIN ZAWODOWY – ARKUSZ ĆWICZENIOWY', podtytul = 'CZĘŚĆ PRAKTYCZNA · PODSTAWA PROGRAMOWA 2019' } = {}) {
  return `<section class="page title-page">
  <div class="notice">Arkusz ćwiczeniowy przygotowany na zajęcia.<br>Nie jest oficjalnym arkuszem CKE.</div>
  <p class="meta">Nazwa kwalifikacji: <b>Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych</b><br>
  Symbol kwalifikacji: <b>INF.03</b><br>Zadanie: <b>${h(zadanie)}</b><br>Wersja arkusza: <b>SG</b></p>
  <div class="fill"><div class="fill-title">Wypełnia zdający</div>
    <div class="pesel"><span>Imię i nazwisko</span><span class="line"></span></div>
    <div class="pesel"><span>Numer z dziennika</span><span class="boxes"><i></i><i></i></span></div>
  </div>
  <div class="row-between"><span>Czas trwania egzaminu: <b>${h(czas)}</b></span><span class="code">${h(kod)}</span></div>
  <div class="big">${h(naglowek)}<br><small>${h(podtytul)}</small></div>
  <h3>Instrukcja dla zdającego</h3>
  <ol class="instr">
    <li>Na pierwszej stronie arkusza wpisz w oznaczonym miejscu swoje imię i nazwisko oraz numer z dziennika.</li>
    <li>Sprawdź, czy arkusz egzaminacyjny zawiera wszystkie strony i nie zawiera błędów. Ewentualny brak stron lub inne usterki zgłoś przez podniesienie ręki nauczycielowi.</li>
    <li>Zapoznaj się z treścią zadania oraz stanowiskiem egzaminacyjnym. Masz na to 10 minut. Czas ten nie jest wliczany do czasu trwania egzaminu.</li>
    <li>Wykonaj samodzielnie zadanie egzaminacyjne. Przestrzegaj zasad bezpieczeństwa i organizacji pracy.</li>
    <li>Po zakończeniu wykonania zadania pozostaw arkusz egzaminacyjny z rezultatami wykonania zadania na swoim stanowisku.</li>
  </ol>
  <p class="right"><b>Powodzenia!</b></p>
</section>`;
}

const EXTRA_CSS = `
.logo-demo { display: inline-block; padding: 14px 18px; background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 16px 16px; border: 1px solid #999; }
.logo-demo img { display: block; height: 40px; }
.swatch { display: inline-block; width: 90px; height: 22px; border-radius: 3px; vertical-align: middle; }
`;

const AUTOSIZE = `
function dopasuj() {
  document.querySelectorAll('figure.preview').forEach(function (fig) {
    var f = fig.querySelector('iframe.site');
    var wrap = fig.querySelector('.frame-wrap');
    var scale = Number(wrap.dataset.scale);
    try {
      var d = f.contentDocument;
      if (!d || !d.body) return;
      var hgt = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
      f.style.height = hgt + 'px';
      wrap.style.height = Math.ceil(hgt * scale) + 'px';
    } catch (e) {}
  });
}
document.querySelectorAll('figure.preview').forEach(function (fig) {
  var f = fig.querySelector('iframe.site');
  f.addEventListener('load', function () {
    var id = fig.dataset.click;
    if (id) { try { f.contentDocument.getElementById(id).click(); } catch (e) {} }
    dopasuj();
  });
});
window.addEventListener('load', dopasuj);
window.addEventListener('beforeprint', dopasuj);
`;

// extraJs: kod wykonywany w dokumencie arkusza (np. efekty :hover na ilustracjach) - po AUTOSIZE.
export function sheetDocument(title, body, extraCss = '', extraJs = '') {
  return wrapDocument(title, body, SHEET_CSS + EXTRA_CSS + extraCss, AUTOSIZE + extraJs);
}

const KEY_CSS = `
* { box-sizing: border-box; }
html { background: #eef0f3; }
body { margin: 0; padding: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; line-height: 1.4; }
.page { background: #fff; max-width: 210mm; margin: 0 auto; padding: 16mm; box-shadow: 0 1px 6px rgba(0,0,0,.15); }
h1 { font-size: 16pt; margin: 0 0 6px; } h2 { font-size: 13pt; border-bottom: 2px solid #333; padding-bottom: 3px; margin-top: 22px; }
pre { background: #f5f5f7; border: 1px solid #ddd; padding: 8px; white-space: pre-wrap; word-break: break-word; font-size: 9pt; }
table.zo { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
table.zo th, table.zo td { border: 1px solid #999; padding: 4px 6px; vertical-align: top; text-align: left; }
table.zo td:first-child, table.zo td:last-child { white-space: nowrap; text-align: center; }
table.zo tr.res-head td { background: #eef2f7; } table.zo tr.sum td { font-weight: bold; }
table.zo .note { font-size: 8.5pt; color: #444; margin: 3px 0 0; } table.zo tr { break-inside: avoid; }
.small { font-size: 9pt; color: #444; }
@media print { html, body { background: #fff; padding: 0; } .page { box-shadow: none; padding: 0; } }
@page { size: A4; margin: 14mm; }
`;

// R: [[tytuł rezultatu, [kryteria...]], ...] - pięć rezultatów, każde kryterium za 1 pkt.
export function keyDocument({ title, heading, meta, R, notes = KEY_NOTES, files }) {
  const total = R.reduce((n, [, items]) => n + items.length, 0);
  const zo = `<table class="zo"><tr><th>Lp.</th><th>Elementy podlegające ocenie / kryteria oceny</th><th>Pkt</th></tr>${R.map(([t, items], i) => `<tr class="res-head"><td>R.${i + 1}</td><td><b>Rezultat ${i + 1}: ${h(t)}</b><p class="note">${h(notes[i])}</p></td><td>${items.length}</td></tr>${items.map((x, j) => `<tr><td>R.${i + 1}.${j + 1}</td><td><label><input type="checkbox"> ${h(x)}</label></td><td>1</td></tr>`).join('')}`).join('')}<tr class="sum"><td></td><td>Razem</td><td>${total}</td></tr></table>`;
  const code = files.map(([name, text]) => `<h4>${h(name)}</h4><pre>${h(text)}</pre>`).join('');
  return {
    total,
    html: wrapDocument(title, `<section class="page">
  <h1>${h(heading)}</h1>
  <p class="small">${meta} Każde kryterium oceniane jest zero-jedynkowo (spełnione – 1 pkt).</p>
  <h2>Zasady oceniania</h2>${zo}
  <h2>Rozwiązanie wzorcowe</h2>${code}
</section>`, KEY_CSS),
  };
}
