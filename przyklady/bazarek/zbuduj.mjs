// Buduje arkusz egzaminacyjny "Bazarek" (styl INF.03) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/bazarek/zbuduj.mjs
// Wejście: dla_zdajacego/bazarek.sql, rozwiazanie/* (podglad.html - wynik działania index.php z bazą).
import { fileURLToPath } from 'node:url';
import { project, previewDoc, frame, table2, esc, layoutSvg, titlePage, sheetDocument, keyDocument, renderLines, schemaSvg, h, MYSQLI } from '../wspolne.mjs';

const P = project(fileURLToPath(new URL('.', import.meta.url)));
const KOD = 'INF.03-BZ-SG';
const ARCHIWUM = { nazwa: 'bazarek', haslo: 'B@zarek#26' };

const podglad = previewDoc(P.sol);

const schema = schemaSvg({
  tables: [
    { name: 'producenci', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'nazwa', type: 'VARCHAR(30)' }, { name: 'kraj', type: 'VARCHAR(30)' }] },
    {
      name: 'oferty',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'tytul', type: 'VARCHAR(60)' }, { name: 'cena', type: 'DECIMAL(7,2)' }, { name: 'stara_cena', type: 'DECIMAL(7,2)' },
        { name: 'gwiazdki', type: 'INT' }, { name: 'opinie', type: 'INT' }, { name: 'dostawa', type: 'VARCHAR(30)' }, { name: 'smart', type: 'TINYINT(1)' }, { name: 'okazja', type: 'TINYINT(1)' },
        { name: 'producenci_id', type: 'INT', role: 'fk', ref: 'producenci' }],
    },
  ],
});

const uklad = layoutSvg([
  ['nagłówek (header.gora): logo, wyszukiwarka, konto', 34],
  ['menu kategorii (nav.kategorie)', 26],
  ['okruszki (p.okruszki)', 22],
  ['układ (div.uklad): filtry (aside) | oferty (main)', 120],
  ['stopka (footer.stopka): trzy kolumny', 44],
]);

const zapytania = [
  'Zapytanie 1: wybierające jedynie nazwy wszystkich producentów, posortowane rosnąco alfabetycznie',
  'Zapytanie 2: zliczające wszystkie oferty; kolumna z wynikiem ma nazwę (alias) „liczba”',
  'Zapytanie 3: wybierające jedynie tytuł, cenę, starą cenę, liczbę gwiazdek, liczbę opinii, dostawę oraz pola smart i okazja wszystkich ofert',
  'Zapytanie 4: wybierające jedynie tytuł, cenę i starą cenę ofert, które mają starą cenę (pole nie jest puste), posortowane rosnąco według ceny',
  'Zapytanie 5: wybierające jedynie nazwę producenta z tabeli producenci oraz odpowiadające jej tytuł i cenę z tabeli oferty, dla ofert z dostawą Smart! (pole smart ma wartość 1). Należy posłużyć się relacją',
];

