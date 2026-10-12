// Widżety treści witryny. Widżet to fragment zadania umieszczany w bloku strony: opisuje wymagania
// (tekst arkusza), generuje kod rozwiązania (HTML/PHP/JS) oraz podgląd (HTML z danymi testowymi).
//
// Cykl życia:
//   plan(ctx)            - rezerwuje zapytania w rejestrze i liczbę skryptów, zwraca stan widżetu
//   render(ctx, st, num) - po nadaniu numerów zapytań i skryptów tworzy opis, kod i podgląd
import { execute, toSqlInline, fieldHeader } from './sql.js';
import { runPattern, label as labelCol, sampleValue } from './queries.js';
import { escapeHtml as h, q, joinPl, formatPln } from './util.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const colDef = (theme, f) => theme.tables.find((t) => t.name === f.t)?.columns.find((c) => c.name === f.c);
const headerLabel = (theme, spec, f) => {
  if (f.agg || f.alias) return fieldHeader(spec, f);
  const c = colDef(theme, f);
  return c ? cap(c.label) : f.c;
};
const COLS_PL = { 1: 'jedną kolumną', 2: 'dwiema kolumnami', 3: 'trzema kolumnami', 4: 'czterema kolumnami', 5: 'pięcioma kolumnami', 6: 'sześcioma kolumnami' };
const columnsPl = (n) => COLS_PL[n] || `${n} kolumnami`;

// Nadaje zapytaniu rolę parametru: w PHP wstawiana jest zmienna, w podglądzie wartość przykładowa.
function withParam(spec, col, phpVar, sample, quoted) {
  return {
    ...spec,
    where: spec.where.map((w) => (w.c === col ? { ...w, v: { param: quoted ? `'${phpVar}'` : phpVar, sample } } : w)),
  };
}

// Zapytanie jako napis PHP w cudzysłowie (zmienne $x są interpolowane).
const phpSql = (spec) => `"${toSqlInline(spec).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function phpQueryLoop(spec, rowBody, { fetch = 'mysqli_fetch_row', indent = '' } = {}) {
  return [
    `${indent}$zapytanie = ${phpSql(spec)};`,
    `${indent}$wynik = mysqli_query($polaczenie, $zapytanie);`,
    `${indent}while ($wiersz = ${fetch}($wynik)) {`,
    ...rowBody.map((l) => `${indent}    ${l}`),
    `${indent}}`,
  ].join('\n');
}

const phpBlock = (code) => `<?php\n${code}\n?>`;
const cellsPhp = (n, offset = 0) => Array.from({ length: n }, (_, i) => `<td>$wiersz[${i + offset}]</td>`).join('');

function fmtCell(v) {
  return v === null || v === undefined ? '' : h(v);
}

// ---------------------------------------------------------------------------
// Widżety statyczne (wspólne dla wszystkich wariantów)
// ---------------------------------------------------------------------------

export const heading = {
  id: 'heading',
  plan: (ctx, opts) => ({ level: opts?.level || 1, text: opts?.text || ctx.theme.h1 }),
  render: (ctx, st) => ({
    lines: [`nagłówek ${['', 'pierwszego', 'drugiego', 'trzeciego', 'czwartego'][st.level]} stopnia o treści ${q(st.text)}`],
    html: `<h${st.level}>${h(st.text)}</h${st.level}>`,
    tags: [`h${st.level}`],
  }),
};

export const navLinks = {
  id: 'navLinks',
  plan: (ctx) => {
    const ordered = ctx.rng.chance(0.4);
    const items = ctx.theme.nav.slice(0, ctx.rng.pick([3, 4]));
    return { ordered, items, asHeadings: ctx.rng.chance(0.25), home: ctx.pages.length > 1 ? ctx.pages[0].file : null };
  },
  render: (ctx, st) => {
    const n = st.items.length === 3 ? 'trzema' : 'czterema';
    if (st.asHeadings) {
      return {
        lines: [`${st.items.length === 3 ? 'trzy' : 'cztery'} nagłówki trzeciego stopnia o treści: ${st.items.map(q).join(', ')}`],
        html: st.items.map((t) => `<h3>${h(t)}</h3>`).join('\n'),
        tags: ['h3'],
      };
    }
    const tag = st.ordered ? 'ol' : 'ul';
    const href = (i) => (st.home && i === 0 ? st.home : '#');
    const links = st.items.map((t, i) => `<li><a href="${href(i)}">${h(t)}</a></li>`).join('\n');
    return {
      lines: [`lista ${st.ordered ? 'numerowana (uporządkowana)' : 'punktowana (nieuporządkowana)'} z ${n} elementami będącymi odnośnikami o treściach: ${st.items.map(q).join(', ')}; ${st.home ? `pierwszy odnośnik prowadzi do strony ${st.home}, pozostałe do adresu #` : 'odnośniki prowadzą do adresu #'}`],
      html: `<${tag}>\n${links}\n</${tag}>`,
      tags: [tag, 'li', 'a'],
    };
  },
};

export const image = {
  id: 'image',
  plan: (ctx, opts) => {
    const file = opts?.file || ctx.theme.images.main;
    return { file, alt: opts?.alt || cap(file.replace(/\.\w+$/, '').replace(/_/g, ' ')), title: ctx.rng.chance(0.3) };
  },
  render: (ctx, st) => ({
    lines: [`obraz ${st.file} z tekstem alternatywnym ${q(st.alt)}${st.title ? ` oraz podpowiedzią (tytułem) ${q(st.alt)}, wyświetlaną po najechaniu kursorem` : ''}`],
    html: `<img src="${st.file}" alt="${h(st.alt)}"${st.title ? ` title="${h(st.alt)}"` : ''}>`,
    tags: ['img'],
    files: [st.file],
  }),
};

export const contact = {
  id: 'contact',
  plan: (ctx) => ({ level: ctx.rng.pick([2, 3]), mailFirst: ctx.rng.chance(0.5) }),
  render: (ctx, st) => {
    const { phone, email } = ctx.theme.contact;
    return {
      lines: [
        `nagłówek ${st.level === 2 ? 'drugiego' : 'trzeciego'} stopnia o treści ${q('Kontakt')}`,
        `paragraf o treści ${q(`tel.: ${phone}`)}`,
        `paragraf z odnośnikiem o treści ${q('Napisz do nas')}, który otwiera domyślny program pocztowy z adresem ${email}`,
      ],
      html: `<h${st.level}>Kontakt</h${st.level}>\n<p>tel.: ${h(phone)}</p>\n<p><a href="mailto:${email}">Napisz do nas</a></p>`,
      tags: [`h${st.level}`, 'p', 'a'],
    };
  },
};

export const paragraph = {
  id: 'paragraph',
  plan: (ctx) => {
    const words = ctx.theme.paragraph.split(' ');
    const markIdx = ctx.rng.int(0, Math.min(4, words.length - 1));
    return { title: ctx.rng.pick(['O nas', 'Witamy', 'Informacje', 'Zapraszamy']), mark: ctx.rng.pick(['strong', 'em', 'mark']), markIdx };
  },
  render: (ctx, st) => {
    const words = ctx.theme.paragraph.split(' ');
    const w = words[st.markIdx].replace(/[.,]$/, '');
    const markPl = { strong: 'znacznikiem oznaczającym tekst ważny (domyślnie pogrubiony)', em: 'znacznikiem emfazy (domyślnie kursywa)', mark: 'znacznikiem wyróżnienia (zaznaczenia)' }[st.mark];
    const html = ctx.theme.paragraph.replace(w, `<${st.mark}>${w}</${st.mark}>`);
    return {
      lines: [`nagłówek drugiego stopnia o treści ${q(st.title)}`, `paragraf o treści: ${q(ctx.theme.paragraph)}, słowo ${q(w)} jest zapisane ${markPl}`],
      html: `<h2>${h(st.title)}</h2>\n<p>${html}</p>`,
      tags: ['h2', 'p', st.mark],
    };
  },
};

export const staticTable = {
  id: 'staticTable',
  plan: (ctx) => {
    const t = ctx.S.main;
    const price = ctx.S.col(t, 'price') || ctx.S.col(t, 'num');
    const rows = ctx.rng.sample(ctx.db.data[t.name], 3).map((r) => [r[labelCol(t).name], price.type.startsWith('DECIMAL') ? formatPln(r[price.name]) : r[price.name]]);
    return { headers: [cap(labelCol(t).label), cap(price.label)], rows, caption: ctx.rng.chance(0.4) };
  },
  render: (ctx, st) => {
    const body = st.rows.map((r) => `<tr><td>${h(r[0])}</td><td>${h(r[1])}</td></tr>`).join('\n');
    return {
      lines: [{
        text: `tabela z dwiema kolumnami i czterema wierszami${st.caption ? `, z podpisem (tytułem tabeli) ${q('Cennik')}` : ''}:`,
        children: [`w pierwszym wierszu komórki nagłówkowe: ${st.headers.map(q).join(', ')}`,
          ...st.rows.map((r, i) => `w wierszu ${i + 2}: ${q(r[0])}, ${q(r[1])}`)],
      }],
      html: `<table>\n${st.caption ? '<caption>Cennik</caption>\n' : ''}<tr><th>${h(st.headers[0])}</th><th>${h(st.headers[1])}</th></tr>\n${body}\n</table>`,
      tags: ['table', 'tr', 'th', 'td'],
    };
  },
};

export const footerAuthor = {
  id: 'footerAuthor',
  plan: (ctx) => ({ text: ctx.rng.pick(['Stronę wykonał: ', 'Autor: ', 'Stronę opracował: ', 'Wykonał: ']), extraLink: ctx.rng.chance(0.3) }),
  render: (ctx, st) => ({
    lines: [`paragraf o treści ${q(st.text)}, dalej wstawiony numer zdającego`,
      ...(st.extraLink ? [`paragraf z odnośnikiem o treści ${q('Regulamin')}, prowadzącym do pliku regulamin.html i otwierającym się w nowej karcie przeglądarki`] : [])],
    html: `<p>${h(st.text)}00</p>${st.extraLink ? '\n<p><a href="regulamin.html" target="_blank">Regulamin</a></p>' : ''}`,
    tags: ['p', ...(st.extraLink ? ['a'] : [])],
  }),
};

export const footerLink = {
  id: 'footerLink',
  plan: (ctx) => ({ kind: ctx.rng.pick(['mail', 'top', 'copy']) }),
  render: (ctx, st) => {
    const { email } = ctx.theme.contact;
    if (st.kind === 'mail') {
      return { lines: [`paragraf z odnośnikiem o treści ${q('Napisz do nas')}, który otwiera domyślny program pocztowy z adresem ${email}`], html: `<p><a href="mailto:${email}">Napisz do nas</a></p>`, tags: ['p', 'a'] };
    }
    if (st.kind === 'top') {
      return { lines: [`paragraf z odnośnikiem o treści ${q('Do góry')}, prowadzącym do początku strony (kotwica #)`], html: '<p><a href="#">Do góry</a></p>', tags: ['p', 'a'] };
    }
    return { lines: [`paragraf o treści ${q(`© ${ctx.theme.siteTitle}`)}; znak praw autorskich zapisany za pomocą encji HTML`], html: `<p>&copy; ${h(ctx.theme.siteTitle)}</p>`, tags: ['p'] };
  },
};

