// Dodatkowe widżety odtworzone z typowych zadań w arkuszach E.14/EE.09/INF.03 (2018-2026):
// PHP: wyszukiwanie po początku nazwy, aktualizacja rekordu z formularza, lista według wzoru zdania,
//      bloki tworzone dla każdego rekordu z warunkiem;
// JS:  zakładki, pokaz zdjęć (poprzednie/następne), lista zadań, licznik odwiedzin (localStorage),
//      podsumowanie formularza, zmiana stylu akapitu przyciskami.
import { execute } from './sql.js';
import { escapeHtml as h, q } from './util.js';
import { phpBlock, phpQueryLoop, phpSql, cap, colDef, headerLabel, fmtCell } from './widgets.js';
import { label as labelCol } from './queries.js';

// ---------------------------------------------------------------------------
// PHP
// ---------------------------------------------------------------------------

export const phpSearchLike = {
  id: 'phpSearchLike',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['likePrefix']);
    return ref && { ref };
  },
  render: (ctx, st, num) => {
    const { spec, param } = st.ref.result;
    const pSpec = { ...spec, where: spec.where.map((w) => ({ ...w, v: { param: "'$fraza%'", sample: `${param.value}%` } })) };
    const headers = spec.fields.map((f) => headerLabel(ctx.theme, spec, f));
    const res = execute(pSpec, ctx.db);
    const form = `<form action="" method="post">\n<label for="fraza">Początek nazwy:</label>\n<input type="text" name="fraza" id="fraza">\n<button type="submit">Szukaj</button>\n</form>`;
    const code = phpBlock([
      "if (!empty($_POST['fraza'])) {",
      "    $fraza = mysqli_real_escape_string($polaczenie, $_POST['fraza']);",
      '    echo "<p>Wyszukiwanie: $fraza</p>";',
      '    echo "<table>";',
      `    echo "<tr>${headers.map((x) => `<th>${x}</th>`).join('')}</tr>";`,
      phpQueryLoop(pSpec, [`echo "<tr>${spec.fields.map((f, i) => `<td>$wiersz[${i}]</td>`).join('')}</tr>";`], { indent: '    ' }),
      '    echo "</table>";',
      '}',
    ].join('\n'));
    return {
      lines: [{
        text: 'formularz wysyłający dane do tego samego pliku metodą bezpieczną, zawierający:',
        children: [`etykietę ${q('Początek nazwy:')} powiązaną z polem edycyjnym`, `przycisk ${q('Szukaj')}`],
      }, `efekt działania skryptu ${num.s[0]} pod formularzem`],
      html: `${form}\n${code}`,
      preview: `${form}\n<p>Wyszukiwanie: ${h(param.value)}</p>\n<table>\n<tr>${headers.map((x) => `<th>${h(x)}</th>`).join('')}</tr>\n${res.rows.map((r) => `<tr>${r.map((v) => `<td>${fmtCell(v)}</td>`).join('')}</tr>`).join('\n')}\n</table>`,
      previewNote: `wyszukano ${q(param.value)}`,
      tags: ['form', 'label', 'input', 'button', 'p', 'table', 'tr', 'th', 'td'],
      scripts: [{
        lines: ['wykonywany tylko wtedy, gdy z formularza przesłano niepusty tekst',
          `wypisuje w paragrafie tekst ${q('Wyszukiwanie: <tekst>')}, gdzie <tekst> to wartość przesłana z formularza`,
          `wysyła do bazy danych zapytanie ${num.q[0]}, zmodyfikowane tak, że wybierane są rekordy, w których pole ${spec.where[0].c} rozpoczyna się od tekstu przesłanego z formularza`,
          `wyniki wyświetla w tabeli z wierszem komórek nagłówkowych: ${headers.map(q).join(', ')}; każdy rekord w osobnym wierszu`],
      }],
    };
  },
};