const cechy = [
  'Składa się ze strony o nazwie index.php',
  'Zapisana w języku HTML5, zadeklarowany polski język zawartości witryny, jawnie zastosowany standard kodowania polskich znaków, znacznik meta viewport (szerokość widoku równa szerokości urządzenia)',
  'Tytuł strony widoczny na karcie przeglądarki: „Bazarek – telefony i smartfony”',
  'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony; wygląd w całości w CSS, bez stylów w atrybutach',
  'Podział strony na bloki zrealizowany za pomocą semantycznych znaczników HTML5 zgodnie z ilustracją 3',
  {
    text: 'Zawartość nagłówka (header z klasą gora):',
    children: [
      'odnośnik z klasą logo o treści „BAZAREK”, prowadzący do index.php',
      'formularz z klasą szukaj, zawierający: pole tekstowe z podpowiedzią „Czego szukasz?”, listę rozwijaną z opcjami „Wszystkie kategorie”, „Elektronika”, „Moda”, „Dom i ogród” oraz przycisk „Szukaj” wysyłający formularz',
      'blok div z klasą konto i trzema odnośnikami: „Moje konto”, „Obserwowane ♡”, „Koszyk (2)”; odnośnik koszyka ma identyfikator koszyk',
    ],
  },
  'Menu kategorii: blok nawigacyjny (nav) z klasą kategorie, a w nim lista punktowana z dziesięcioma odnośnikami: „Elektronika”, „Moda”, „Dom i ogród”, „Supermarket”, „Dziecko”, „Uroda”, „Zdrowie”, „Kultura i rozrywka”, „Sport i turystyka”, „Motoryzacja”',
  'Paragraf z klasą okruszki o treści „Strona główna › Elektronika › Telefony i smartfony”; „Strona główna” i „Elektronika” są odnośnikami, a ostatnia część jest zapisana znacznikiem oznaczającym tekst ważny (strong)',
  {
    text: 'Blok div z klasą uklad, zawierający panel filtrów (aside z klasą filtry) i blok główny (main). W panelu filtrów nagłówek drugiego stopnia „Filtry” i formularz z czterema grupami (fieldset z legendą):',
    children: [
      '„Stan”: pola wyboru „Nowy” (domyślnie zaznaczone) i „Używany”',
      '„Cena”: blok div z klasą cena-pola z dwoma polami liczbowymi z podpowiedziami „od” i „do”, pod nim przycisk „Zastosuj”',
      '„Dostawa”: pola wyboru „Darmowa dostawa” i „Smart!”',
      '„Producent”: efekt działania skryptu 1',
      'każde pole wyboru jest umieszczone wewnątrz etykiety (label) razem ze swoim tekstem',
    ],
  },
  {
    text: 'Zawartość bloku głównego:',
    children: [
      'blok div z klasą pasek-wynikow: po lewej blok div z nagłówkiem pierwszego stopnia „Telefony i smartfony” i efektem działania skryptu 2, po prawej lista rozwijana z opcjami „Trafność: największa”, „Cena: od najniższej”, „Cena: od najwyższej”, „Najnowsze”',
      'blok section z klasą oferty, wypełniony przez skrypt 3',
      'blok nawigacyjny (nav) z klasą strony i odnośnikami „‹”, „1”, „2”, „3”, „…”, „12”, „›”; odnośnik „1” ma dodatkową klasę aktualna',
    ],
  },
  {
    text: 'Zawartość stopki (footer z klasą stopka):',
    children: [
      'blok div z klasą stopka-kolumny i trzema blokami div; w każdym nagłówek czwartego stopnia i lista punktowana z trzema odnośnikami: „Pomoc” (Jak kupować, Płatności i dostawa, Zwroty i reklamacje), „O nas” (O Bazarku, Kariera, Regulamin), „Dla sprzedających” (Załóż sklep, Opłaty i prowizje, Poradnik sprzedawcy)',
      'paragraf z klasą prawa o treści „Stronę wykonał: ”, dalej wstawiony numer zdającego',
    ],
  },
  'Wszystkie odnośniki poza logo i „Strona główna” prowadzą do adresu #',
];