// ---------------------------------------------------------------------------
// Widżety PHP (wariant: skrypty po stronie serwera, korzystające z bazy)
// ---------------------------------------------------------------------------

function computedColumn(ctx, spec) {
  const f = spec.fields.find((x) => !x.agg && colDef(ctx.theme, x)?.role === 'price');
  if (!f || !ctx.rng.chance(0.5)) return null;
  const idx = spec.fields.indexOf(f);
  const variant = ctx.rng.pick([
    { title: 'Cena brutto', factor: 1.23, desc: 'wartość pola %c powiększona o 23% podatku VAT' },
    { title: 'Po rabacie', factor: 0.9, desc: 'wartość pola %c pomniejszona o 10% rabatu' },
    { title: 'Za dwie sztuki', factor: 2, desc: 'podwojona wartość pola %c' },
  ]);
  return { idx, ...variant, desc: variant.desc.replace('%c', f.c) };
}

export const phpTable = {
  id: 'phpTable',
  server: true,
  plan: (ctx) => {
    const ref = ctx.registry.request(['filterCatSorted', 'joinParent', 'topN', 'numCompare', 'groupCount', 'groupAvg', 'joinGroupCount', 'like', 'leftJoin']);
    if (!ref) return null;
    return { ref, extra: computedColumn(ctx, ref.result.spec), title: ctx.rng.chance(0.6) ? ctx.rng.pick(['Oferta', 'Zestawienie', 'Lista', 'Nasze propozycje']) : null };
  },
  scripts: 1,
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const headers = spec.fields.map((f) => headerLabel(ctx.theme, spec, f));
    if (st.extra) headers.push(st.extra.title);
    const res = execute(spec, ctx.db, { rng: ctx.rng.fork('preview') });
    const n = spec.fields.length;
    const extraPhp = st.extra ? `<td>" . round($wiersz[${st.extra.idx}] * ${st.extra.factor}, 2) . "</td>` : '';
    const code = phpBlock(phpQueryLoop(spec, [`echo "<tr>${cellsPhp(n)}${extraPhp}</tr>";`]));
    const rowsHtml = res.rows.map((r) => `<tr>${r.map((v) => `<td>${fmtCell(v)}</td>`).join('')}${st.extra ? `<td>${(Number(r[st.extra.idx]) * st.extra.factor).toFixed(2).replace(/\.?0+$/, '')}</td>` : ''}</tr>`).join('\n');
    const head = `<tr>${headers.map((x) => `<th>${h(x)}</th>`).join('')}</tr>`;
    return {
      lines: [
        ...(st.title ? [`nagłówek drugiego stopnia o treści ${q(st.title)}`] : []),
        `tabela z ${columnsPl(headers.length)}; pierwszy wiersz zawiera komórki nagłówkowe o treści: ${headers.map(q).join(', ')}; kolejne wiersze są wypełniane przez skrypt ${num.s[0]}`,
      ],
      html: `${st.title ? `<h2>${h(st.title)}</h2>\n` : ''}<table>\n${head}\n${code}\n</table>`,
      preview: `${st.title ? `<h2>${h(st.title)}</h2>\n` : ''}<table>\n${head}\n${rowsHtml}\n</table>`,
      tags: ['table', 'tr', 'th', 'td', ...(st.title ? ['h2'] : [])],
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          `każdy zwrócony wiersz wyświetla jako kolejny wiersz tabeli, w kolejnych komórkach umieszczając pola zwrócone zapytaniem${st.extra ? `; w ostatniej kolumnie wyświetlana jest wartość wyliczona: ${st.extra.desc}, zaokrąglona do 2 miejsc po przecinku` : ''}`],
      }],
    };
  },
};

