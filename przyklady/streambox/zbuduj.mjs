// Buduje arkusz egzaminacyjny "StreamBox" (styl INF.03) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/streambox/zbuduj.mjs
// Wejście: dla_zdajacego/streambox.sql, rozwiazanie/* (w tym podglad.html - wynik działania index.php z bazą).
// Wyjście: arkusz.html, klucz.html.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { wrapDocument, SHEET_CSS, renderLines } from '../../js/core/sheet.js';
import { schemaSvg } from '../../js/core/db.js';
import { escapeHtml as h } from '../../js/core/util.js';

const DIR = fileURLToPath(new URL('.', import.meta.url));
const read = (p) => readFileSync(join(DIR, p), 'utf8');
const sol = (f) => read(`rozwiazanie/${f}`);
const logoUri = `data:image/png;base64,${readFileSync(join(DIR, 'rozwiazanie/logo.png')).toString('base64')}`;

const ARCHIWUM = { nazwa: 'streambox', haslo: 'Str3@mB0x!' };
const KOD = 'INF.03-SB-SG';

// ---------- ilustracje ----------

// Podgląd strony: wynik PHP z bazy + styl + skrypt + logo wstawione do dokumentu.
const podglad = sol('podglad.html')
  // w ramce podglądu 80vh rosłoby razem z wysokością ramki - ustalamy wysokość banera jak dla okna 700 px
  .replace('<link rel="stylesheet" href="styl.css">', `<style>html{-webkit-print-color-adjust:exact;print-color-adjust:exact}\n${sol('styl.css')}\n.hero{min-height:560px}</style>`)
  .replace('<script src="skrypt.js"></script>', `<script>${sol('skrypt.js')}</script>`)
  .replace('src="logo.png"', `src="${logoUri}"`);
const srcdoc = (html) => html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const schema = schemaSvg({
  tables: [
    { name: 'kategorie', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'nazwa', type: 'VARCHAR(40)' }] },
    {
      name: 'produkcje',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'tytul', type: 'VARCHAR(60)' }, { name: 'rok', type: 'INT' }, { name: 'typ', type: 'VARCHAR(10)' },
        { name: 'gatunek', type: 'VARCHAR(20)' }, { name: 'dopasowanie', type: 'INT' }, { name: 'opis', type: 'TEXT' }, { name: 'kolor', type: 'VARCHAR(2)' },
        { name: 'kategorie_id', type: 'INT', role: 'fk', ref: 'kategorie' }],
    },
  ],
});

const uklad = (() => {
  const W = 340;
  const box = (y, hgt, label, extra = '') => `<rect x="4" y="${y}" width="${W - 8}" height="${hgt}" fill="#fff" stroke="#222" stroke-width="1.5" ${extra}/><text x="${W / 2}" y="${y + hgt / 2 + 4}" font-size="12" text-anchor="middle">${label}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 300" width="${W}" height="300" font-family="Arial, sans-serif">
    ${box(4, 34, 'pasek nawigacyjny (header.pasek, przyklejony u góry)', 'stroke-dasharray="5 3"')}
    ${box(42, 110, 'baner (section.hero)')}
    ${box(156, 90, 'blok główny (main) – rzędy kafelków')}
    ${box(250, 44, 'stopka (footer.stopka)')}
  </svg>`;
})();

const KOLORY = [['k1', '#FF7E5F', '#8E2DE2'], ['k2', '#00B4DB', '#0B3D91'], ['k3', '#11998E', '#1D4350'], ['k4', '#F7971E', '#A8261C'], ['k5', '#8360C3', '#2EBF91'], ['k6', '#CB2D3E', '#1F1C2C']];

// ---------- treść arkusza ----------

const zapytania = [
  'Zapytanie 1: wybierające jedynie tytuł, rok, typ, gatunek, dopasowanie i opis produkcji o najwyższym dopasowaniu. Należy wybrać jedynie jeden rekord',
  'Zapytanie 2: wybierające jedynie identyfikatory i nazwy wszystkich kategorii',
  'Zapytanie 3: wybierające jedynie tytuł i kolor produkcji należących do kategorii o identyfikatorze 2',
  'Zapytanie 4: wybierające jedynie nazwę kategorii oraz liczbę produkcji w tej kategorii; kolumna z liczbą ma nazwę (alias) „liczba”. Należy posłużyć się relacją',
  'Zapytanie 5: tworzące użytkownika widz na serwerze localhost z hasłem Str3am!B0x, a następnie nadające mu jedynie prawo do przeglądania danych (SELECT) w tabeli produkcje bazy streambox',
];