export const phpUpdateForm = {
  id: 'phpUpdateForm',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['updateById']);
    return ref && { ref };
  },
  render: (ctx, st, num) => {
    const { spec, param } = st.ref.result;
    const col = colDef(ctx.theme, { t: spec.t, c: param.col });
    const isDec = col.type.startsWith('DECIMAL');
    const pSpec = {
      ...spec,
      set: [{ c: param.col, v: { param: '$wartosc', sample: spec.set[0].v } }],
      where: [{ ...spec.where[0], v: { param: '$id', sample: param.id } }],
    };
    const form = `<form action="" method="post">\n<label for="rekord">Identyfikator:</label>\n<input type="number" name="rekord" id="rekord">\n<label for="wartosc">Nowa wartość (${h(col.label)}):</label>\n<input type="number" name="wartosc" id="wartosc"${isDec ? ' step="0.01"' : ''}>\n<button type="submit">Zmień</button>\n</form>`;
    const code = phpBlock([
      "if (isset($_POST['rekord'], $_POST['wartosc'])) {",
      "    $id = intval($_POST['rekord']);",
      `    $wartosc = ${isDec ? 'floatval' : 'intval'}($_POST['wartosc']);`,
      `    $zapytanie = ${phpSql(pSpec)};`,
      '    mysqli_query($polaczenie, $zapytanie);',
      '    echo "<p>Zaktualizowano rekord o identyfikatorze $id</p>";',
      '}',
    ].join('\n'));
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q('Aktualizacja danych')}`, {
        text: 'formularz wysyłający dane do tego samego pliku metodą bezpieczną, zawierający:',
        children: [`etykietę ${q('Identyfikator:')} powiązaną z polem przeznaczonym do wpisywania liczb`,
          `etykietę ${q(`Nowa wartość (${col.label}):`)} powiązaną z polem przeznaczonym do wpisywania liczb`,
          `przycisk ${q('Zmień')}, wysyłający dane do skryptu ${num.s[0]}`],
      }],
      html: `<h3>Aktualizacja danych</h3>\n${form}\n${code}`,
      preview: `<h3>Aktualizacja danych</h3>\n${form}`,
      tags: ['h3', 'form', 'label', 'input', 'button', 'p'],
      scripts: [{
        lines: ['wykonywany tylko wtedy, gdy formularz został wysłany',
          `wysyła do bazy danych zapytanie ${num.q[0]}, zmodyfikowane tak, że identyfikator rekordu i nowa wartość pola ${param.col} pochodzą z formularza`,
          `wypisuje paragraf o treści ${q('Zaktualizowano rekord o identyfikatorze <id>')}`],
      }],
    };
  },
};

export const phpTemplateList = {
  id: 'phpTemplateList',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['joinParent', 'filterCatSorted', 'topN', 'numCompare', 'filterAnd']);
    return ref && ref.result.spec.fields.length >= 2 && { ref, ordered: ctx.rng.chance(0.5) };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const fields = spec.fields.slice(0, 3);
    const labels = fields.map((f) => colDef(ctx.theme, f)?.label || f.c);
    const unit = (f) => (colDef(ctx.theme, f)?.role === 'price' ? ' zł' : '');
    const tpl = `<${fields[0].c}>${fields.slice(1).map((f, i) => `, ${labels[i + 1]}: <${f.c}>${unit(f)}`).join('')}`;
    const phpLine = `$wiersz[0]${fields.slice(1).map((f, i) => `, ${labels[i + 1]}: $wiersz[${i + 1}]${unit(f)}`).join('')}`;
    const res = execute(spec, ctx.db);
    const tag = st.ordered ? 'ol' : 'ul';
    return {
      lines: [`lista ${st.ordered ? 'numerowana' : 'punktowana'} wypełniona przez skrypt ${num.s[0]}`],
      html: `<${tag}>\n${phpBlock(phpQueryLoop(spec, [`echo "<li>${phpLine}</li>";`]))}\n</${tag}>`,
      preview: `<${tag}>\n${res.rows.map((r) => `<li>${h(String(r[0]))}${fields.slice(1).map((f, i) => `, ${h(labels[i + 1])}: ${fmtCell(r[i + 1])}${unit(f)}`).join('')}</li>`).join('\n')}\n</${tag}>`,
      tags: [tag, 'li'],
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          `każdy zwrócony wiersz wyświetla jako element listy według wzoru: ${q(tpl)}, gdzie w znakach <> zapisano pola zwrócone zapytaniem`],
      }],
    };
  },
};

export const phpRowBlocks = {
  id: 'phpRowBlocks',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['cards']);
    if (!ref) return null;
    const vf = ref.result.spec.fields[ref.result.spec.fields.length - 1];
    const vals = execute(ref.result.spec, ctx.db).rows.map((r) => Number(r[r.length - 1])).sort((a, b) => a - b);
    const threshold = vals[Math.floor(vals.length / 2)];
    return { ref, cls: ctx.rng.pick(['produkt', 'oferta', 'pozycja']), threshold, level: ctx.rng.pick([3, 4]), vf };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const res = execute(spec, ctx.db);
    const fileIdx = spec.fields.findIndex((f) => colDef(ctx.theme, f)?.role === 'file');
    const nameIdx = fileIdx >= 0 ? 1 : 0;
    const valIdx = spec.fields.length - 1;
    const catIdx = spec.fields.findIndex((f) => colDef(ctx.theme, f)?.role === 'cat');
    const vCol = colDef(ctx.theme, spec.fields[valIdx]);
    const unit = vCol.role === 'price' ? ' zł' : '';
    const hl = st.level;
    const body = [
      `echo "<section class='${st.cls}'>";`,
      ...(fileIdx >= 0 ? [`echo "<img src='$wiersz[${fileIdx}]' alt='$wiersz[${nameIdx}]'>";`] : []),
      `echo "<h${hl}>$wiersz[${nameIdx}]</h${hl}>";`,
      ...(catIdx >= 0 ? [`echo "<p>${cap(colDef(ctx.theme, spec.fields[catIdx]).label)}: $wiersz[${catIdx}]</p>";`] : []),
      `if ($wiersz[${valIdx}] > ${st.threshold}) {`,
      `    echo "<p><strong>${cap(vCol.label)}: $wiersz[${valIdx}]${unit}</strong></p>";`,
      '} else {',
      `    echo "<p>${cap(vCol.label)}: $wiersz[${valIdx}]${unit}</p>";`,
      '}',
      'echo "</section>";',
    ];
    const prev = res.rows.map((r) => {
      const v = `${cap(vCol.label)}: ${r[valIdx]}${unit}`;
      return `<section class="${st.cls}">${fileIdx >= 0 ? `<img src="${h(r[fileIdx])}" alt="${h(r[nameIdx])}">` : ''}<h${hl}>${h(r[nameIdx])}</h${hl}>${catIdx >= 0 ? `<p>${h(cap(colDef(ctx.theme, spec.fields[catIdx]).label))}: ${h(r[catIdx])}</p>` : ''}<p>${Number(r[valIdx]) > st.threshold ? `<strong>${h(v)}</strong>` : h(v)}</p></section>`;
    }).join('\n');
    return {
      lines: [`efekt działania skryptu ${num.s[0]} – bloki z danymi`],
      html: phpBlock(phpQueryLoop(spec, body)),
      preview: prev,
      tags: ['section', `h${hl}`, 'p', 'strong', ...(fileIdx >= 0 ? ['img'] : [])],
      classes: [{ name: st.cls, tag: 'div', descPl: 'bloków generowanych przez skrypt' }],
      files: fileIdx >= 0 ? res.rows.map((r) => r[fileIdx]) : [],
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          {
            text: `dla każdego zwróconego wiersza tworzy blok sekcji z przypisaną klasą ${q(st.cls)}, a w nim:`,
            children: [
              ...(fileIdx >= 0 ? [`obraz, którego źródłem jest pole ${spec.fields[fileIdx].c}, a tekstem alternatywnym pole ${spec.fields[nameIdx].c}`] : []),
              `nagłówek ${hl === 3 ? 'trzeciego' : 'czwartego'} stopnia z polem ${spec.fields[nameIdx].c}`,
              ...(catIdx >= 0 ? [`paragraf o treści ${q(`${cap(colDef(ctx.theme, spec.fields[catIdx]).label)}: <${spec.fields[catIdx].c}>`)}`] : []),
              `paragraf o treści ${q(`${cap(vCol.label)}: <${spec.fields[valIdx].c}>${unit}`)}; gdy wartość pola ${spec.fields[valIdx].c} jest większa niż ${st.threshold}, treść paragrafu jest zapisana w znaczniku oznaczającym tekst ważny (strong)`,
            ],
          }],
      }],
    };
  },
};

// ---------------------------------------------------------------------------
// JavaScript
// ---------------------------------------------------------------------------

export const jsTabs = {
  id: 'jsTabs',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ names: ctx.theme.nav.slice(0, 3) }),
  render: (ctx, st, num) => {
    const texts = [ctx.theme.paragraph, `Telefon: ${ctx.theme.contact.phone}`, `E-mail: ${ctx.theme.contact.email}`];
    const html = `${st.names.map((n, i) => `<button onclick="pokazZakladke(${i + 1})">${h(n)}</button>`).join('\n')}\n${st.names.map((n, i) => `<div id="zakladka${i + 1}"${i ? ' style="display: none"' : ''}>\n<h3>${h(n)}</h3>\n<p>${h(texts[i])}</p>\n</div>`).join('\n')}`;
    const js = [
      'function pokazZakladke(numer) {',
      `    for (let i = 1; i <= ${st.names.length}; i++) {`,
      "        document.getElementById('zakladka' + i).style.display = 'none';",
      '    }',
      "    document.getElementById('zakladka' + numer).style.display = 'block';",
      '}',
    ].join('\n');
    return {
      lines: [`trzy przyciski o treściach ${st.names.map(q).join(', ')}; kliknięcie przycisku uruchamia skrypt ${num.s[0]}`,
        {
          text: 'trzy bloki (zakładki), każdy z nagłówkiem trzeciego stopnia o treści takiej jak przycisk oraz paragrafem:',
          children: st.names.map((n, i) => `zakładka ${q(n)}: ${q(texts[i])}`),
        },
        'w stanie początkowym widoczna jest jedynie pierwsza zakładka'],
      html,
      js,
      tags: ['button', 'div', 'h3', 'p'],
      scripts: [{ lines: ['wywoływany po kliknięciu dowolnego przycisku zakładki', 'ukrywa wszystkie zakładki', 'pokazuje jedynie zakładkę, której przycisk wybrano (sposób wyświetlania blokowy)'] }],
    };
  },
};

export const jsSlideshow = {
  id: 'jsSlideshow',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ files: [ctx.theme.images.main, ...ctx.theme.images.extra].slice(0, 4) }),
  render: (ctx, st, num) => {
    const n = st.files.length;
    const html = `<img src="${st.files[0]}" alt="Zdjęcie" id="zdjecie">\n<p>\n<button onclick="zmienZdjecie(-1)">Poprzednie</button>\n<button onclick="zmienZdjecie(1)">Następne</button>\n</p>`;
    const js = [
      `const zdjecia = [${st.files.map((f) => `'${f}'`).join(', ')}];`,
      'let aktualne = 0;',
      '',
      'function zmienZdjecie(krok) {',
      '    aktualne = aktualne + krok;',
      '    if (aktualne >= zdjecia.length) {',
      '        aktualne = 0;',
      '    }',
      '    if (aktualne < 0) {',
      '        aktualne = zdjecia.length - 1;',
      '    }',
      "    document.getElementById('zdjecie').src = zdjecia[aktualne];",
      '}',
    ].join('\n');
    return {
      lines: [`obraz ${st.files[0]} z tekstem alternatywnym ${q('Zdjęcie')}`,
        `paragraf z przyciskami ${q('Poprzednie')} i ${q('Następne')}, uruchamiającymi skrypt ${num.s[0]}`],
      html,
      js,
      tags: ['img', 'p', 'button'],
      files: st.files,
      scripts: [{
        lines: [`przechowuje w tablicy nazwy ${n} zdjęć: ${st.files.join(', ')}`,
          'przycisk „Następne” wyświetla kolejne zdjęcie z tablicy; po ostatnim zdjęciu wyświetlane jest pierwsze',
          'przycisk „Poprzednie” wyświetla poprzednie zdjęcie; przed pierwszym zdjęciem wyświetlane jest ostatnie'],
      }],
    };
  },
};

export const jsTodo = {
  id: 'jsTodo',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ title: ctx.rng.pick(['Lista zadań', 'Do zrobienia', 'Notatki']) }),
  render: (ctx, st, num) => {
    const html = `<h3>${st.title}</h3>\n<label for="zadanie">Nowe zadanie:</label>\n<input type="text" id="zadanie">\n<button onclick="dodajZadanie()">Dodaj</button>\n<ul id="zadania"></ul>`;
    const js = [
      'function dodajZadanie() {',
      "    const pole = document.getElementById('zadanie');",
      "    if (pole.value.trim() === '') {",
      '        return;',
      '    }',
      "    const element = document.createElement('li');",
      '    element.innerHTML = pole.value;',
      '    element.onclick = function () {',
      "        element.style.textDecoration = element.style.textDecoration === 'line-through' ? 'none' : 'line-through';",
      '    };',
      "    document.getElementById('zadania').appendChild(element);",
      "    pole.value = '';",
      '}',
    ].join('\n');
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q(st.title)}`, `etykieta ${q('Nowe zadanie:')} powiązana z polem edycyjnym`, `przycisk ${q('Dodaj')}, uruchamiający skrypt ${num.s[0]}`, 'pusta lista punktowana'],
      html,
      js,
      tags: ['h3', 'label', 'input', 'button', 'ul', 'li'],
      scripts: [{
        lines: ['po kliknięciu przycisku pobiera tekst z pola edycyjnego; jeżeli pole jest puste, nic nie robi',
          'tworzy nowy element listy z pobranym tekstem i dodaje go na końcu listy, a następnie czyści pole edycyjne',
          'kliknięcie elementu listy przekreśla jego tekst; ponowne kliknięcie usuwa przekreślenie'],
      }],
    };
  },
};