export const phpList = {
  id: 'phpList',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['topN', 'like', 'distinctCat', 'notIn', 'between']);
    return ref && { ref, ordered: ctx.rng.chance(0.5), sep: ctx.rng.pick([' – ', ': ', ', ']) };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const res = execute(spec, ctx.db);
    const n = spec.fields.length;
    const tag = st.ordered ? 'ol' : 'ul';
    const sepDesc = { ' – ': 'myślnikiem otoczonym spacjami', ': ': 'dwukropkiem i spacją', ', ': 'przecinkiem i spacją' }[st.sep];
    const join = (arr) => arr.join(st.sep);
    const code = phpBlock(phpQueryLoop(spec, [`echo "<li>${Array.from({ length: n }, (_, i) => `$wiersz[${i}]`).join(st.sep)}</li>";`]));
    return {
      lines: [`lista ${st.ordered ? 'numerowana (uporządkowana)' : 'punktowana (nieuporządkowana)'} wypełniona przez skrypt ${num.s[0]}`],
      html: `<${tag}>\n${code}\n</${tag}>`,
      preview: `<${tag}>\n${res.rows.map((r) => `<li>${h(join(r.map((v) => v ?? '')))}</li>`).join('\n')}\n</${tag}>`,
      tags: [tag, 'li'],
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          `każdy zwrócony wiersz wyświetla jako element listy${n > 1 ? `; zwrócone pola są oddzielone ${sepDesc}` : ''}`],
      }],
    };
  },
};

export const phpGallery = {
  id: 'phpGallery',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['gallery']);
    return ref && { ref, cls: ctx.rng.pick(['miniatura', 'galeria', 'zdjecie']) };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const res = execute(spec, ctx.db);
    const code = phpBlock(phpQueryLoop(spec, [`echo "<img src='$wiersz[0]' alt='$wiersz[1]' class='${st.cls}'>";`]));
    return {
      lines: [`efekt działania skryptu ${num.s[0]} – galeria obrazów`],
      html: code,
      preview: res.rows.map((r) => `<img src="${h(r[0])}" alt="${h(r[1])}" class="${st.cls}">`).join('\n'),
      tags: ['img'],
      classes: [{ name: st.cls, tag: 'img', descPl: 'obrazów generowanych przez skrypt' }],
      files: res.rows.map((r) => r[0]),
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          `dla każdego zwróconego wiersza wyświetla obraz, którego źródłem jest nazwa pliku zwrócona z bazy, a tekstem alternatywnym – pole ${spec.fields[1].c}`,
          `do każdego obrazu przypisana jest klasa ${q(st.cls)}`],
      }],
    };
  },
};