const cechy = [
  'Składa się ze strony o nazwie index.php',
  'Zapisana w języku HTML5',
  'Zadeklarowany polski język zawartości witryny',
  'Jawnie zastosowany właściwy standard kodowania polskich znaków',
  'Znacznik meta ustawiający szerokość widoku strony na szerokość urządzenia (viewport: width=device-width, initial-scale=1.0)',
  'Tytuł strony widoczny na karcie przeglądarki: „StreamBox – filmy i seriale”',
  'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony',
  'Podział strony na bloki zrealizowany za pomocą semantycznych znaczników HTML5 zgodnie z ilustracją 5: pasek nawigacyjny – header z klasą pasek, baner – section z klasą hero, blok główny – main, stopka – footer z klasą stopka',
  {
    text: 'Zawartość paska nawigacyjnego, kolejno:',
    children: [
      'obraz logo.png z tekstem alternatywnym „StreamBox” i przypisaną klasą logo',
      'blok nawigacyjny (nav), a w nim lista punktowana (nieuporządkowana) z pięcioma odnośnikami: „Strona główna” prowadzący do index.php oraz „Seriale”, „Filmy”, „Nowe i popularne”, „Moja lista” prowadzące do adresu #',
      'odnośnik o treści „Zaloguj się” prowadzący do adresu #, z przypisanymi klasami btn i btn-czerwony',
    ],
  },
  {
    text: 'Zawartość banera: blok div z klasą hero-tresc, a w nim:',
    children: [
      'efekt działania skryptu 1',
      'blok div z klasą przyciski, zawierający odnośnik „▶ Odtwórz” (adres #, klasy btn i btn-bialy) oraz przycisk (znacznik button) „ⓘ Więcej informacji” z klasami btn i btn-szary oraz identyfikatorem przyciskOpis; kliknięcie przycisku uruchamia skrypt 3',
    ],
  },
  'Zawartość bloku głównego: efekt działania skryptu 2',
  {
    text: 'Zawartość stopki:',
    children: [
      'paragraf o treści „Masz pytania? Zadzwoń: 800 000 000”',
      'lista punktowana z pięcioma odnośnikami prowadzącymi do adresu #: „Często zadawane pytania”, „Centrum pomocy”, „Warunki korzystania”, „Prywatność”, „Kontakt”',
      'paragraf o treści „Stronę wykonał: ”, dalej wstawiony numer zdającego',
    ],
  },
];