const css = [
  'Domyślnie dla wszystkich selektorów (*): marginesy zewnętrzne i wewnętrzne 0, model pudełkowy border-box',
  'Dla selektora ciała strony: kolor tła #F2F2F2, kolor czcionki #222222, krój czcionki Arial, w przypadku braku Helvetica, a następnie sans-serif, wysokość linii 1,4. Dla selektora odnośnika: kolor dziedziczony z elementu nadrzędnego, tekst bez podkreślenia. Dla selektora listy punktowanej: brak punktora',
  'Dla klasy gora: biały kolor tła, sposób wyświetlania elastyczny (flex), elementy wyśrodkowane w pionie, odstęp między elementami 24 px, marginesy wewnętrzne: górny i dolny 14 px, lewy i prawy 4%, dolne obramowanie linią ciągłą 1 px w kolorze #DDDDDD. Dla klasy logo: kolor #FF6A13, rozmiar czcionki 1,9 rem, pogrubienie',
  'Dla klasy szukaj: zajmuje całe wolne miejsce w nagłówku (flex: 1), sposób wyświetlania elastyczny. Pole tekstowe, lista i przycisk tworzą jeden połączony pasek z pomarańczową ramką 2 px (#FF6A13) bez podwójnych ramek między elementami; zaokrąglone (4 px) są tylko lewe rogi pola tekstowego i prawe rogi przycisku. Pole tekstowe rozciąga się na wolne miejsce (flex: 1, min-width: 0), marginesy wewnętrzne 10 px / 14 px; lista ma białe tło, marginesy wewnętrzne 10 px',
  'Dla przycisku w klasie szukaj: kolor tła #FF6A13, biały pogrubiony tekst, marginesy wewnętrzne: górny i dolny 10 px, lewy i prawy 22 px, kursor w kształcie wskazującej dłoni; gdy kursor znajdzie się na przycisku, kolor tła zmienia się na #E55A0A',
  'Dla klasy konto: sposób wyświetlania elastyczny, odstęp 20 px, rozmiar czcionki 0,9 rem; gdy kursor znajdzie się na odnośniku w tym bloku, kolor czcionki zmienia się na #FF6A13',
  'Dla klasy kategorie: biały kolor tła, dolne obramowanie 1 px #DDDDDD; lista w menu: sposób wyświetlania elastyczny, odstęp 24 px, marginesy wewnętrzne: lewy i prawy 4%, poziomy pasek przewijania widoczny jedynie wtedy, gdy pozycje się nie mieszczą',
  'Dla odnośników w menu kategorii: sposób wyświetlania blokowy, marginesy wewnętrzne: górny i dolny 12 px, rozmiar czcionki 0,92 rem, tekst bez łamania wierszy, dolne obramowanie 3 px w kolorze przezroczystym; gdy kursor znajdzie się na odnośniku, kolor czcionki i kolor dolnego obramowania zmieniają się na #FF6A13',
  'Dla klasy okruszki: marginesy wewnętrzne: górny i dolny 14 px, lewy i prawy 4%, rozmiar czcionki 0,85 rem, kolor #666666; gdy kursor znajdzie się na odnośniku w tym bloku, tekst jest podkreślony',
  'Dla klasy uklad: sposób wyświetlania w postaci siatki (grid) z dwiema kolumnami: lewa o stałej szerokości 260 px, prawa zajmuje pozostałe miejsce (1fr), odstęp 24 px, marginesy wewnętrzne: lewy i prawy 4%, dolny 40 px, elementy wyrównane do góry (align-items: start)',
  'Dla klasy filtry: biały kolor tła, marginesy wewnętrzne 18 px, zaokrąglenie rogów 6 px; nagłówek panelu: rozmiar czcionki 1,1 rem, dolny margines 12 px; grupy (fieldset): bez obramowania, dolny margines 16 px; legenda: pogrubiona, dolny margines wewnętrzny 8 px',
  'Dla etykiet w panelu filtrów: sposób wyświetlania blokowy, marginesy zewnętrzne: górny i dolny 6 px, rozmiar czcionki 0,92 rem, kursor w kształcie wskazującej dłoni; pola wyboru: prawy margines 8 px, kolor zaznaczenia #FF6A13 (accent-color)',
  'Dla klasy cena-pola: sposób wyświetlania elastyczny, odstęp 8 px; pola liczbowe: szerokość 100%, marginesy wewnętrzne 8 px, obramowanie 1 px #CCCCCC, zaokrąglenie 4 px',
  'Dla przycisku w panelu filtrów: szerokość 100%, górny margines 10 px, marginesy wewnętrzne 9 px, białe tło, pomarańczowa (#FF6A13) ramka 2 px i pomarańczowy pogrubiony tekst, zaokrąglenie 4 px, kursor w kształcie dłoni; gdy kursor znajdzie się na przycisku, kolory odwracają się (tło #FF6A13, biały tekst)',
  'Dla klasy pasek-wynikow: sposób wyświetlania elastyczny, elementy rozsunięte do krawędzi (justify-content: space-between), wyśrodkowane w pionie, zawijanie do kolejnego wiersza, odstęp 12 px, dolny margines 16 px; nagłówek: 1,5 rem; paragraf: 0,9 rem, kolor #666666; lista rozwijana: marginesy wewnętrzne 8 px / 10 px, obramowanie 1 px #CCCCCC, zaokrąglenie 4 px, białe tło',
  'Dla klasy oferty: sposób wyświetlania w postaci siatki, kolumny o szerokości co najmniej 210 px dzielące równo wolne miejsce, w liczbie mieszczącej się w bloku (repeat(auto-fill, minmax(210px, 1fr))), odstęp 16 px',
  'Dla klasy oferta: pozycjonowanie względne, sposób wyświetlania elastyczny w kierunku kolumnowym (elementy jeden pod drugim), odstęp 8 px, marginesy wewnętrzne 14 px, białe tło, zaokrąglenie 6 px, płynne przejście cienia i transformacji 0,2 s; gdy kursor znajdzie się na karcie: cień 0 6px 18px w kolorze czarnym o nieprzezroczystości 0,15 i przesunięcie karty o 3 px w górę (translateY)',
  'Dla klasy zdjecie: wysokość 150 px, zaokrąglenie 4 px, tło – gradient ukośny (135 stopni) od #F5F5F5 do #E2E2E2, zawartość wyśrodkowana w obu kierunkach (np. siatka z place-items: center), rozmiar czcionki 3,2 rem',
  'Dla klasy badge: pozycjonowanie bezwzględne 22 px od góry i 22 px od lewej krawędzi karty, marginesy wewnętrzne 3 px / 8 px, tło #FF6A13, biały pogrubiony tekst 0,75 rem, zaokrąglenie 3 px',
  'Dla tytułu oferty (h3 w karcie): rozmiar czcionki 0,95 rem, bez pogrubienia, minimalna wysokość 2,8 em. Dla klasy ocena: kolor #F5A623, 0,85 rem; liczba opinii (span) w kolorze #777777',
  'Dla klasy cena: 1,4 rem, pogrubienie. Dla klasy stara: kolor #888888, 0,85 rem, tekst przekreślony. Dla klasy dostawa: kolor #2E8B57, 0,82 rem. Dla klasy smart: kolor #FF6A13, pogrubienie',
  'Dla przycisku w karcie: przyklejony do dołu karty (górny margines automatyczny), marginesy wewnętrzne 9 px, tło #FF6A13, biały pogrubiony tekst, bez obramowania, zaokrąglenie 4 px, kursor w kształcie dłoni; gdy kursor znajdzie się na przycisku – tło #E55A0A; przycisk wyłączony (disabled) ma tło #2E8B57 i zwykły kursor',
  'Dla klasy strony: sposób wyświetlania elastyczny, zawartość wyśrodkowana w poziomie, odstęp 6 px, górny margines 28 px; odnośniki: marginesy wewnętrzne 8 px / 14 px, białe tło, obramowanie 1 px #DDDDDD, zaokrąglenie 4 px; gdy kursor znajdzie się na odnośniku, kolor obramowania i czcionki zmienia się na #FF6A13; klasa aktualna: tło i obramowanie #FF6A13, biały tekst, element nie reaguje na kliknięcia (pointer-events: none)',
  'Dla klasy stopka: marginesy wewnętrzne: górny i dolny 32 px, lewy i prawy 4%, białe tło, górne obramowanie 1 px #DDDDDD. Dla klasy stopka-kolumny: siatka z trzema równymi kolumnami, odstęp 24 px. Nagłówki w stopce: 1 rem, dolny margines 8 px; elementy list: marginesy zewnętrzne górny i dolny 4 px, 0,9 rem, kolor #555555; gdy kursor znajdzie się na odnośniku w stopce: kolor #FF6A13 i podkreślenie. Dla klasy prawa: górny margines 24 px, 0,82 rem, kolor #888888, tekst wyśrodkowany',
  'W przypadku ekranów o szerokości do 900 px: siatka klasy uklad ma jedną kolumnę (filtry nad ofertami), a blok konto jest ukryty',
  'W przypadku ekranów o szerokości do 560 px (ilustracja 5): nagłówek zawija elementy do kolejnego wiersza, wyszukiwarka zajmuje całą szerokość i jest wyświetlana pod logo (flex-basis: 100%, order: 3), lista rozwijana w wyszukiwarce jest ukryta, oferty są wyświetlane w dwóch kolumnach, a kolumny stopki jedna pod drugą',
];