export const phpStats = {
  id: 'phpStats',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['countWhere', 'minMax', 'aggregateCat']);
    return ref && { ref, title: ctx.rng.pick(['Statystyki', 'Ciekawostki', 'W liczbach']) };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const res = execute(spec, ctx.db);
    const labels = spec.fields.map((f) => fieldHeader(spec, f));
    const code = phpBlock([
      `$zapytanie = ${phpSql(spec)};`,
      '$wynik = mysqli_query($polaczenie, $zapytanie);',
      '$wiersz = mysqli_fetch_row($wynik);',
      ...labels.map((l, i) => `echo "<p>${l}: $wiersz[${i}]</p>";`),
    ].join('\n'));
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q(st.title)}`, `efekt działania skryptu ${num.s[0]}`],
      html: `<h3>${h(st.title)}</h3>\n${code}`,
      preview: `<h3>${h(st.title)}</h3>\n${labels.map((l, i) => `<p>${h(l)}: ${fmtCell(res.rows[0]?.[i])}</p>`).join('\n')}`,
      tags: ['h3', 'p'],
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          `wartości zwrócone zapytaniem wypisuje w osobnych paragrafach w formacie: ${labels.map((l) => q(`${l}: <wartość>`)).join(', ')}`],
      }],
    };
  },
};

export const phpCards = {
  id: 'phpCards',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['random']);
    return ref && { ref, cls: ctx.rng.pick(['karta', 'polecane', 'kafelek']) };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const res = execute(spec, ctx.db, { rng: ctx.rng.fork('cards') });
    const fileIdx = spec.fields.findIndex((f) => colDef(ctx.theme, f)?.role === 'file');
    const priceIdx = spec.fields.findIndex((f) => ['price', 'num'].includes(colDef(ctx.theme, f)?.role));
    const unit = priceIdx >= 0 && colDef(ctx.theme, spec.fields[priceIdx]).role === 'price' ? ' zł' : '';
    const body = [
      `echo "<div class='${st.cls}'>";`,
      ...(fileIdx >= 0 ? [`echo "<img src='$wiersz[${fileIdx}]' alt='$wiersz[0]'>";`] : []),
      'echo "<h3>$wiersz[0]</h3>";',
      ...(priceIdx >= 0 ? [`echo "<p>$wiersz[${priceIdx}]${unit}</p>";`] : []),
      'echo "</div>";',
    ];
    const prev = res.rows.map((r) => `<div class="${st.cls}">${fileIdx >= 0 ? `<img src="${h(r[fileIdx])}" alt="${h(r[0])}">` : ''}<h3>${h(r[0])}</h3>${priceIdx >= 0 ? `<p>${h(r[priceIdx])}${unit}</p>` : ''}</div>`).join('\n');
    return {
      lines: [`nagłówek drugiego stopnia o treści ${q('Polecamy')}`, `efekt działania skryptu ${num.s[0]}`],
      html: `<h2>Polecamy</h2>\n${phpBlock(phpQueryLoop(spec, body))}`,
      preview: `<h2>Polecamy</h2>\n${prev}`,
      tags: ['h2', 'h3', 'div', ...(fileIdx >= 0 ? ['img'] : []), ...(priceIdx >= 0 ? ['p'] : [])],
      classes: [{ name: st.cls, tag: 'div', descPl: 'bloków generowanych przez skrypt' }],
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          {
            text: `dla każdego zwróconego wiersza tworzy blok (div) z przypisaną klasą ${q(st.cls)}, a w nim:`,
            children: [
              ...(fileIdx >= 0 ? [`obraz o nazwie pliku zwróconej z bazy i tekście alternatywnym równym polu ${spec.fields[0].c}`] : []),
              `nagłówek trzeciego stopnia z wartością pola ${spec.fields[0].c}`,
              ...(priceIdx >= 0 ? [`paragraf z wartością pola ${spec.fields[priceIdx].c}${unit ? ', za którą wstawiony jest napis „ zł”' : ''}`] : []),
            ],
          }],
      }],
    };
  },
};

export const phpRadioFilter = {
  id: 'phpRadioFilter',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['filterCatSorted']);
    if (!ref) return null;
    const values = ref.result.param.values.slice(0, 4);
    if (!values.includes(ref.result.param.value)) values[values.length - 1] = ref.result.param.value;
    return { ref, values, button: ctx.rng.pick(['Pokaż', 'Filtruj', 'Wyświetl']) };
  },
  render: (ctx, st, num) => {
    const { spec, param } = st.ref.result;
    const def = st.values[0];
    const php = '$' + param.col;
    const specParam = withParam(spec, param.col, php, def, true);
    const res = execute(specParam, ctx.db);
    const headers = spec.fields.map((f) => headerLabel(ctx.theme, spec, f));
    const radios = st.values.map((v, i) => `<label><input type="radio" name="${param.col}" value="${h(v)}"${i === 0 ? ' checked' : ''}> ${h(cap(v))}</label>`).join('\n');
    const form = `<form action="" method="post">\n${radios}\n<button type="submit">${st.button}</button>\n</form>`;
    const code = phpBlock([
      `$dozwolone = [${st.values.map((v) => `'${v}'`).join(', ')}];`,
      `${php} = '${def}';`,
      `if (isset($_POST['${param.col}']) && in_array($_POST['${param.col}'], $dozwolone)) {`,
      `    ${php} = $_POST['${param.col}'];`,
      '}',
      `echo "<h3>Wybrano: ${php}</h3>";`,
      'echo "<table>";',
      `echo "<tr>${headers.map((x) => `<th>${x}</th>`).join('')}</tr>";`,
      phpQueryLoop(specParam, [`echo "<tr>${cellsPhp(spec.fields.length)}</tr>";`]),
      'echo "</table>";',
    ].join('\n'));
    const prevTable = `<h3>Wybrano: ${h(def)}</h3>\n<table>\n<tr>${headers.map((x) => `<th>${h(x)}</th>`).join('')}</tr>\n${res.rows.map((r) => `<tr>${r.map((v) => `<td>${fmtCell(v)}</td>`).join('')}</tr>`).join('\n')}\n</table>`;
    return {
      lines: [{
        text: 'formularz wysyłający dane do tego samego pliku metodą bezpieczną (POST), zawierający:',
        children: [`${st.values.length} pola opcji (radio) o treściach: ${st.values.map((v) => q(cap(v))).join(', ')}; w jednym momencie można zaznaczyć tylko jedno z nich, domyślnie zaznaczone jest pierwsze`,
          `przycisk ${q(st.button)}, wysyłający dane z formularza do skryptu ${num.s[0]}`],
      }, `efekt działania skryptu ${num.s[0]} pod formularzem`],
      html: `${form}\n${code}`,
      preview: `${form}\n${prevTable}`,
      tags: ['form', 'input', 'label', 'button', 'h3', 'table', 'tr', 'th', 'td'],
      scripts: [{
        lines: [`pobiera z formularza wybraną opcję; jeżeli formularz nie został wysłany, przyjmowana jest opcja ${q(cap(def))}`,
          `wypisuje nagłówek trzeciego stopnia o treści ${q('Wybrano: <opcja>')}, gdzie <opcja> to wartość wybranej opcji pisana małymi literami`,
          `wysyła do bazy danych zapytanie ${num.q[0]}, zmodyfikowane w taki sposób, że w warunku pola ${param.col} używana jest wybrana opcja`,
          {
            text: 'zwrócone rekordy wyświetla w tabeli:',
            children: [`pierwszy wiersz zawiera komórki nagłówkowe: ${headers.map(q).join(', ')}`, 'każdy rekord to kolejny wiersz tabeli'],
          }],
      }],
    };
  },
};

export const phpSelectDetail = {
  id: 'phpSelectDetail',
  server: true,
  scripts: 2,
  plan: (ctx) => {
    const list = ctx.registry.request(['idName']);
    const detail = ctx.registry.request(['byId']);
    if (!list || !detail) return null;
    const price = ctx.S.col(ctx.S.main, 'price');
    return { list, detail, qty: Boolean(price) && ctx.rng.chance(0.7), button: ctx.rng.pick(['Sprawdź', 'Pokaż szczegóły', 'Oblicz', 'Wybierz']) };
  },
  render: (ctx, st, num) => {
    const t = ctx.S.main;
    const listSpec = st.list.result.spec;
    const detSpec = withParam(st.detail.result.spec, 'id', '$id', st.detail.result.param.value, false);
    const opts = execute(listSpec, ctx.db).rows;
    const det = execute(detSpec, ctx.db).rows[0];
    const fields = detSpec.fields;
    const priceIdx = fields.findIndex((f) => colDef(ctx.theme, f)?.role === 'price');
    const fileIdx = fields.findIndex((f) => colDef(ctx.theme, f)?.role === 'file');
    const textIdx = fields.map((f, i) => i).filter((i) => i !== fileIdx);
    const qty = st.qty && priceIdx >= 0;
    const unitLabel = ctx.theme.calc.unit;
    const button = qty ? 'Oblicz' : st.button;
    const formHtml = (optionsHtml) => `<form action="" method="post">\n<label for="wybor">Wybierz:</label>\n<select name="id" id="wybor">\n${optionsHtml}\n</select>\n${qty ? `<label for="ilosc">${h(unitLabel)}:</label>\n<input type="number" name="ilosc" id="ilosc" min="1">\n` : ''}<button type="submit">${button}</button>\n</form>`;
    const optionsPhp = phpBlock(phpQueryLoop(listSpec, ['echo "<option value=\'$wiersz[0]\'>$wiersz[1]</option>";']));
    const outText = textIdx.map((i) => `$wiersz[${i}]`).join(', ');
    const detailCode = phpBlock([
      qty ? "if (isset($_POST['id'], $_POST['ilosc'])) {" : "if (isset($_POST['id'])) {",
      "    $id = intval($_POST['id']);",
      ...(qty ? ["    $ilosc = intval($_POST['ilosc']);"] : []),
      `    $zapytanie = ${phpSql(detSpec)};`,
      '    $wynik = mysqli_query($polaczenie, $zapytanie);',
      '    $wiersz = mysqli_fetch_row($wynik);',
      ...(fileIdx >= 0 ? [`    echo "<img src='$wiersz[${fileIdx}]' alt='$wiersz[0]'>";`] : []),
      `    echo "<p>${outText}</p>";`,
      ...(qty ? [`    $wartosc = $wiersz[${priceIdx}] * $ilosc;`, '    echo "<p>Wartość: $wartosc zł</p>";'] : []),
      '}',
    ].join('\n'));
    const sampleQty = 3;
    const prevDetail = det ? `${fileIdx >= 0 ? `<img src="${h(det[fileIdx])}" alt="${h(det[0])}">` : ''}<p>${h(textIdx.map((i) => det[i]).join(', '))}</p>${qty ? `<p>Wartość: ${(Number(det[priceIdx]) * sampleQty).toFixed(2).replace(/\.00$/, '')} zł</p>` : ''}` : '';
    return {
      lines: [{
        text: 'formularz wysyłający dane do tego samego pliku metodą bezpieczną, zawierający:',
        children: [`etykietę ${q('Wybierz:')} powiązaną z listą rozwijaną, której opcje generuje skrypt ${num.s[0]}`,
          ...(qty ? [`etykietę ${q(`${unitLabel}:`)} powiązaną z polem edycyjnym przeznaczonym do wpisywania jedynie liczb`] : []),
          `przycisk ${q(button)}, wysyłający dane do skryptu ${num.s[1]}`],
      }, `efekt działania skryptu ${num.s[1]} pod formularzem`],
      html: `${formHtml(optionsPhp)}\n${detailCode}`,
      preview: `${formHtml(opts.map((r, i) => `<option value="${r[0]}"${r[0] === st.detail.result.param.value ? ' selected' : ''}>${h(r[1])}</option>`).join('\n'))}\n${prevDetail}`,
      previewNote: `wybrano rekord o identyfikatorze ${st.detail.result.param.value}${qty ? `, ${unitLabel.toLowerCase()}: ${sampleQty}` : ''}`,
      tags: ['form', 'label', 'select', 'option', 'button', 'p', ...(qty ? ['input'] : []), ...(fileIdx >= 0 ? ['img'] : [])],
      files: fileIdx >= 0 ? ctx.db.data[t.name].map((r) => r[fields[fileIdx].c]) : [],
      scripts: [
        { lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`, `dla każdego zwróconego wiersza tworzy opcję listy rozwijanej: wartością (atrybut value) jest pole id, a treścią opcji pole ${listSpec.fields[1].c}`] },
        {
          lines: ['wykonywany jedynie wtedy, gdy formularz został wysłany',
            `pobiera z formularza identyfikator wybranej opcji${qty ? ' oraz wpisaną liczbę' : ''}`,
            `wysyła do bazy danych zapytanie ${num.q[1]}, zmodyfikowane tak, że wybierany jest rekord o identyfikatorze przesłanym z formularza`,
            ...(fileIdx >= 0 ? [`wyświetla obraz o nazwie pliku zwróconej zapytaniem (pole ${fields[fileIdx].c}) i tekście alternatywnym równym polu ${fields[0].c}`] : []),
            `wypisuje paragraf z polami ${joinPl(textIdx.map((i) => fields[i].c))}, oddzielonymi przecinkiem i spacją`,
            ...(qty ? [`oblicza wartość jako iloczyn pola ${fields[priceIdx].c} i liczby z formularza, a następnie wypisuje ją w paragrafie w formacie ${q('Wartość: <wartość> zł')}`] : [])],
        },
      ],
    };
  },
};