const css = [
  'Domyślnie dla wszystkich selektorów (*): marginesy zewnętrzne i wewnętrzne 0, model pudełkowy border-box (szerokość i wysokość obejmują marginesy wewnętrzne i obramowanie)',
  'Dla selektora ciała strony: kolor tła #141414, biały kolor czcionki, krój czcionki Arial, w przypadku braku Helvetica, a następnie sans-serif, wysokość linii 1,5',
  'Dla selektora odnośnika: kolor czcionki dziedziczony z elementu nadrzędnego (inherit), tekst bez podkreślenia; dla selektora listy punktowanej: brak punktora',
  'Dla klasy pasek: pozycja stała, przyklejona do lewego górnego rogu okna (góra 0, lewo 0), szerokość 100%, kolejność warstw (z-index) 10, sposób wyświetlania elastyczny (flex), elementy wyśrodkowane w pionie, odstęp między elementami 32 px, marginesy wewnętrzne: górny i dolny 16 px, lewy i prawy 4%, tło – gradient pionowy od koloru czarnego o nieprzezroczystości 0,85 do koloru przezroczystego',
  'Dla klasy logo: wysokość 40 px. Dla bloku nawigacyjnego w pasku: zajmuje całe pozostałe miejsce w pasku (flex: 1); lista w tym bloku: sposób wyświetlania elastyczny, odstęp między elementami 20 px',
  'Dla odnośników w bloku nawigacyjnym paska: kolor czcionki #E5E5E5; gdy kursor znajdzie się na odnośniku, kolor czcionki zmienia się na biały',
  'Dla klasy btn: sposób wyświetlania liniowo-blokowy, marginesy wewnętrzne: górny i dolny 8 px, lewy i prawy 18 px, brak obramowania, zaokrąglenie rogów 4 px, pogrubienie czcionki, rozmiar czcionki 16 px, biały kolor czcionki, kursor w kształcie wskazującej dłoni; gdy kursor znajdzie się na elemencie z klasą btn, jego nieprzezroczystość wynosi 0,8',
  'Dla klas przycisków: btn-czerwony – kolor tła #E11D48; btn-bialy – biały kolor tła i czarny kolor czcionki; btn-szary – kolor tła rgba(109, 109, 110, 0.7)',
  'Dla klasy hero: minimalna wysokość 80% wysokości okna (80vh), sposób wyświetlania elastyczny, zawartość wyśrodkowana w pionie, marginesy wewnętrzne: lewy i prawy 4%, górny i dolny 0, tło – gradient ukośny (135 stopni) przechodzący kolejno przez kolory #1B2A49, #5C1A3A, #0B0B0B',
  'Dla klasy hero-tresc: maksymalna szerokość 520 px, górny margines zewnętrzny 60 px; dla nagłówka pierwszego stopnia w banerze: rozmiar czcionki 300%',
  'Dla klasy meta: kolor czcionki #46D369, pogrubienie; dla klasy opis: kolor czcionki #E5E5E5, w stanie początkowym element jest ukryty (sposób wyświetlania none). Dla klasy przyciski: sposób wyświetlania elastyczny, odstęp między elementami 12 px, górny margines zewnętrzny 24 px',
  'Dla bloku głównego: marginesy wewnętrzne: górny 20 px, dolny 40 px, lewy i prawy 0; dla klasy rzad: marginesy wewnętrzne: lewy i prawy 4%, dolny margines zewnętrzny 32 px. Dla klasy kafelki: sposób wyświetlania elastyczny, odstęp między elementami 8 px, poziomy pasek przewijania widoczny jedynie wtedy, gdy kafelki nie mieszczą się w bloku, marginesy wewnętrzne: górny 10 px, dolny 20 px',
  'Dla klasy kafel: stała szerokość 220 px bez rozciągania i zwężania (flex: 0 0 220px), wysokość 124 px, sposób wyświetlania elastyczny z zawartością przy dolnej krawędzi (align-items: flex-end), marginesy wewnętrzne 10 px, zaokrąglenie rogów 4 px, pogrubienie czcionki, kursor w kształcie wskazującej dłoni, płynne przejście (transition) transformacji trwające 0,25 s',
  'Dla tekstu (span) w kafelku: cień tekstu przesunięty o 0 px w poziomie i 1 px w pionie, rozmycie 4 px, kolor czarny; gdy kursor znajdzie się na kafelku, kafelek jest powiększany 1,1 raza (transformacja skali)',
  'Dla klas k1–k6: tło – gradient ukośny (135 stopni) między kolorami podanymi w tabeli 2',
  'Dla klasy stopka: marginesy wewnętrzne: górny i dolny 40 px, lewy i prawy 4%, kolor czcionki #8C8C8C, górne obramowanie linią ciągłą 1 px w kolorze #333333; lista w stopce: sposób wyświetlania elastyczny z zawijaniem do kolejnego wiersza (flex-wrap), odstępy między elementami 12 px w pionie i 32 px w poziomie, marginesy zewnętrzne: górny i dolny 16 px; gdy kursor znajdzie się na odnośniku w stopce, tekst jest podkreślony',
  'W przypadku ekranów o szerokości do 768 px (ilustracja 4): blok nawigacyjny w pasku jest ukryty, elementy paska są rozsunięte do krawędzi (justify-content: space-between), nagłówek pierwszego stopnia w banerze ma rozmiar czcionki 200%, a elementy bloku przyciski są ułożone jeden pod drugim (flex-direction: column)',
];