export const jsVisitCounter = {
  id: 'jsVisitCounter',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ key: `licznik_${ctx.theme.id}` }),
  render: (ctx, st, num) => {
    const js = [
      'function licznik() {',
      `    let odwiedziny = Number(localStorage.getItem('${st.key}')) || 0;`,
      '    odwiedziny++;',
      `    localStorage.setItem('${st.key}', odwiedziny);`,
      "    document.getElementById('licznik').innerHTML = 'Liczba odwiedzin: ' + odwiedziny;",
      '}',
      "window.addEventListener('load', licznik);",
    ].join('\n');
    return {
      lines: [`paragraf, w którym skrypt ${num.s[0]} wyświetla liczbę odwiedzin strony`],
      html: '<p id="licznik"></p>',
      js,
      tags: ['p'],
      scripts: [{ lines: ['wykonywany po załadowaniu strony', `korzysta z obiektu localStorage, w którym pod kluczem ${q(st.key)} przechowuje licznik wyświetleń strony`, 'przy każdym wyświetleniu strony zwiększa licznik o 1', `wypisuje w paragrafie tekst ${q('Liczba odwiedzin: <licznik>')}`] }],
    };
  },
};

export const jsSummaryForm = {
  id: 'jsSummaryForm',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ options: ctx.theme.nav.slice(0, 3) }),
  render: (ctx, st, num) => {
    const html = `<h3>Zgłoszenie</h3>\n<label for="imieNazwisko">Imię i nazwisko:</label>\n<input type="text" id="imieNazwisko"><br>\n<label for="adres">E-mail:</label>\n<input type="email" id="adres"><br>\n<label for="usluga">Usługa:</label>\n<select id="usluga">\n${st.options.map((o) => `<option>${h(o)}</option>`).join('\n')}\n</select><br>\n<button onclick="podsumuj()">Wyślij</button>\n<hr>\n<p id="podsumowanie"></p>`;
    const js = [
      'function podsumuj() {',
      "    const osoba = document.getElementById('imieNazwisko').value.toUpperCase();",
      "    const email = document.getElementById('adres').value.toLowerCase();",
      "    const usluga = document.getElementById('usluga').value;",
      "    document.getElementById('podsumowanie').innerHTML = osoba + '<br>' + email + '<br>Usługa: ' + usluga;",
      '}',
    ].join('\n');
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q('Zgłoszenie')}`,
        `etykieta ${q('Imię i nazwisko:')} powiązana z polem edycyjnym`,
        `etykieta ${q('E-mail:')} powiązana z polem do wpisywania adresu e-mail`,
        `etykieta ${q('Usługa:')} powiązana z listą rozwijaną z opcjami: ${st.options.map(q).join(', ')}`,
        `przycisk ${q('Wyślij')}, uruchamiający skrypt ${num.s[0]}`,
        'linia pozioma, a pod nią pusty paragraf'],
      html,
      js,
      tags: ['h3', 'label', 'input', 'select', 'option', 'button', 'hr', 'p', 'br'],
      scripts: [{
        lines: ['pobiera wartości wprowadzone do kontrolek',
          {
            text: 'wyświetla w paragrafie pod linią poziomą, w trzech wierszach:',
            children: ['imię i nazwisko zapisane wielkimi literami', 'adres e-mail zapisany małymi literami', `napis ${q('Usługa: ')}, a następnie wybraną opcję listy rozwijanej`],
          }],
      }],
    };
  },
};

export const jsColorButtons = {
  id: 'jsColorButtons',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ colors: ctx.rng.pick([[['czerwony', 'red'], ['zielony', 'green'], ['niebieski', 'blue']], [['granatowy', 'navy'], ['bordowy', 'maroon'], ['fioletowy', 'purple']]]) }),
  render: (ctx, st, num) => {
    const html = `<label for="rozmiar">Rozmiar tekstu w %:</label>\n<input type="number" id="rozmiar" value="100">\n<p>${st.colors.map(([pl, en]) => `<button onclick="formatuj('${en}')">${pl}</button>`).join('\n')}</p>\n<p id="przyklad">${h(ctx.theme.paragraph)}</p>`;
    const js = [
      'function formatuj(kolor) {',
      "    const akapit = document.getElementById('przyklad');",
      '    akapit.style.color = kolor;',
      "    akapit.style.fontSize = document.getElementById('rozmiar').value + '%';",
      '}',
    ].join('\n');
    return {
      lines: [`etykieta ${q('Rozmiar tekstu w %:')} powiązana z polem liczbowym o wartości początkowej 100`,
        `paragraf z trzema przyciskami o treściach ${st.colors.map(([pl]) => q(pl)).join(', ')}, uruchamiającymi skrypt ${num.s[0]}`,
        `paragraf o treści ${q(ctx.theme.paragraph)}`],
      html,
      js,
      tags: ['label', 'input', 'p', 'button'],
      scripts: [{
        lines: [`po kliknięciu przycisku zmienia kolor tekstu ostatniego paragrafu na kolor z napisu przycisku (${st.colors.map(([pl, en]) => `${pl} – ${en}`).join(', ')})`,
          'dodatkowo ustawia rozmiar czcionki tego paragrafu na wartość z pola liczbowego wyrażoną w procentach (np. 150 → 150%)'],
      }],
    };
  },
};

// ---------------------------------------------------------------------------
// Smaczki z arkuszy 2024-2026
// ---------------------------------------------------------------------------

const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

export const phpDateInfo = {
  id: 'phpDateInfo',
  server: true,
  scripts: 1,
  plan: (ctx) => ({ prefix: ctx.rng.pick(['Dzisiaj jest', 'Witamy! Dziś jest']) }),
  render: (ctx, st, num) => {
    const sample = new Date(Date.UTC(2026, 5, 15));
    const d = `${String(sample.getUTCDate()).padStart(2, '0')}.${String(sample.getUTCMonth() + 1).padStart(2, '0')}.${sample.getUTCFullYear()}`;
    const code = phpBlock([
      `$dni = [${DNI.map((x) => `'${x}'`).join(', ')}];`,
      "$dzien = $dni[date('w')];",
      "$data = date('d.m.Y');",
      `echo "<p>${st.prefix} $dzien, $data</p>";`,
    ].join('\n'));
    return {
      lines: [`paragraf z efektem działania skryptu ${num.s[0]}`],
      html: code,
      preview: `<p>${h(st.prefix)} ${DNI[sample.getUTCDay()]}, ${d}</p>`,
      previewNote: 'przykładowa data',
      tags: ['p'],
      scripts: [{
        lines: [`wyświetla w paragrafie tekst ${q(`${st.prefix} <dzień tygodnia>, <data>`)}`,
          '<dzień tygodnia> to słowny zapis bieżącego dnia tygodnia w języku polskim, małymi literami (np. poniedziałek); można wykorzystać tablicę z nazwami dni i funkcję date',
          '<data> to bieżąca data serwera w formacie DD.MM.RRRR'],
      }],
    };
  },
};

export const phpDefList = {
  id: 'phpDefList',
  server: true,
  scripts: 1,
  plan: (ctx) => {
    const ref = ctx.registry.request(['topN', 'filterCatSorted', 'joinParent', 'numCompare', 'like']);
    return ref && ref.result.spec.fields.length >= 2 && { ref };
  },
  render: (ctx, st, num) => {
    const { spec } = st.ref.result;
    const fields = spec.fields;
    const labels = fields.map((f) => colDef(ctx.theme, f)?.label || f.c);
    const res = execute(spec, ctx.db);
    const ddPhp = fields.slice(1).map((f, i) => `${labels[i + 1]}: $wiersz[${i + 1}]`).join(', ');
    return {
      lines: [`lista definicji (dl) wypełniona przez skrypt ${num.s[0]}`],
      html: `<dl>\n${phpBlock(phpQueryLoop(spec, [`echo "<dt>$wiersz[0]</dt>";`, `echo "<dd>${ddPhp}</dd>";`]))}\n</dl>`,
      preview: `<dl>\n${res.rows.map((r) => `<dt>${h(String(r[0]))}</dt><dd>${fields.slice(1).map((f, i) => `${h(labels[i + 1])}: ${fmtCell(r[i + 1])}`).join(', ')}</dd>`).join('\n')}\n</dl>`,
      tags: ['dl', 'dt', 'dd'],
      scripts: [{
        lines: [`wysyła do bazy danych zapytanie ${num.q[0]}`,
          `dla każdego zwróconego wiersza tworzy termin listy definicji (dt) z polem ${fields[0].c} oraz element definicji (dd) według wzoru: ${q(fields.slice(1).map((f, i) => `${labels[i + 1]}: <${f.c}>`).join(', '))}`],
      }],
    };
  },
};

export const jsRandomFact = {
  id: 'jsRandomFact',
  client: true,
  scripts: 1,
  plan: (ctx) => {
    const t = ctx.S.main;
    const n = labelCol(t);
    const c = ctx.S.col(t, 'cat') || ctx.S.col(t, 'num');
    const facts = ctx.rng.sample(ctx.db.data[t.name], 4).map((r) => `${r[n.name]} – ${c.label}: ${r[c.name]}`);
    return { facts };
  },
  render: (ctx, st, num) => {
    const js = [
      'const ciekawostki = [',
      ...st.facts.map((f) => `    '${f}',`),
      '];',
      '',
      'function losujCiekawostke() {',
      '    const indeks = Math.floor(Math.random() * ciekawostki.length);',
      "    document.getElementById('ciekawostka').innerHTML = ciekawostki[indeks];",
      '}',
    ].join('\n');
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q('Czy wiesz, że...')}`, `przycisk ${q('Losuj ciekawostkę')}, którego kliknięcie uruchamia skrypt ${num.s[0]}`, 'pusty paragraf na ciekawostkę'],
      html: `<h3>Czy wiesz, że...</h3>\n<button onclick="losujCiekawostke()">Losuj ciekawostkę</button>\n<p id="ciekawostka"></p>`,
      js,
      tags: ['h3', 'button', 'p'],
      scripts: [{
        lines: [{ text: `zawiera tablicę ${st.facts.length} napisów:`, children: st.facts.map((f) => q(f)) },
          `po kliknięciu przycisku losuje liczbę całkowitą z przedziału od 0 do ${st.facts.length - 1} (indeks tablicy) i wyświetla w paragrafie wylosowany napis`],
      }],
    };
  },
};