export const phpInsertForm = {
  id: 'phpInsertForm',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['insertChild']);
    return ref && { ref, button: ctx.rng.pick(['Dodaj', 'Zapisz', 'Zarezerwuj', 'Wyślij zgłoszenie']) };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const table = ctx.theme.tables.find((t) => t.name === spec.t);
    const inputs = [];
    const auto = [];
    for (const [c, v] of Object.entries(spec.values)) {
      const col = table.columns.find((x) => x.name === c);
      if (v && v.raw) { auto.push({ c, v }); continue; }
      const type = ['num', 'fk', 'bool'].includes(col.role) ? 'number' : col.role === 'date' ? 'date' : col.role === 'price' ? 'number' : 'text';
      inputs.push({ c, type, label: `${cap(col.label)}:`, quoted: !['number'].includes(type) });
    }
    const values = {};
    for (const [c, v] of Object.entries(spec.values)) {
      const inp = inputs.find((i) => i.c === c);
      values[c] = inp ? { param: inp.quoted ? `'$${c}'` : `$${c}`, sample: v } : v;
    }
    const pSpec = { ...spec, values };
    const fieldsHtml = inputs.map((i) => `<label for="nowy_${i.c}">${h(i.label)}</label>\n<input type="${i.type}" name="${i.c}" id="nowy_${i.c}"${i.type === 'number' && i.c.includes('cena') ? ' step="0.01"' : ''}><br>`).join('\n');
    const form = `<form action="" method="post">\n${fieldsHtml}\n<button type="submit">${st.button}</button>\n</form>`;
    const code = phpBlock([
      `if (isset(${inputs.map((i) => `$_POST['${i.c}']`).join(', ')})) {`,
      ...inputs.map((i) => (i.quoted ? `    $${i.c} = mysqli_real_escape_string($polaczenie, $_POST['${i.c}']);` : `    $${i.c} = ${i.type === 'number' && i.c.includes('cena') ? 'floatval' : 'intval'}($_POST['${i.c}']);`)),
      `    $zapytanie = ${phpSql(pSpec)};`,
      '    mysqli_query($polaczenie, $zapytanie);',
      `    echo "<p>Dodano rekord do tabeli ${spec.t}</p>";`,
      '}',
    ].join('\n'));
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q('Nowy wpis')}`, {
        text: 'formularz wysyłający dane do tego samego pliku metodą bezpieczną, zawierający:',
        children: [...inputs.map((i) => `etykietę ${q(i.label)} powiązaną z polem ${i.type === 'number' ? 'przeznaczonym do wpisywania jedynie liczb' : i.type === 'date' ? 'do wprowadzania daty (z kalendarzem)' : 'edycyjnym'}`),
          `przycisk ${q(st.button)} wysyłający dane do skryptu ${num.s[0]}`],
      }, 'każda para etykieta–pole jest wyświetlana w osobnej linii'],
      html: `<h3>Nowy wpis</h3>\n${form}\n${code}`,
      preview: `<h3>Nowy wpis</h3>\n${form}`,
      tags: ['h3', 'form', 'label', 'input', 'button', 'br'],
      scripts: [{
        lines: ['wykonywany jedynie wtedy, gdy formularz został wysłany',
          `pobiera dane z formularza i wysyła do bazy danych zapytanie ${num.q[0]}, zmodyfikowane tak, że w miejscu wartości ${joinPl(inputs.map((i) => i.c))} wstawiane są dane z formularza${auto.length ? `; pole ${auto.map((a) => a.c).join(', ')} jest wypełniane automatycznie` : ''}`,
          `po dodaniu rekordu wypisuje paragraf o treści ${q(`Dodano rekord do tabeli ${spec.t}`)}`],
      }],
    };
  },
};

// Dwie strony: lista odnośników (index.php) -> szczegóły rekordu przekazanego metodą GET.
export const phpLinksDetail = {
  id: 'phpLinksDetail',
  server: true,
  scripts: 2,
  twoPages: true,
  plan: (ctx) => {
    const list = ctx.registry.request(['idName']);
    const detail = ctx.registry.request(['joinChild'], (r) => r.tags.includes('byParentId'));
    if (!list || !detail) return null;
    return { list, detail };
  },
  render: (ctx, st, num) => {
    const page2 = ctx.pages[1].file;
    const listSpec = st.list.result.spec;
    const detSpec = withParam(st.detail.result.spec, 'id', '$id', st.detail.result.param.value, false);
    const opts = execute(listSpec, ctx.db).rows;
    const det = execute(detSpec, ctx.db).rows;
    const headers = detSpec.fields.slice(1).map((f) => headerLabel(ctx.theme, detSpec, f));
    const listCode = phpBlock(phpQueryLoop(listSpec, [`echo "<li><a href='${page2}?id=$wiersz[0]&nazwa=$wiersz[1]'>$wiersz[1]</a></li>";`]));
    const name = det[0]?.[0] || opts[0][1];
    const detCode = phpBlock([
      "if (isset($_GET['id'])) {",
      "    $id = intval($_GET['id']);",
      "    $nazwa = htmlspecialchars($_GET['nazwa']);",
      '    echo "<h2>$nazwa</h2>";',
      '    echo "<table>";',
      `    echo "<tr>${headers.map((x) => `<th>${x}</th>`).join('')}</tr>";`,
      phpQueryLoop(detSpec, [`echo "<tr>${cellsPhp(headers.length, 1)}</tr>";`], { indent: '    ' }),
      '    echo "</table>";',
      '}',
    ].join('\n'));
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q('Wybierz z listy:')}`, `lista punktowana wypełniona przez skrypt ${num.s[0]}`],
      html: `<h3>Wybierz z listy:</h3>\n<ul>\n${listCode}\n</ul>`,
      preview: `<h3>Wybierz z listy:</h3>\n<ul>\n${opts.map((r) => `<li><a href="#">${h(r[1])}</a></li>`).join('\n')}\n</ul>`,
      page2: {
        lines: [`efekt działania skryptu ${num.s[1]}`],
        html: detCode,
        preview: `<h2>${h(name)}</h2>\n<table>\n<tr>${headers.map((x) => `<th>${h(x)}</th>`).join('')}</tr>\n${det.map((r) => `<tr>${r.slice(1).map((v) => `<td>${fmtCell(v)}</td>`).join('')}</tr>`).join('\n')}\n</table>`,
        previewNote: `wybrano: ${name}`,
      },
      tags: ['h3', 'ul', 'li', 'a', 'h2', 'table', 'tr', 'th', 'td'],
      scripts: [
        {
          where: 'index.php',
          lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
            {
              text: 'dla każdego zwróconego wiersza tworzy element listy z odnośnikiem o cechach:',
              children: [`treść odnośnika: wartość pola ${listSpec.fields[1].c}`,
                `adres: strona ${page2}, do której metodą GET przesyłane są parametry id oraz nazwa (wartości zwrócone z bazy)`],
            }],
        },
        {
          where: page2,
          lines: ['wykonywany jedynie wtedy, gdy do strony przesłano parametr id',
            'w nagłówku drugiego stopnia wyświetla nazwę przesłaną metodą GET',
            `wysyła do bazy danych zapytanie ${num.q[1]}, zmodyfikowane tak, że wybierane są dane dla identyfikatora przesłanego metodą GET`,
            `zwrócone dane wyświetla w tabeli; pierwszy wiersz zawiera komórki nagłówkowe: ${headers.map(q).join(', ')}, kolejne wiersze zawierają pola ${joinPl(detSpec.fields.slice(1).map((f) => f.c))}`],
        },
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// Widżety JavaScript (skrypty po stronie klienta)
// ---------------------------------------------------------------------------