const skrypty = {
  php: [
    { nr: 1, lines: ['wysyła do bazy danych zapytanie 1', 'wyświetla tytuł w nagłówku pierwszego stopnia', 'wyświetla paragraf z klasą meta o treści „<dopasowanie>% dopasowania · <rok> · <typ> · <gatunek>”, gdzie w znakach <> zapisano pola zwrócone zapytaniem (separator to kropka środkowa „·” otoczona spacjami)', 'wyświetla paragraf z klasą opis i identyfikatorem opis, zawierający pole opis'] },
    {
      nr: 2,
      lines: ['wysyła do bazy danych zapytanie 2',
        { text: 'dla każdej zwróconej kategorii tworzy blok section z klasą rzad, a w nim:', children: ['nagłówek drugiego stopnia z nazwą kategorii', 'blok div z klasą kafelki wypełniony rekordami zwróconymi przez zmodyfikowane zapytanie 3 – wybierane są produkcje kategorii o identyfikatorze bieżącego rekordu kategorii'] },
        'każda produkcja jest wyświetlana jako element article z dwiema klasami: kafel oraz klasą równą wartości pola kolor (np. „kafel k3”); w elemencie article znajduje się element span z tytułem produkcji'],
    },
  ],
  js: [{ nr: 3, lines: ['wywoływany po kliknięciu przycisku „ⓘ Więcej informacji”', 'gdy paragraf z identyfikatorem opis jest ukryty – wyświetla go (sposób wyświetlania blokowy) i zmienia napis na przycisku na „ⓘ Mniej informacji”', 'gdy paragraf jest widoczny – ukrywa go i przywraca napis „ⓘ Więcej informacji”'] }],
};

const MYSQLI = [
  ['mysqli_connect(serwer, użytkownik, hasło, nazwa_bazy)', 'id połączenia lub FALSE, gdy niepowodzenie'],
  ['mysqli_query(id_polaczenia, zapytanie)', 'Wynik zapytania'],
  ['mysqli_fetch_row(wynik_zapytania)', 'Tablica numeryczna odpowiadająca wierszowi zapytania'],
  ['mysqli_fetch_array(wynik_zapytania)', 'Tablica z kolejnym wierszem wyniku lub FALSE, gdy nie ma więcej wierszy'],
  ['mysqli_num_rows(wynik_zapytania)', 'Liczba wierszy w wyniku zapytania'],
  ['mysqli_close(id_polaczenia)', 'TRUE/FALSE w zależności od stanu operacji'],
];
const FLEX = [
  ['display: flex', 'Elementy potomne układane są obok siebie (w wierszu)'],
  ['gap: 20px', 'Odstęp między elementami układu flex lub grid'],
  ['flex: 1', 'Element zajmuje całe pozostałe wolne miejsce'],
  ['flex: 0 0 220px', 'Element ma stałą szerokość 220 px – nie rośnie i nie maleje'],
  ['align-items: center | flex-end', 'Wyrównanie elementów w pionie (do środka / do dołu)'],
  ['justify-content: space-between', 'Pierwszy i ostatni element przy krawędziach, reszta równomiernie'],
  ['flex-wrap: wrap', 'Elementy przenoszone do kolejnego wiersza, gdy brakuje miejsca'],
  ['flex-direction: column', 'Elementy układane jeden pod drugim'],
  ['position: fixed; top: 0; left: 0', 'Element przyklejony do okna przeglądarki, nie przewija się ze stroną'],
  ['overflow-x: auto', 'Poziomy pasek przewijania tylko wtedy, gdy zawartość się nie mieści'],
  ['transform: scale(1.1)', 'Powiększenie elementu 1,1 raza'],
  ['transition: transform 0.25s', 'Płynne przejście zmiany transformacji w czasie 0,25 s'],
  ['linear-gradient(to bottom, kolor1, kolor2)', 'Gradient pionowy; dla gradientu ukośnego: linear-gradient(135deg, …)'],
  ['@media (max-width: 768px) { … }', 'Reguły stosowane tylko dla okien o szerokości do 768 px'],
];
const DOM = [
  ['document.getElementById(id)', 'element.innerHTML = "wartość"'],
  ['element.style.display = "block" | "none"', 'element.style.właściwość = "wartość"'],
  ['onclick', 'zdarzenie kliknięcia elementu'],
];