export const jsHoverSwap = {
  id: 'jsHoverSwap',
  client: true,
  scripts: 1,
  plan: (ctx) => ({ a: ctx.theme.images.extra[0], b: ctx.theme.images.extra[1] }),
  render: (ctx, st, num) => {
    const js = [
      'function pokazDrugi(obraz) {',
      `    obraz.src = '${st.b}';`,
      '}',
      '',
      'function pokazPierwszy(obraz) {',
      `    obraz.src = '${st.a}';`,
      '}',
    ].join('\n');
    return {
      lines: [`obraz ${st.a} z tekstem alternatywnym ${q('Zdjęcie')} i podpowiedzią ${q('Najedź, aby zobaczyć więcej')}; najechanie i opuszczenie obrazu kursorem uruchamia skrypt ${num.s[0]}`],
      html: `<img src="${st.a}" alt="Zdjęcie" title="Najedź, aby zobaczyć więcej" id="podmiana" onmouseover="pokazDrugi(this)" onmouseout="pokazPierwszy(this)">`,
      js,
      tags: ['img'],
      files: [st.a, st.b],
      scripts: [{ lines: [`po najechaniu kursorem na obraz wyświetlany jest obraz ${st.b}`, `po opuszczeniu obrazu przez kursor ponownie wyświetlany jest obraz ${st.a}`] }],
    };
  },
};