export const jsCalculator = {
  id: 'jsCalculator',
  client: true,
  scripts: 1,
  plan: (ctx) => {
    const t = ctx.theme.tables.find((x) => x.name === ctx.theme.calc.table);
    const price = ctx.S.col(t, 'price');
    if (!price) return null;
    const items = ctx.rng.sample(ctx.db.data[t.name], 3).map((r) => ({ name: r[labelCol(t).name], price: Number(r[price.name].toFixed ? r[price.name].toFixed(2) : r[price.name]) }));
    return { items, asSelect: ctx.rng.chance(0.4), discount: ctx.rng.chance(0.5) ? { min: ctx.rng.pick([5, 10]), pct: ctx.rng.pick([5, 10, 15]) } : null };
  },
  render: (ctx, st, num) => {
    const c = ctx.theme.calc;
    const priceLabel = c.priceLabel || 'cena';
    const choice = st.asSelect
      ? `<label for="opcja">Wybierz:</label>\n<select id="opcja">\n${st.items.map((it, i) => `<option value="${it.price}">${h(it.name)}</option>`).join('\n')}\n</select><br>`
      : st.items.map((it, i) => `<label><input type="radio" name="opcja" value="${it.price}"${i === 0 ? ' checked' : ''}> ${h(it.name)} (${formatPln(it.price)} zł)</label><br>`).join('\n');
    const html = `<h2>Kalkulator</h2>\n${choice}\n<label for="liczba">${h(c.unit)}:</label>\n<input type="number" id="liczba" min="1"><br>\n<label><input type="checkbox" id="dodatek"> ${h(c.extra)} (+${c.extraCost} zł)</label><br>\n<button onclick="oblicz()">${h(c.action)}</button>\n<p id="wynik"></p>`;
    const getPrice = st.asSelect
      ? "    const cena = Number(document.getElementById('opcja').value);"
      : "    const cena = Number(document.querySelector('input[name=\"opcja\"]:checked').value);";
    const js = [
      'function oblicz() {',
      getPrice,
      "    const liczba = Number(document.getElementById('liczba').value);",
      "    const wynik = document.getElementById('wynik');",
      '    if (!liczba || liczba < 1) {',
      "        wynik.innerHTML = 'Podaj poprawną liczbę';",
      '        return;',
      '    }',
      '    let koszt = cena * liczba;',
      ...(st.discount ? [`    if (liczba >= ${st.discount.min}) {`, `        koszt = koszt * ${(1 - st.discount.pct / 100).toFixed(2)};`, '    }'] : []),
      "    if (document.getElementById('dodatek').checked) {",
      `        koszt = koszt + ${c.extraCost};`,
      '    }',
      "    wynik.innerHTML = 'Koszt: ' + koszt.toFixed(2) + ' zł';",
      '}',
    ].join('\n');
    return {
      lines: [`nagłówek drugiego stopnia o treści ${q('Kalkulator')}`,
        st.asSelect
          ? `etykieta ${q('Wybierz:')} powiązana z listą rozwijaną zawierającą opcje: ${st.items.map((it) => q(it.name)).join(', ')}; wartością każdej opcji jest jej ${priceLabel} (odpowiednio: ${st.items.map((it) => formatPln(it.price)).join(', ')})`
          : `trzy pola opcji (radio), z których można zaznaczyć tylko jedno, domyślnie pierwsze, z opisami: ${st.items.map((it) => q(`${it.name} (${formatPln(it.price)} zł)`)).join(', ')}`,
        `etykieta ${q(`${c.unit}:`)} powiązana z polem edycyjnym przeznaczonym do wpisywania jedynie liczb`,
        `pole wyboru (checkbox) z opisem ${q(`${c.extra} (+${c.extraCost} zł)`)}`,
        `przycisk ${q(c.action)}, którego kliknięcie uruchamia skrypt ${num.s[0]}`,
        'pusty paragraf przeznaczony na wynik obliczeń',
        'każdy z powyższych elementów (poza paragrafem) jest wyświetlany w osobnej linii'],
      html,
      js,
      tags: ['h2', 'label', 'input', 'button', 'p', 'br', ...(st.asSelect ? ['select', 'option'] : [])],
      scripts: [{
        lines: [`pobiera ${priceLabel} wybranej opcji oraz liczbę wpisaną w pole edycyjne`,
          `jeżeli pole jest puste lub liczba jest mniejsza od 1, w paragrafie wypisuje komunikat ${q('Podaj poprawną liczbę')}`,
          `w przeciwnym razie oblicza koszt jako iloczyn ceny i liczby${st.discount ? `; gdy liczba wynosi co najmniej ${st.discount.min}, koszt jest obniżany o ${st.discount.pct}%` : ''}`,
          `jeżeli zaznaczono pole ${q(c.extra)}, do kosztu doliczane jest ${c.extraCost} zł (po ewentualnym rabacie)`,
          `wynik wypisuje w paragrafie w formacie ${q('Koszt: <koszt> zł')}, z dokładnością do dwóch miejsc po przecinku`],
      }],
      example: (() => {
        const it = st.items[0];
        let k = it.price * 6;
        if (st.discount && 6 >= st.discount.min) k *= 1 - st.discount.pct / 100;
        return `dla opcji ${q(it.name)} i liczby 6 bez dodatku wynik to ${q(`Koszt: ${k.toFixed(2)} zł`)}`;
      })(),
    };
  },
};