const table2 = (caption, head, rows, cls = 'help') => `<table class="${cls}"><caption>${h(caption)}</caption><tr>${head.map((x) => `<th>${h(x)}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const esc = (rows) => rows.map((r) => r.map(h));

const frame = (html, n, caption, width, scale) => `<figure class="preview"><div class="frame-wrap" style="width:${Math.round(width * scale)}px;max-width:100%;margin:0 auto" data-scale="${scale}"><iframe class="site" style="width:${width}px;transform:scale(${scale})" srcdoc="${srcdoc(html)}" title="Podgląd witryny"></iframe></div><figcaption>Ilustracja ${n}. ${h(caption)}</figcaption></figure>`;

const tytulowa = `<section class="page title-page">
  <div class="notice">Arkusz ćwiczeniowy przygotowany na zajęcia.<br>Nie jest oficjalnym arkuszem CKE.</div>
  <p class="meta">Nazwa kwalifikacji: <b>Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych</b><br>
  Symbol kwalifikacji: <b>INF.03</b><br>Zadanie: <b>StreamBox – serwis z filmami i serialami</b><br>Wersja arkusza: <b>SG</b></p>
  <div class="fill"><div class="fill-title">Wypełnia zdający</div>
    <div class="pesel"><span>Imię i nazwisko</span><span class="line"></span></div>
    <div class="pesel"><span>Numer z dziennika</span><span class="boxes"><i></i><i></i></span></div>
  </div>
  <div class="row-between"><span>Czas trwania egzaminu: <b>150 minut</b></span><span class="code">${KOD}</span></div>
  <div class="big">EGZAMIN ZAWODOWY – ARKUSZ ĆWICZENIOWY<br><small>CZĘŚĆ PRAKTYCZNA · PODSTAWA PROGRAMOWA 2019</small></div>
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

const zadanie = `<section class="page task">
  <h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową serwisu z filmami i serialami StreamBox, wykorzystując edytor grafiki rastrowej, pakiet XAMPP oraz edytor zaznaczający składnię.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>

  <h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera połączone relacją tabele przedstawione na ilustracji 1. Tabela kategorie opisuje kategorie (rzędy) serwisu. Tabela produkcje opisuje filmy i seriale: pole typ przyjmuje wartości ‘film’ lub ‘serial’, pole dopasowanie zawiera procent dopasowania do upodobań widza, a pole kolor – nazwę klasy CSS kafelka (od ‘k1’ do ‘k6’). Wszystkie tytuły są wymyślone.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>streambox</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku streambox.sql do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie PNG pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie streambox. Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie PNG i nadaj im nazwy kw1, kw2, kw3, kw4, kw5. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>

  <h3>Grafika</h3>
  <p>Wykonaj grafikę logo.png o cechach:</p>
  ${renderLines(['Zawartością jest napis STREAMBOX zapisany wielkimi literami, dowolną czcionką bezszeryfową, pogrubioną', 'Kolor napisu #E11D48', 'Tło przezroczyste', 'Wysokość grafiki 40 px; napis wypełnia w pionie całą grafikę, a w poziomie grafika jest przycięta do szerokości napisu', 'Grafika zapisana w formacie PNG'])}
  <figure><div class="logo-demo"><img src="${logoUri}" alt="logo StreamBox"></div><figcaption>Ilustracja 2. Grafika logo.png na tle przezroczystym (szachownica)</figcaption></figure>

  <h3>Witryna internetowa</h3>
  ${frame(podglad, 3, 'Wygląd witryny internetowej na ekranie o szerokości 1280 px; dane pochodzą z bazy', 1280, 0.5)}
  <div class="with-layout"><div>
  ${frame(podglad, 4, 'Wygląd witryny na ekranie o szerokości 400 px (po kliknięciu „ⓘ Więcej informacji”)', 400, 0.6).replace('<figure class="preview">', '<figure class="preview mobile" data-click="przyciskOpis">')}
  </div><figure class="layout">${uklad}<figcaption>Ilustracja 5. Układ bloków</figcaption></figure></div>
  <p>Cechy witryny:</p>
  ${renderLines(cechy)}

  <h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. W tabeli 3 zamieszczono pomoc do niektórych właściwości CSS. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(css)}
  <p class="note">Uwaga: styl CSS ciała strony, odnośnika i listy punktowanej należy zdefiniować wyłącznie przy pomocy selektora tych znaczników. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.</p>

  <h3>Skrypty działające po stronie serwera (PHP)</h3>
  <p>W tabeli 1 zamieszczono wybrane funkcje PHP do obsługi bazy danych. Wymagania dotyczące skryptów:</p>
  ${renderLines(['Napisane w języku PHP', 'Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim', 'Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie streambox', 'Na końcu zamykane jest połączenie z serwerem'])}
  ${skrypty.php.map((s) => `<p class="script-name">Skrypt ${s.nr}${s.nr === 1 ? ' (baner)' : ' (rzędy kafelków)'}:</p>${renderLines(s.lines.map((l) => (typeof l === 'string' ? l.charAt(0).toUpperCase() + l.slice(1) : l)))}`).join('')}
  <h3>Skrypt działający po stronie klienta (JavaScript)</h3>
  <p>W tabeli 4 zamieszczono wybrane pola i metody modelu DOM. Skrypt jest napisany w języku JavaScript (w pliku skrypt.js lub w znaczniku script), należy stosować znaczące nazewnictwo zmiennych i funkcji.</p>
  ${skrypty.js.map((s) => `<p class="script-name">Skrypt ${s.nr} (opis w banerze):</p>${renderLines(s.lines.map((l) => l.charAt(0).toUpperCase() + l.slice(1)))}`).join('')}

  <div class="help-tables">
  ${table2('Tabela 1. Wybór funkcji języka PHP do obsługi bazy MySQL i MariaDB', ['Funkcje biblioteki mysqli', 'Zwracana wartość'], esc(MYSQLI))}
  ${table2('Tabela 2. Gradienty kafelków (linear-gradient(135deg, kolor 1, kolor 2))', ['Klasa', 'Kolor 1', 'Kolor 2', 'Podgląd'], KOLORY.map(([k, a, b]) => [k, a, b, `<span class="swatch" style="background:linear-gradient(135deg, ${a}, ${b})"></span>`]))}
  ${table2('Tabela 3. Wybrane właściwości CSS', ['Zapis', 'Znaczenie'], esc(FLEX))}
  ${table2('Tabela 4. Wybrane pola i metody modelu DOM języka JavaScript', ['Wyszukiwanie i zdarzenia', 'Zmiana elementów'], esc(DOM))}
  </div>

  <p class="note">UWAGA: po zakończeniu pracy utwórz plik tekstowy o nazwie przeglądarka.txt. Zapisz w nim nazwę przeglądarki internetowej, w której weryfikowana była poprawność działania witryny. Umieść go w folderze z numerem zdającego.</p>
  <p>W folderze z numerem zdającego powinny znajdować się pliki: import.png, index.php, kw1.png, kw2.png, kw3.png, kw4.png, kw5.png, kwerendy.txt, logo.png, przeglądarka.txt, skrypt.js, styl.css, ewentualnie inne przygotowane pliki. Spakuj folder do archiwum ZIP o nazwie równej numerowi zdającego i prześlij je w sposób wskazany przez nauczyciela.</p>
  <p><b>Czas przeznaczony na wykonanie zadania wynosi 150 minut.</b></p>
  <p>Ocenie podlegać będzie 5 rezultatów:</p>
  ${renderLines(['operacje na bazie danych,', 'zawartość witryny internetowej,', 'działanie witryny internetowej,', 'styl CSS witryny internetowej,', 'skrypty.'])}