export const jsBlurValidate = {
  id: 'jsBlurValidate',
  client: true,
  scripts: 1,
  plan: () => ({}),
  render: (ctx, st, num) => {
    const fields = [['regImie', 'Imię', 'wpisz imię...'], ['regNazwisko', 'Nazwisko', 'wpisz nazwisko...'], ['regTelefon', 'Telefon', 'np. 600 100 200']];
    const html = `<h3>Rejestracja</h3>\n${fields.map(([id, l, ph]) => `<label for="${id}">${l}:</label>\n<input type="text" id="${id}" name="${l.toLowerCase()}" placeholder="${ph}" onblur="sprawdzPole(this)"><br>`).join('\n')}\n<p id="stanPol"></p>`;
    const js = [
      'function sprawdzPole(pole) {',
      "    if (pole.value.trim() === '') {",
      "        pole.style.border = '2px solid red';",
      "        document.getElementById('stanPol').innerHTML = 'Pole ' + pole.name + ' jest wymagane';",
      '    } else {',
      "        pole.style.border = '2px solid green';",
      "        document.getElementById('stanPol').innerHTML = '';",
      '    }',
      '}',
    ].join('\n');
    return {
      lines: [`nagłówek trzeciego stopnia o treści ${q('Rejestracja')}`,
        ...fields.map(([, l, ph]) => `etykieta ${q(`${l}:`)} powiązana z polem edycyjnym z podpowiedzią (placeholder) ${q(ph)}`),
        `utrata fokusu przez dowolne pole uruchamia skrypt ${num.s[0]}`, 'pusty paragraf na komunikat'],
      html,
      js,
      tags: ['h3', 'label', 'input', 'p', 'br'],
      scripts: [{
        lines: ['wywoływany po utracie fokusu przez pole edycyjne (zdarzenie blur)',
          `gdy pole jest puste, ustawia jego obramowanie na 2 px czerwoną linią ciągłą i wypisuje w paragrafie ${q('Pole <nazwa> jest wymagane')}, gdzie <nazwa> to atrybut name pola (imię, nazwisko, telefon)`,
          'gdy pole jest wypełnione, ustawia obramowanie na 2 px zieloną linią ciągłą i czyści paragraf'],
      }],
    };
  },
};