export const jsSlider = {
  id: 'jsSlider',
  client: true,
  scripts: 1,
  plan: (ctx) => {
    const opt = ctx.rng.pick([
      { label: 'Ocena', min: 1, max: 10, def: 5, unit: '/10' },
      { label: 'Budżet', min: 100, max: 2000, def: 500, step: 50, unit: ' zł' },
      { label: 'Wiek', min: 1, max: 100, def: 18, unit: ' lat' },
    ]);
    return { ...opt, sync: ctx.rng.chance(0.5) };
  },
  render: (ctx, st, num) => {
    const html = `<label for="suwak">${st.label}:</label>\n<input type="range" id="suwak" min="${st.min}" max="${st.max}"${st.step ? ` step="${st.step}"` : ''} value="${st.def}" oninput="pokazWartosc()">\n${st.sync ? `<input type="number" id="wartosc" value="${st.def}" readonly>\n` : ''}<p id="opisSuwaka">${st.label}: ${st.def}${st.unit}</p>`;
    const js = [
      'function pokazWartosc() {',
      "    const wartosc = document.getElementById('suwak').value;",
      ...(st.sync ? ["    document.getElementById('wartosc').value = wartosc;"] : []),
      `    document.getElementById('opisSuwaka').innerHTML = '${st.label}: ' + wartosc + '${st.unit}';`,
      '}',
    ].join('\n');
    return {
      lines: [`etykieta ${q(`${st.label}:`)} powiązana z polem zakresu liczbowego (suwakiem) o wartościach od ${st.min} do ${st.max}${st.step ? ` z krokiem ${st.step}` : ''}, wartość początkowa ${st.def}`,
        ...(st.sync ? [`pole edycyjne liczbowe tylko do odczytu, z wartością początkową ${st.def}`] : []),
        `paragraf o treści ${q(`${st.label}: ${st.def}${st.unit}`)}`],
      html,
      js,
      tags: ['label', 'input', 'p'],
      scripts: [{
        lines: ['wykonywany przy każdej zmianie położenia suwaka (w trakcie przesuwania)',
          ...(st.sync ? ['pobraną z suwaka wartość wpisuje do pola edycyjnego'] : []),
          `w paragrafie wypisuje tekst ${q(`${st.label}: <wartość>${st.unit}`)}`],
      }],
    };
  },
};

export const jsDate = {
  id: 'jsDate',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ format: ctx.rng.pick(['DD.MM.RRRR', 'RRRR-MM-DD', 'DD/MM/RRRR']), prefix: ctx.rng.pick(['Dzisiaj jest: ', 'Data: ', 'Aktualna data: ']) }),
  render: (ctx, st, num) => {
    const parts = { 'DD.MM.RRRR': "dzien + '.' + miesiac + '.' + rok", 'RRRR-MM-DD': "rok + '-' + miesiac + '-' + dzien", 'DD/MM/RRRR': "dzien + '/' + miesiac + '/' + rok" }[st.format];
    const js = [
      'function pokazDate() {',
      '    const teraz = new Date();',
      "    const dzien = String(teraz.getDate()).padStart(2, '0');",
      "    const miesiac = String(teraz.getMonth() + 1).padStart(2, '0');",
      '    const rok = teraz.getFullYear();',
      `    document.getElementById('data').innerHTML = '${st.prefix}' + ${parts};`,
      '}',
      "window.addEventListener('load', pokazDate);",
    ].join('\n');
    return {
      lines: [`paragraf, w którym skrypt ${num.s[0]} wyświetla aktualną datę`],
      html: '<p id="data"></p>',
      js,
      tags: ['p'],
      scripts: [{ lines: ['wykonywany automatycznie po załadowaniu strony', `wyświetla tekst ${q(`${st.prefix}<data>`)}, gdzie <data> to aktualna (dzisiejsza) data w formacie ${st.format}; dzień i miesiąc są zawsze dwucyfrowe`] }],
    };
  },
};

export const jsThumbs = {
  id: 'jsThumbs',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ files: ctx.theme.images.extra.slice(0, 3), cls: ctx.rng.pick(['miniatura', 'maly', 'podglad']) }),
  render: (ctx, st, num) => {
    const alts = st.files.map((f) => cap(f.replace(/\.\w+$/, '').replace(/_/g, ' ')));
    const html = `<img src="${st.files[0]}" alt="${h(alts[0])}" id="duzy">\n<div>\n${st.files.map((f, i) => `<img src="${f}" alt="${h(alts[i])}" class="${st.cls}" onclick="zmienObraz(this)">`).join('\n')}\n</div>`;
    const js = [
      'function zmienObraz(miniatura) {',
      "    const duzy = document.getElementById('duzy');",
      '    duzy.src = miniatura.src;',
      '    duzy.alt = miniatura.alt;',
      '}',
    ].join('\n');
    return {
      lines: [`obraz ${st.files[0]} z tekstem alternatywnym ${q(alts[0])} (obraz duży)`,
        `poniżej, obok siebie, trzy miniatury: ${st.files.map((f, i) => `${f} (tekst alternatywny ${q(alts[i])})`).join(', ')}; miniatury mają przypisaną klasę ${q(st.cls)}; kliknięcie miniatury uruchamia skrypt ${num.s[0]}`],
      html,
      js,
      tags: ['img', 'div'],
      classes: [{ name: st.cls, tag: 'img', descPl: 'miniatur', thumb: true }],
      files: st.files,
      scripts: [{ lines: ['wykonywany po kliknięciu dowolnej miniatury', 'w miejscu obrazu dużego wyświetla obraz klikniętej miniatury (zmienia źródło i tekst alternatywny)'] }],
    };
  },
};

export const jsToggle = {
  id: 'jsToggle',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ show: 'Pokaż szczegóły', hide: 'Ukryj szczegóły' }),
  render: (ctx, st, num) => {
    const html = `<button id="przelacznik" onclick="przelacz()">${st.show}</button>\n<div id="szczegoly" style="display: none">\n<p>${h(ctx.theme.paragraph)}</p>\n</div>`;
    const js = [
      'function przelacz() {',
      "    const blok = document.getElementById('szczegoly');",
      "    const przycisk = document.getElementById('przelacznik');",
      "    if (blok.style.display === 'none') {",
      "        blok.style.display = 'block';",
      `        przycisk.innerHTML = '${st.hide}';`,
      '    } else {',
      "        blok.style.display = 'none';",
      `        przycisk.innerHTML = '${st.show}';`,
      '    }',
      '}',
    ].join('\n');
    return {
      lines: [`przycisk o treści ${q(st.show)}, którego kliknięcie uruchamia skrypt ${num.s[0]}`,
        `blok (div) z paragrafem o treści ${q(ctx.theme.paragraph)}; w stanie początkowym blok jest ukryty`],
      html,
      js,
      tags: ['button', 'div', 'p'],
      scripts: [{ lines: ['wykonywany po kliknięciu przycisku', `gdy blok ze szczegółami jest ukryty – pokazuje go i zmienia napis na przycisku na ${q(st.hide)}`, `gdy blok jest widoczny – ukrywa go i przywraca napis ${q(st.show)}`] }],
    };
  },
};