</section>`;

const EXTRA_CSS = `
.logo-demo { display: inline-block; padding: 14px 18px; background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 16px 16px; border: 1px solid #999; }
.logo-demo img { display: block; height: 40px; }
.swatch { display: inline-block; width: 90px; height: 22px; border-radius: 3px; vertical-align: middle; }
figure.preview.mobile .frame-wrap { height: 520px; }
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

writeFileSync(join(DIR, 'arkusz.html'), wrapDocument(`${KOD} – StreamBox – arkusz ćwiczeniowy`, `${tytulowa}\n${zadanie}`, SHEET_CSS + EXTRA_CSS, AUTOSIZE));

// ---------- klucz: zasady oceniania ----------

const wyniki = {
  1: 'widoczny jest dokładnie 1 wiersz: Noc nad Biebrzą, 2026, serial, Thriller, 98 oraz opis',
  2: 'widoczne są dokładnie 3 wiersze: 1 Popularne teraz, 2 Seriale kryminalne, 3 Komedie na wieczór',
  3: 'widocznych jest dokładnie 6 wierszy: Dossier 17 (k1), Mgła (k2), Trzecia zmiana (k3), Linia brzegowa (k4), Sąsiedzi (k5), Fałszywy trop (k6)',
  4: 'widoczne są dokładnie 3 wiersze: Popularne teraz – 7, Seriale kryminalne – 6, Komedie na wieczór – 6',
  5: 'widoczny jest komunikat o poprawnie wykonanych zapytaniach (utworzenie użytkownika i nadanie uprawnień)',
};
const sqlZ = sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));