const skryptyPhp = [
  { nr: 1, tytul: 'producenci w filtrach', lines: ['wysyła do bazy danych zapytanie 1', 'dla każdego zwróconego producenta tworzy etykietę (label) zawierającą pole wyboru (checkbox) i nazwę producenta'] },
  { nr: 2, tytul: 'liczba ofert', lines: ['wysyła do bazy danych zapytanie 2', 'wyświetla paragraf o treści „Znaleziono <liczba> ofert”, gdzie <liczba> to wartość zwrócona zapytaniem'] },
  {
    nr: 3,
    tytul: 'karty ofert',
    lines: ['wysyła do bazy danych zapytanie 3',
      {
        text: 'dla każdej oferty tworzy element article z klasą oferta, zawierający kolejno:',
        children: [
          'tylko gdy pole okazja ma wartość 1: element span z klasą badge o treści „Okazja”',
          'blok div z klasą zdjecie zawierający znak 📱',
          'nagłówek trzeciego stopnia z tytułem',
          'paragraf z klasą ocena: tyle znaków ★, ile wynosi pole gwiazdki, uzupełnionych znakami ☆ do pięciu (np. dla 4: ★★★★☆), a po spacji element span z liczbą opinii w nawiasie, np. „(128)”',
          'paragraf z klasą cena: cena w formacie polskim z dwoma miejscami po przecinku, spacją jako separatorem tysięcy i dopiskiem „ zł”, np. „1 299,00 zł” (można użyć funkcji number_format)',
          'tylko gdy stara cena nie jest pusta: paragraf z klasą stara, ze starą ceną w tym samym formacie',
          'paragraf z klasą dostawa z treścią pola dostawa; gdy pole smart ma wartość 1, przed tą treścią znajduje się element span z klasą smart o treści „Smart!” i spacja',
          'przycisk „Dodaj do koszyka”, którego kliknięcie uruchamia skrypt 4',
        ],
      }],
  },
];
const skryptJs = { nr: 4, lines: ['wywoływany po kliknięciu dowolnego przycisku „Dodaj do koszyka”', 'zwiększa o 1 liczbę produktów w koszyku (początkowo 2) i wyświetla ją w odnośniku z identyfikatorem koszyk w postaci „Koszyk (<liczba>)”', 'zmienia napis na klikniętym przycisku na „W koszyku ✓” i wyłącza przycisk (właściwość disabled), aby nie można go było kliknąć ponownie'] };