export const jsFontSize = {
  id: 'jsFontSize',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ sizes: ctx.rng.pick([[80, 100, 150], [90, 120, 160], [75, 100, 125]]) }),
  render: (ctx, st, num) => {
    const names = ['A-', 'A', 'A+'];
    const html = `<p id="tekst">${h(ctx.theme.paragraph)}</p>\n${names.map((n, i) => `<button onclick="zmienRozmiar(${st.sizes[i]})">${n}</button>`).join('\n')}`;
    const js = ['function zmienRozmiar(procent) {', "    document.getElementById('tekst').style.fontSize = procent + '%';", '}'].join('\n');
    return {
      lines: [`paragraf o treści ${q(ctx.theme.paragraph)}`, `trzy przyciski o treściach ${names.map(q).join(', ')}, których kliknięcie uruchamia skrypt ${num.s[0]}`],
      html,
      js,
      tags: ['p', 'button'],
      scripts: [{ lines: ['wykonywany po kliknięciu jednego z przycisków', `ustawia rozmiar czcionki paragrafu odpowiednio na: ${st.sizes.map((s, i) => `${s}% (${q(names[i])})`).join(', ')}`] }],
    };
  },
};

export const jsContactForm = {
  id: 'jsContactForm',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ minLen: ctx.rng.pick([10, 15, 20]) }),
  render: (ctx, st, num) => {
    const html = `<h3>Napisz do nas</h3>\n<label for="imie">Imię:</label>\n<input type="text" id="imie"><br>\n<label for="email">E-mail:</label>\n<input type="email" id="email"><br>\n<label for="tresc">Wiadomość:</label><br>\n<textarea id="tresc" rows="4" cols="30"></textarea><br>\n<label><input type="checkbox" id="zgoda"> Akceptuję regulamin</label><br>\n<button onclick="wyslij()">Wyślij</button>\n<p id="komunikat"></p>`;
    const js = [
      'function wyslij() {',
      "    const imie = document.getElementById('imie').value;",
      "    const email = document.getElementById('email').value;",
      "    const tresc = document.getElementById('tresc').value;",
      "    const zgoda = document.getElementById('zgoda').checked;",
      "    const komunikat = document.getElementById('komunikat');",
      `    if (imie === '' || !email.includes('@') || tresc.length < ${st.minLen} || !zgoda) {`,
      "        komunikat.style.color = 'red';",
      "        komunikat.innerHTML = 'Uzupełnij poprawnie formularz';",
      '    } else {',
      "        komunikat.style.color = 'green';",
      "        komunikat.innerHTML = imie + ', dziękujemy za wiadomość';",
      '    }',
      '}',
    ].join('\n');
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q('Napisz do nas')}`,
        `etykieta ${q('Imię:')} powiązana z polem edycyjnym`,
        `etykieta ${q('E-mail:')} powiązana z polem przeznaczonym do wpisywania adresu e-mail`,
        `etykieta ${q('Wiadomość:')} powiązana z obszarem tekstowym o 4 wierszach i 30 kolumnach`,
        `pole wyboru (checkbox) z opisem ${q('Akceptuję regulamin')}`,
        `przycisk ${q('Wyślij')}, którego kliknięcie uruchamia skrypt ${num.s[0]}`,
        'pusty paragraf na komunikat'],
      html,
      js,
      tags: ['h3', 'label', 'input', 'textarea', 'button', 'p', 'br'],
      scripts: [{
        lines: ['pobiera dane z pól formularza',
          `jeżeli imię jest puste, adres e-mail nie zawiera znaku @, wiadomość ma mniej niż ${st.minLen} znaków lub nie zaznaczono akceptacji regulaminu – wypisuje w paragrafie czerwonym kolorem tekst ${q('Uzupełnij poprawnie formularz')}`,
          `w przeciwnym razie wypisuje zielonym kolorem tekst ${q('<imię>, dziękujemy za wiadomość')}`],
      }],
    };
  },
};

export const jsSearch = {
  id: 'jsSearch',
  client: true,
  scripts: 1,
  plan: (ctx) => {
    const t = ctx.S.main;
    const info = ctx.S.col(t, 'cat') || ctx.S.col(t, 'num');
    const extra = ctx.S.col(t, 'price') || ctx.S.col(t, 'num');
    const rows = ctx.rng.sample(ctx.db.data[t.name], 5);
    return { t, info, extra: extra !== info ? extra : null, rows };
  },
  render: (ctx, st, num) => {
    const n = labelCol(st.t);
    const fmt = (col, v) => (col.type.startsWith('DECIMAL') ? Number(v).toFixed(2) : v);
    const items = st.rows.map((r) => ({ nazwa: r[n.name], a: fmt(st.info, r[st.info.name]), b: st.extra ? fmt(st.extra, r[st.extra.name]) : null }));
    const html = `<label for="szukaj">Wpisz nazwę:</label>\n<input type="text" id="szukaj">\n<button onclick="szukaj()">Szukaj</button>\n<p id="informacja"></p>`;
    const js = [
      'const dane = [',
      ...items.map((it) => `    { nazwa: '${it.nazwa}', ${st.info.name}: '${it.a}'${st.extra ? `, ${st.extra.name}: '${it.b}'` : ''} },`),
      '];',
      '',
      'function szukaj() {',
      "    const tekst = document.getElementById('szukaj').value.trim().toLowerCase();",
      "    const informacja = document.getElementById('informacja');",
      '    for (const element of dane) {',
      '        if (element.nazwa.toLowerCase() === tekst) {',
      `            informacja.innerHTML = element.nazwa + ': ${st.info.label} ' + element.${st.info.name}${st.extra ? ` + ', ${st.extra.label} ' + element.${st.extra.name}` : ''};`,
      '            return;',
      '        }',
      '    }',
      "    informacja.innerHTML = 'Brak w bazie';",
      '}',
    ].join('\n');
    return {
      lines: [`etykieta ${q('Wpisz nazwę:')} powiązana z polem edycyjnym`, `przycisk ${q('Szukaj')}, którego kliknięcie uruchamia skrypt ${num.s[0]}`, 'pusty paragraf przeznaczony na wynik wyszukiwania'],
      html,
      js,
      tags: ['label', 'input', 'button', 'p'],
      scripts: [{
        lines: [{
          text: `zawiera tablicę obiektów opisujących ${items.length} rekordów (właściwości: nazwa, ${st.info.name}${st.extra ? `, ${st.extra.name}` : ''}):`,
          children: items.map((it) => `${it.nazwa}; ${it.a}${st.extra ? `; ${it.b}` : ''}`),
        },
        'po kliknięciu przycisku wyszukuje w tablicy obiekt, którego nazwa jest równa tekstowi wpisanemu w pole (bez rozróżniania wielkości liter i z pominięciem spacji na początku i końcu)',
        `jeżeli obiekt został znaleziony, wypisuje w paragrafie tekst ${q(`<nazwa>: ${st.info.label} <${st.info.name}>${st.extra ? `, ${st.extra.label} <${st.extra.name}>` : ''}`)}`,
        `w przeciwnym razie wypisuje tekst ${q('Brak w bazie')}`],
      }],
    };
  },
};

export const WIDGETS = {
  heading, navLinks, image, contact, paragraph, staticTable, footerAuthor, footerLink,
  phpTable, phpList, phpGallery, phpStats, phpCards, phpRadioFilter, phpSelectDetail, phpInsertForm, phpLinksDetail,
  jsCalculator, jsSlider, jsDate, jsThumbs, jsToggle, jsFontSize, jsContactForm, jsSearch,
};

export { sampleValue };
// Pomocnicze funkcje współdzielone z widgets-extra.js
export { phpBlock, phpQueryLoop, phpSql, cap, colDef, headerLabel, withParam, fmtCell, cellsPhp };