const R = [
  ['Operacje na bazie danych', [
    'Wykonany import tabel do bazy danych streambox, co jest udokumentowane w pliku import w formacie PNG',
    'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
    ...sqlZ.map((q, i) => `Wykonane zapytanie ${i + 1}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${q} oraz wynik działania udokumentowany zrzutem kw${i + 1}, na którym ${wyniki[i + 1]}`),
  ]],
  ['Zawartość witryny internetowej', [
    'Grafika logo.png: napis STREAMBOX wielkimi literami czcionką bezszeryfową pogrubioną, w kolorze #E11D48, tło przezroczyste, wysokość 40 px, szerokość przycięta do napisu',
    'Witryna zapisana w pliku index.php, jawnie zapisany standard kodowania polskich znaków, deklaracja <!DOCTYPE html>, język polski, tytuł „StreamBox – filmy i seriale”, znacznik meta viewport',
    'Bloki zdefiniowane znacznikami header (klasa pasek), section (klasa hero), main i footer (klasa stopka), w kolejności zgodnej z ilustracją 5',
    'W pasku: obraz logo.png z tekstem alternatywnym „StreamBox” i klasą logo, blok nav z listą ul/li pięciu odnośników o treściach z arkusza, odnośnik „Zaloguj się” z klasami btn i btn-czerwony',
    'W banerze: blok div z klasą hero-tresc, a w nim blok div z klasą przyciski z odnośnikiem „▶ Odtwórz” (klasy btn, btn-bialy) i przyciskiem button „ⓘ Więcej informacji” (klasy btn, btn-szary, id przyciskOpis) wywołującym skrypt',
    'Pierwszy odnośnik menu prowadzi do index.php, pozostałe odnośniki menu, przycisk logowania, „▶ Odtwórz” i odnośniki stopki prowadzą do adresu #',
    'W stopce: paragraf z numerem telefonu, lista punktowana z pięcioma odnośnikami o treściach z arkusza, paragraf „Stronę wykonał: ” z numerem zdającego',
  ]],
  ['Działanie witryny internetowej', [
    'Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracjami 3 i 5; pasek nawigacyjny pozostaje u góry okna podczas przewijania strony',
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów styl.css, formatowanie CSS pochodzi jedynie z tego arkusza',
    'W banerze wyświetla się produkcja „Noc nad Biebrzą” z wierszem „98% dopasowania · 2026 · serial · Thriller” (dane z bazy)',
    'W bloku głównym wyświetlają się trzy rzędy z nagłówkami kategorii i odpowiednio 7, 6 i 6 kafelkami w kolorach z bazy; rząd z większą liczbą kafelków da się przewijać poziomo',
    'Kliknięcie przycisku „ⓘ Więcej informacji” pokazuje opis i zmienia napis na „ⓘ Mniej informacji”, ponowne kliknięcie ukrywa opis i przywraca napis',
    'Przy szerokości okna do 768 px menu jest ukryte, a przyciski w banerze są ułożone jeden pod drugim (ilustracja 4)',
  ]],
  ['Styl CSS witryny internetowej', css.map((c) => `Ustawione ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
  ['Skrypty', [
    'Skrypt PHP łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza streambox (np. mysqli_connect)',
    'Skrypt 1 wysyła zapytanie 1 i wyświetla tytuł w nagłówku h1, paragraf z klasą meta w formacie „<dopasowanie>% dopasowania · <rok> · <typ> · <gatunek>” oraz paragraf z klasą i identyfikatorem opis',
    'Skrypt 2 wysyła zapytanie 2 i dla każdej kategorii tworzy blok section z klasą rzad, nagłówek h2 z nazwą i blok div z klasą kafelki',
    'Skrypt 2 dla każdej kategorii wysyła zmodyfikowane zapytanie 3 z identyfikatorem bieżącej kategorii (zapytanie wykonywane w pętli)',
    'Każda produkcja jest wyświetlana jako element article z klasami „kafel <kolor>” i elementem span z tytułem',
    'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)',
    'Skrypt 3 jest napisany w języku JavaScript, pobiera element o identyfikatorze opis (np. getElementById) i zmienia jego sposób wyświetlania (style.display)',
    'Skrypt 3 zmienia napis na przycisku na „ⓘ Mniej informacji” i z powrotem na „ⓘ Więcej informacji”',
    'Zastosowano znaczące nazewnictwo zmiennych i funkcji',
  ]],
];
const NOTES = [
  'Uwaga: W przypadku oceny zrzutów należy uznać za prawidłowe, jeżeli widoczny jest cały obszar ekranu z widocznym paskiem zadań, a zapytanie ma charakter uniwersalny dla każdego zestawu danych.',
  'Uwaga: W napisach widocznych na stronie dopuszcza się drobne błędy literowe, błędy wielkości liter i znaków diakrytycznych.',
  'Uwaga: Jeśli witryna nie uruchamia się z powodu błędów PHP – sprawdzić według kryteriów w kodzie źródłowym strony.',
  'Uwaga: Kryteria muszą działać na stronie (sprawdzić w inspektorze). Kryteria dotyczące ciała strony, odnośnika i listy punktowanej są spełnione jedynie dla stylu zdefiniowanego selektorem znacznika.',
  'Uwaga: Kryteria należy sprawdzić w kodzie źródłowym oraz na działającej stronie (XAMPP).',
];
const total = R.reduce((n, [, items]) => n + items.length, 0);
const zo = `<table class="zo"><tr><th>Lp.</th><th>Elementy podlegające ocenie / kryteria oceny</th><th>Pkt</th></tr>${R.map(([title, items], i) => `<tr class="res-head"><td>R.${i + 1}</td><td><b>Rezultat ${i + 1}: ${h(title)}</b><p class="note">${h(NOTES[i])}</p></td><td>${items.length}</td></tr>${items.map((t, j) => `<tr><td>R.${i + 1}.${j + 1}</td><td><label><input type="checkbox"> ${h(t)}</label></td><td>1</td></tr>`).join('')}`).join('')}<tr class="sum"><td></td><td>Razem</td><td>${total}</td></tr></table>`;
const pliki = ['kwerendy.txt', 'index.php', 'styl.css', 'skrypt.js'].map((f) => `<h4>${f}</h4><pre>${h(sol(f))}</pre>`).join('');
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
writeFileSync(join(DIR, 'klucz.html'), wrapDocument(`${KOD} – StreamBox – klucz`, `<section class="page">
  <h1>StreamBox – zasady oceniania i rozwiązanie</h1>
  <p class="small">${KOD} · baza streambox · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>). Każde kryterium oceniane jest zero-jedynkowo (spełnione – 1 pkt).</p>
  <h2>Zasady oceniania</h2>${zo}
  <h2>Rozwiązanie wzorcowe</h2>${pliki}
</section>`, KEY_CSS));

console.log(`arkusz.html, klucz.html (kryteria: ${total})`);