const CSS_POMOC = [
  ['display: grid; grid-template-columns: 260px 1fr', 'Siatka z kolumną o stałej szerokości i kolumną na pozostałe miejsce'],
  ['repeat(auto-fill, minmax(210px, 1fr))', 'Tyle kolumn, ile się zmieści; każda co najmniej 210 px, wolne miejsce dzielone równo'],
  ['align-items: start', 'Elementy siatki wyrównane do góry (nie rozciągają się na wysokość wiersza)'],
  ['display: grid; place-items: center', 'Zawartość wyśrodkowana w obu kierunkach'],
  ['display: flex; flex-direction: column', 'Elementy układane jeden pod drugim'],
  ['flex: 1; min-width: 0', 'Element zajmuje wolne miejsce i może się zwężać'],
  ['flex-wrap: wrap', 'Elementy przenoszone do kolejnego wiersza, gdy brakuje miejsca'],
  ['flex-basis: 100%; order: 3', 'Element na całą szerokość, wyświetlany jako trzeci w kolejności'],
  ['margin-top: auto', 'W układzie kolumnowym flex przesuwa element na sam dół'],
  ['position: relative / absolute', 'Element bezwzględny pozycjonowany względem najbliższego przodka z position: relative'],
  ['accent-color: #FF6A13', 'Kolor zaznaczenia pól wyboru'],
  ['white-space: nowrap', 'Tekst bez łamania wierszy'],
  ['pointer-events: none', 'Element nie reaguje na kliknięcia'],
  ['box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15)', 'Cień przesunięty o 6 px w dół, rozmycie 18 px, czarny o nieprzezroczystości 0,15'],
  ['transform: translateY(-3px)', 'Przesunięcie elementu o 3 px w górę'],
  ['transition: box-shadow 0.2s, transform 0.2s', 'Płynne przejście cienia i transformacji w czasie 0,2 s'],
];
const PHP_POMOC = [
  ['number_format(liczba, 2, \',\', \' \')', 'Liczba z dwoma miejscami po przecinku, przecinkiem dziesiętnym i spacją jako separatorem tysięcy'],
  ['str_repeat(napis, n)', 'Napis powtórzony n razy'],
];
const DOM = [
  ['document.getElementById(id)', 'element.innerHTML = "wartość"'],
  ['onclick="funkcja(this)"', 'this – element, który wywołał zdarzenie'],
  ['element.disabled = true', 'wyłączenie przycisku lub pola formularza'],
];