export const staticMergedTable = {
  id: 'staticMergedTable',
  plan: (ctx) => {
    const t = ctx.S.main;
    const cat = ctx.S.col(t, 'cat');
    const val = ctx.S.col(t, 'price') || ctx.S.col(t, 'num');
    if (!cat || !val) return null;
    const n = labelCol(t);
    const groups = ctx.rng.sample(cat.values.filter((v) => ctx.db.data[t.name].filter((r) => r[cat.name] === v).length >= 2), 2);
    if (groups.length < 2) return null;
    const rows = groups.map((g) => ({ g, items: ctx.db.data[t.name].filter((r) => r[cat.name] === g).slice(0, 2).map((r) => [r[n.name], val.type.startsWith('DECIMAL') ? Number(r[val.name]).toFixed(2) : r[val.name]]) }));
    return { headers: [cap(cat.label), cap(n.label), cap(val.label)], rows };
  },
  render: (ctx, st) => {
    const body = st.rows.map((g) => g.items.map((it, i) => `<tr>${i === 0 ? `<td rowspan="2">${h(g.g)}</td>` : ''}<td>${h(it[0])}</td><td>${h(it[1])}</td></tr>`).join('\n')).join('\n');
    return {
      lines: [{
        text: 'tabela z trzema kolumnami i pięcioma wierszami; w pierwszej kolumnie komórki scalone w pionie po dwa wiersze:',
        children: [`pierwszy wiersz: komórki nagłówkowe ${st.headers.map(q).join(', ')}`,
          ...st.rows.map((g) => `scalona komórka ${q(g.g)}, a obok wiersze: ${g.items.map((it) => `${q(it[0])} – ${q(it[1])}`).join('; ')}`)],
      }],
      html: `<table>\n<tr>${st.headers.map((x) => `<th>${h(x)}</th>`).join('')}</tr>\n${body}\n</table>`,
      tags: ['table', 'tr', 'th', 'td'],
    };
  },
};

export const EXTRA_WIDGETS = { phpDateInfo, phpDefList, jsRandomFact, jsHoverSwap, jsBlurValidate, staticMergedTable, phpSearchLike, phpUpdateForm, phpTemplateList, phpRowBlocks, jsTabs, jsSlideshow, jsTodo, jsVisitCounter, jsSummaryForm, jsColorButtons };