const sheet = `${titlePage(KOD, 'Bazarek – sklep internetowy z telefonami')}
<section class="page task">
  <h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową sklepu w stylu platformy handlowej Bazarek, wykorzystując pakiet XAMPP oraz edytor zaznaczający składnię.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>

  <h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera połączone relacją tabele przedstawione na ilustracji 1. Tabela producenci opisuje producentów telefonów, tabela oferty – oferty sklepu. Pole stara_cena jest puste (NULL), gdy oferta nie ma obniżki; pole gwiazdki zawiera ocenę od 1 do 5; pola smart i okazja przyjmują wartości 0 lub 1. Nazwa serwisu, produkty i ceny są wymyślone.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>bazarek</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku bazarek.sql do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie PNG pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie bazarek. Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie PNG i nadaj im nazwy kw1, kw2, kw3, kw4, kw5. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>

  <h3>Witryna internetowa</h3>
  ${frame(podglad, 2, 'Wygląd witryny internetowej na ekranie o szerokości 1280 px, kursor na trzeciej karcie; dane pochodzą z bazy', 1280, 0.5)}
  <div class="with-layout"><div>
  ${frame(podglad, 4, 'Wygląd witryny na ekranie o szerokości 400 px (początek strony – filtry nad ofertami, oferty w dwóch kolumnach)', 400, 0.6, { cls: 'mobile' })}
  </div><figure class="layout">${uklad}<figcaption>Ilustracja 3. Układ bloków</figcaption></figure></div>
  <p>Cechy witryny:</p>
  ${renderLines(cechy)}

  <h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. W tabeli 2 zamieszczono pomoc do niektórych właściwości CSS. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(css)}
  <p class="note">Uwaga: styl CSS ciała strony, odnośnika i listy punktowanej należy zdefiniować wyłącznie przy pomocy selektora tych znaczników. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.</p>

  <h3>Skrypty działające po stronie serwera (PHP)</h3>
  <p>W tabeli 1 zamieszczono wybrane funkcje PHP. Wymagania dotyczące skryptów:</p>
  ${renderLines(['Napisane w języku PHP', 'Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim', 'Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie bazarek', 'Na końcu zamykane jest połączenie z serwerem'])}
  ${skryptyPhp.map((s) => `<p class="script-name">Skrypt ${s.nr} (${s.tytul}):</p>${renderLines(s.lines.map((l) => (typeof l === 'string' ? l.charAt(0).toUpperCase() + l.slice(1) : { ...l, text: l.text.charAt(0).toUpperCase() + l.text.slice(1) })))}`).join('')}
  <h3>Skrypt działający po stronie klienta (JavaScript)</h3>
  <p>W tabeli 3 zamieszczono wybrane pola i metody modelu DOM. Skrypt jest napisany w języku JavaScript (w pliku skrypt.js lub w znaczniku script), należy stosować znaczące nazewnictwo zmiennych i funkcji.</p>
  <p class="script-name">Skrypt ${skryptJs.nr} (koszyk):</p>${renderLines(skryptJs.lines.map((l) => l.charAt(0).toUpperCase() + l.slice(1)))}

  <div class="help-tables">
  ${table2('Tabela 1. Wybrane funkcje języka PHP', ['Funkcja', 'Zwracana wartość'], esc([...MYSQLI, ...PHP_POMOC]))}
  ${table2('Tabela 2. Wybrane właściwości CSS', ['Zapis', 'Znaczenie'], esc(CSS_POMOC))}
  ${table2('Tabela 3. Wybrane pola i metody modelu DOM języka JavaScript', ['Wyszukiwanie i zdarzenia', 'Zmiana elementów'], esc(DOM))}
  </div>

  <p class="note">UWAGA: po zakończeniu pracy utwórz plik tekstowy o nazwie przeglądarka.txt. Zapisz w nim nazwę przeglądarki internetowej, w której weryfikowana była poprawność działania witryny. Umieść go w folderze z numerem zdającego.</p>
  <p>W folderze z numerem zdającego powinny znajdować się pliki: import.png, index.php, kw1.png, kw2.png, kw3.png, kw4.png, kw5.png, kwerendy.txt, przeglądarka.txt, skrypt.js, styl.css, ewentualnie inne przygotowane pliki. Spakuj folder do archiwum ZIP o nazwie równej numerowi zdającego i prześlij je w sposób wskazany przez nauczyciela.</p>
  <p><b>Czas przeznaczony na wykonanie zadania wynosi 150 minut.</b></p>
  <p>Ocenie podlegać będzie 5 rezultatów:</p>
  ${renderLines(['operacje na bazie danych,', 'zawartość witryny internetowej,', 'działanie witryny internetowej,', 'styl CSS witryny internetowej,', 'skrypty.'])}
</section>`;

// Na ilustracji 2 kursor stoi na trzeciej karcie (efekt :hover), na ilustracji 4 widać początek strony.
const sheetHtml = sheetDocument(`${KOD} – Bazarek – arkusz ćwiczeniowy`, sheet, `
figure.preview.mobile .frame-wrap { height: 1000px !important; overflow: hidden; }
`).replace('</script>', `
document.querySelectorAll('figure.preview:not(.mobile) iframe.site').forEach(function (f) {
  f.addEventListener('load', function () {
    try {
      var karta = f.contentDocument.querySelectorAll('.oferta')[2];
      karta.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.15)';
      karta.style.transform = 'translateY(-3px)';
    } catch (e) {}
  });
});
</script>`);
P.write('arkusz.html', sheetHtml);

// ---------- klucz ----------
const sqlZ = P.sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));
const wyniki = [
  'widocznych jest dokładnie 6 wierszy w kolejności: Aero, Lumia, Nova, Orion, Titan, Vega',
  'widoczny jest jeden wiersz z kolumną liczba o wartości 8',
  'widocznych jest dokładnie 8 wierszy z 8 kolumnami (stara_cena ma wartość NULL dla 5 ofert)',
  'widoczne są dokładnie 3 wiersze w kolejności: Basic 4 (349.00), Aero S5 (599.00), Nova X12 (1299.00)',
  'widoczne są dokładnie 3 wiersze: Lumia – Lumia Pro, Titan – Titan 5G, Vega – Vega 8',
];
const R = [
  ['Operacje na bazie danych', [
    'Wykonany import tabel do bazy danych bazarek, co jest udokumentowane w pliku import w formacie PNG',
    'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
    ...sqlZ.map((q, i) => `Wykonane zapytanie ${i + 1}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${q} oraz wynik działania udokumentowany zrzutem kw${i + 1}, na którym ${wyniki[i]}`),
  ]],
  ['Zawartość witryny internetowej', [
    'Witryna zapisana w pliku index.php, jawnie zapisany standard kodowania polskich znaków, deklaracja <!DOCTYPE html>, język polski, znacznik meta viewport, tytuł „Bazarek – telefony i smartfony”',
    'Bloki zdefiniowane znacznikami semantycznymi: header (gora), nav (kategorie), aside (filtry) i main wewnątrz div z klasą uklad, footer (stopka), w kolejności zgodnej z ilustracją 3',
    'W nagłówku: odnośnik BAZAREK z klasą logo, formularz z klasą szukaj (pole z podpowiedzią „Czego szukasz?”, lista z czterema opcjami, przycisk „Szukaj” typu submit), blok konto z trzema odnośnikami, odnośnik koszyka z id koszyk',
    'Menu kategorii: nav z klasą kategorie i listą ul/li z dziesięcioma odnośnikami; paragraf okruszki z dwoma odnośnikami i ostatnią częścią w znaczniku strong',
    'Panel filtrów: nagłówek h2 „Filtry”, formularz z czterema fieldset z legendami Stan, Cena, Dostawa, Producent; pola wyboru umieszczone w etykietach, „Nowy” domyślnie zaznaczone',
    'Grupa Cena: blok cena-pola z dwoma polami typu number z podpowiedziami „od” i „do” oraz przycisk „Zastosuj”',
    'Pasek wyników: nagłówek h1 „Telefony i smartfony”, lista sortowania z czterema opcjami; sekcja z klasą oferty',
    'Paginacja: nav z klasą strony i siedmioma odnośnikami, odnośnik „1” z klasą aktualna',
    'Stopka: blok stopka-kolumny z trzema kolumnami (h4 i lista trzech odnośników) oraz paragraf z klasą prawa „Stronę wykonał: ” z numerem zdającego',
  ]],
  ['Działanie witryny internetowej', [
    'Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracjami 2 i 3; filtry w kolumnie 260 px po lewej, oferty po prawej',
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów styl.css, formatowanie CSS pochodzi jedynie z tego arkusza',
    'W filtrach wyświetla się 6 producentów w kolejności alfabetycznej, w pasku wyników napis „Znaleziono 8 ofert” (dane z bazy)',
    'Wyświetla się 8 kart ofert; plakietka „Okazja” i przekreślona stara cena są tylko na kartach Nova X12, Aero S5 i Basic 4; „Smart!” tylko na kartach Lumia Pro, Titan 5G i Vega 8',
    'Na szerokim ekranie oferty są w czterech kolumnach, a liczba kolumn zmniejsza się sama po zwężeniu okna; przyciski kart w rzędzie są na tej samej wysokości',
    'Kliknięcie „Dodaj do koszyka” zwiększa licznik w odnośniku koszyka o 1, a przycisk zmienia napis na „W koszyku ✓” i przestaje działać',
    'Przy szerokości okna do 900 px filtry są nad ofertami, a linki konta ukryte; do 560 px wyszukiwarka jest pod logo, oferty w dwóch kolumnach, stopka w jednej kolumnie',
  ]],
  ['Styl CSS witryny internetowej', css.map((c) => `Ustawione ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
  ['Skrypty', [
    'Skrypt PHP łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza bazarek (np. mysqli_connect)',
    'Skrypt 1 wysyła zapytanie 1 i dla każdego producenta tworzy etykietę z polem wyboru i nazwą',
    'Skrypt 2 wysyła zapytanie 2 i wyświetla paragraf „Znaleziono <liczba> ofert”',
    'Skrypt 3 wysyła zapytanie 3 i dla każdego rekordu tworzy element article z klasą oferta z tytułem w h3 i znakiem 📱 w bloku zdjecie',
    'Skrypt 3 wyświetla gwiazdki zgodnie z polem gwiazdki (★ uzupełnione ☆ do pięciu) i liczbę opinii w nawiasie w elemencie span',
    'Skrypt 3 wyświetla cenę w formacie „1 299,00 zł” (np. number_format) oraz starą cenę tylko wtedy, gdy nie jest pusta',
    'Skrypt 3 wyświetla plakietkę „Okazja” tylko dla ofert z polem okazja równym 1 oraz span „Smart!” tylko dla ofert z polem smart równym 1',
    'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)',
    'Skrypt 4 jest napisany w języku JavaScript, przechowuje liczbę produktów w koszyku i aktualizuje treść odnośnika z id koszyk',
    'Skrypt 4 zmienia napis klikniętego przycisku na „W koszyku ✓” i wyłącza przycisk (disabled)',
    'Zastosowano znaczące nazewnictwo zmiennych i funkcji',
  ]],
];
const key = keyDocument({
  title: `${KOD} – Bazarek – klucz`,
  heading: 'Bazarek – zasady oceniania i rozwiązanie',
  meta: `${KOD} · baza bazarek · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>).`,
  R,
  files: ['kwerendy.txt', 'index.php', 'styl.css', 'skrypt.js'].map((f) => [f, P.sol(f)]),
});
P.write('klucz.html', key.html);
console.log(`arkusz.html, klucz.html (kryteria: ${key.total})`);
