// Buduje arkusz egzaminacyjny "Kurier24" (styl INF.03) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/kurier/zbuduj.mjs
// Wejście: dla_zdajacego/kurier.sql, rozwiazanie/* (podglad.html - wynik działania index.php z bazą).
import { fileURLToPath } from 'node:url';
import { project, previewDoc, frame, table2, esc, layoutSvg, titlePage, sheetDocument, keyDocument, renderLines, schemaSvg, h, MYSQLI } from '../wspolne.mjs';

const P = project(fileURLToPath(new URL('.', import.meta.url)));
const KOD = 'INF.03-KU-SG';
const ARCHIWUM = { nazwa: 'kurier', haslo: 'Kur!er24#News' };

const podglad = previewDoc(P.sol);
// Ilustracja 4: stan po kliknięciu "Zapisz się" z poprawnym adresem.
const podgladNewsletter = previewDoc(P.sol, { extraCss: '.gorny-pasek,.glowa,.pilne,.hero,main,.stopka{display:none}.strona{padding:12px}.tresc{grid-template-columns:1fr}' })
  .replace('placeholder="Twój adres e-mail">', 'placeholder="Twój adres e-mail" value="jan.kowalski@example.com">');

const schema = schemaSvg({
  tables: [
    { name: 'kategorie', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'nazwa', type: 'VARCHAR(30)' }] },
    {
      name: 'artykuly',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'tytul', type: 'VARCHAR(100)' }, { name: 'zajawka', type: 'VARCHAR(200)' },
        { name: 'opublikowano', type: 'DATETIME' }, { name: 'wyswietlenia', type: 'INT' }, { name: 'kategorie_id', type: 'INT', role: 'fk', ref: 'kategorie' }],
    },
  ],
});

const uklad = layoutSvg([
  ['górny pasek (div.gorny-pasek)', 20],
  ['nagłówek z menu (header.glowa) – przyklejony', 28],
  ['pasek „Pilne” (div.pilne)', 20],
  ['sekcja główna (section.hero): duży | dwa małe', 70],
  ['treść (div.tresc): main | aside.boczna (320 px)', 110],
  ['stopka (footer.stopka): cztery kolumny', 40],
]);

const zapytania = [
  'Zapytanie 1: wybierające jedynie godzinę publikacji w formacie GG:MM (np. 10:42, kolumna o nazwie „godzina”) oraz tytuł sześciu najnowszych artykułów, posortowane malejąco według daty publikacji',
  'Zapytanie 2: wybierające jedynie tytuł, zajawkę oraz datę publikacji w formacie DD.MM.RRRR GG:MM (kolumna o nazwie „data”) trzech najnowszych artykułów z kategorii o nazwie Biznes. Należy posłużyć się relacją, a nie wpisywać identyfikatora kategorii',
  'Zapytanie 3: wybierające jedynie tytuły pięciu artykułów o największej liczbie wyświetleń, posortowane malejąco według liczby wyświetleń',
  'Zapytanie 4: wybierające nazwę kategorii oraz liczbę artykułów w tej kategorii (kolumna o nazwie „liczba”) – tylko dla kategorii, które mają artykuły. Należy posłużyć się relacją i grupowaniem',
  'Zapytanie 5: zwiększające o 1 liczbę wyświetleń artykułu o identyfikatorze 3',
];

const cechy = [
  'Składa się ze strony o nazwie index.php',
  'Zapisana w języku HTML5, zadeklarowany polski język zawartości witryny, jawnie zastosowany standard kodowania polskich znaków, znacznik meta viewport',
  'Tytuł strony widoczny na karcie przeglądarki: „Kurier24 – wiadomości z kraju i ze świata”',
  'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony; wygląd w całości w CSS, bez stylów w atrybutach',
  'Podział strony na bloki zrealizowany za pomocą znaczników semantycznych HTML5 zgodnie z ilustracją 3',
  'Górny pasek (div z klasą gorny-pasek): po lewej element span z datą „wtorek, 17 listopada 2026”, po prawej blok div z klasą gorny-prawa zawierający element span z klasą pogoda-mala o treści „Białystok 4°C” oraz odnośniki „Newsletter” i „Zaloguj się”',
  'Nagłówek (header z klasą glowa): odnośnik z klasą logo prowadzący do index.php o treści „KURIER24”, w którym „24” jest zapisane w osobnym elemencie span, oraz blok nawigacyjny (nav) z klasą glowne z listą punktowaną ośmiu odnośników: „Wiadomości”, „Polska”, „Świat”, „Biznes”, „Sport”, „Kultura”, „Technologia”, „Lifestyle”',
  'Pasek „Pilne” (div z klasą pilne): tekst „Pilne” zapisany znacznikiem oznaczającym tekst ważny (strong) i odnośnik „Zmiany w rozkładach pociągów od grudnia. Sprawdź, które połączenia znikną”',
  {
    text: 'Blok div z klasą strona, a w nim sekcja (section) z klasą hero z trzema artykułami (article). Każdy artykuł zawiera jeden odnośnik z klasą podpis, a w nim element span z klasą etykieta, nagłówek drugiego stopnia i – tylko w pierwszym artykule – paragraf z klasą meta:',
    children: [
      'pierwszy artykuł, klasy glowny i t1: „Polska”, „Pierwszy śnieg paraliżuje drogi na wschodzie kraju”, „12 min temu · 4 komentarze”',
      'drugi artykuł, klasa t2: „Świat”, „Szczyt klimatyczny zakończony kompromisem”',
      'trzeci artykuł, klasa t3: „Sport”, „Biało-czerwoni wygrywają po dramatycznej końcówce”',
    ],
  },
  {
    text: 'Pod sekcją hero, w bloku strona, blok div z klasą tresc zawierający blok główny (main) i panel boczny (aside z klasą boczna). W bloku głównym kolejno:',
    children: [
      'nagłówek drugiego stopnia z klasą naglowek-sekcji „Najnowsze” i lista punktowana z klasą najnowsze, wypełniona przez skrypt 1',
      'nagłówek „Biznes” (klasa naglowek-sekcji) i sekcja z klasą karty, wypełniona przez skrypt 2',
      'nagłówek „Sport” (klasa naglowek-sekcji) i sekcja z klasą karty z trzema kartami o budowie takiej jak w skrypcie 2 (kategoria „Sport”), z danymi: „Siatkarze awansują do półfinału turnieju” / „Po zaciętym meczu rozstrzygnął dopiero piąty set.” / „1 godz. temu”; „Rekord życiowy młodej lekkoatletki” / „Zawodniczka poprawiła swój wynik o prawie sekundę.” / „4 godz. temu”; „Szachowy turniej przyciągnął ponad 300 uczestników” / „Najmłodszy z zawodników miał dopiero siedem lat.” / „6 godz. temu”',
    ],
  },
  {
    text: 'W panelu bocznym trzy sekcje z klasą box, każda z nagłówkiem drugiego stopnia:',
    children: [
      '„Najczęściej czytane”: lista numerowana (ol) z klasą popularne, wypełniona przez skrypt 3',
      '„Pogoda”: blok div z klasą pogoda, a w nim element span z klasą temp o treści „4°C” i blok div z pogrubionym (strong) tekstem „Białystok” oraz paragrafem „Pochmurno, wiatr 12 km/h”',
      '„Newsletter”: formularz z etykietą „Codzienne podsumowanie na e-mail” powiązaną z polem (atrybuty for i id = email), polem typu email z podpowiedzią „Twój adres e-mail” i przyciskiem „Zapisz się”, którego kliknięcie uruchamia skrypt 4; pod formularzem pusty paragraf z identyfikatorem komunikat',
    ],
  },
  'Stopka (footer z klasą stopka): blok div z klasą stopka-kolumny z czterema blokami div; w każdym nagłówek czwartego stopnia i lista punktowana z trzema odnośnikami: „Serwisy” (Wiadomości, Sport, Biznes), „Redakcja” (O nas, Zespół, Kontakt), „Reklama” (Oferta, Cennik, Media kit), „Pomoc” (Regulamin, Prywatność, Ustawienia cookies); pod nimi paragraf z klasą prawa o treści „Stronę wykonał: ”, dalej wstawiony numer zdającego',
  'Wszystkie odnośniki poza logo prowadzą do adresu #',
];

const css = [
  'Domyślnie dla wszystkich selektorów (*): marginesy zewnętrzne i wewnętrzne 0, model pudełkowy border-box',
  'Dla selektora ciała strony: kolor tła #F4F4F4, kolor czcionki #1A1A1A, krój czcionki Arial, w przypadku braku Helvetica, a następnie sans-serif, wysokość linii 1,45. Dla selektora odnośnika: kolor dziedziczony, tekst bez podkreślenia. Dla selektorów listy punktowanej i numerowanej (ul, ol): brak punktorów i numeracji',
  'Dla klasy gorny-pasek: sposób wyświetlania elastyczny, lewa i prawa część rozsunięte do krawędzi (justify-content: space-between), marginesy wewnętrzne: górny i dolny 6 px, lewy i prawy 4%, kolor tła #E9E9E9, kolor czcionki #555, rozmiar czcionki 0,8 rem. Dla klasy gorny-prawa: sposób wyświetlania elastyczny, odstęp 18 px; gdy kursor znajdzie się na odnośniku w tym bloku, kolor czcionki zmienia się na #0B5FD8, a tekst jest podkreślony',
  'Dla klasy glowa: przyklejona do górnej krawędzi okna podczas przewijania (position: sticky, top: 0), leżąca nad treścią (z-index: 20), sposób wyświetlania elastyczny, elementy wyśrodkowane w pionie, odstęp 28 px, marginesy wewnętrzne: lewy i prawy 4%, górny i dolny 0, kolor tła #0A2540, biały kolor czcionki',
  'Dla klasy logo: marginesy wewnętrzne: górny i dolny 12 px, rozmiar czcionki 1,8 rem, pogrubienie, odstęp między literami -0,5 px; element span w logo ma kolor #FF4D5E',
  'Dla klasy glowne: poziomy pasek przewijania widoczny jedynie wtedy, gdy pozycje się nie mieszczą (overflow-x: auto); lista w menu: sposób wyświetlania elastyczny (pozycje w rzędzie, bez odstępów)',
  'Dla odnośników w menu: sposób wyświetlania blokowy, marginesy wewnętrzne: górny i dolny 18 px, lewy i prawy 12 px, rozmiar czcionki 0,92 rem, tekst bez łamania wierszy; gdy kursor znajdzie się na odnośniku, kolor tła zmienia się na biały o nieprzezroczystości 0,12 (rgba(255, 255, 255, 0.12))',
  'Dla klasy pilne: sposób wyświetlania elastyczny, elementy wyśrodkowane w pionie, odstęp 14 px, marginesy wewnętrzne: górny i dolny 10 px, lewy i prawy 4%, biały kolor tła, dolne obramowanie linią ciągłą 1 px w kolorze #DDD, rozmiar czcionki 0,95 rem; gdy kursor znajdzie się na odnośniku w tym bloku, tekst jest podkreślony',
  'Dla tekstu ważnego (strong) w klasie pilne: marginesy wewnętrzne: górny i dolny 3 px, lewy i prawy 10 px, kolor tła #D7263D, biały kolor czcionki, rozmiar czcionki 0,8 rem, wszystkie litery wielkie uzyskane za pomocą CSS (text-transform)',
  'Dla klasy strona: maksymalna szerokość 1200 px, blok wyśrodkowany w poziomie (marginesy lewy i prawy auto), marginesy wewnętrzne: górny 20 px, lewy i prawy 4%, dolny 40 px',
  'Dla klasy hero: sposób wyświetlania w postaci siatki (grid) z dwiema kolumnami w proporcji 2 : 1 (2fr 1fr) i dwoma równymi wierszami (1fr 1fr), odstęp 12 px, wysokość 460 px. Pierwszy artykuł (klasa glowny) zajmuje oba wiersze (grid-row: 1 / 3)',
  'Dla artykułów w sekcji hero: pozycjonowanie względne, ukryta zawartość wychodząca poza element (overflow: hidden), zaokrąglenie rogów 6 px, biały kolor czcionki. Tło artykułów – gradient liniowy ukośny (135 stopni): klasa t1 od #3A6073 do #16222A, klasa t2 od #5B247A do #1BCEDF, klasa t3 od #134E5E do #71B280',
  'Dla klasy podpis: pozycjonowanie bezwzględne przy lewej, prawej i dolnej krawędzi artykułu (left, right, bottom: 0), marginesy wewnętrzne: górny 40 px, lewy i prawy 20 px, dolny 18 px, tło – gradient liniowy od dołu (to top) od czarnego o nieprzezroczystości 0,85 do przezroczystego',
  'Dla klasy etykieta: sposób wyświetlania inline-block, dolny margines 8 px, marginesy wewnętrzne: górny i dolny 2 px, lewy i prawy 8 px, kolor tła #D7263D, zaokrąglenie rogów 2 px, rozmiar czcionki 0,72 rem, pogrubienie, wielkie litery uzyskane za pomocą CSS',
  'Dla nagłówków w sekcji hero: rozmiar czcionki 1,2 rem, wysokość linii 1,25; w artykule glowny rozmiar 2 rem; gdy kursor znajdzie się na odnośniku w sekcji hero, nagłówek jest podkreślony. Dla klasy meta: górny margines 6 px, kolor #AAA, rozmiar czcionki 0,8 rem',
  'Dla klasy tresc: siatka z dwiema kolumnami: lewa zajmuje pozostałe miejsce (1fr), prawa ma 320 px, odstęp 24 px, elementy wyrównane do góry (align-items: start)',
  'Dla klasy naglowek-sekcji: marginesy zewnętrzne: górny 28 px, dolny 14 px, lewy i prawy 0, lewy margines wewnętrzny 10 px, lewe obramowanie linią ciągłą 5 px w kolorze #D7263D, rozmiar czcionki 1,3 rem',
  'Dla elementów listy najnowsze: sposób wyświetlania elastyczny, odstęp 14 px, marginesy wewnętrzne: górny i dolny 10 px, dolne obramowanie 1 px #DDD. Dla znacznika time w tej liście: minimalna szerokość 48 px, kolor #D7263D, pogrubienie; gdy kursor znajdzie się na odnośniku listy, kolor czcionki zmienia się na #0B5FD8',
  'Dla klasy karty: siatka z trzema równymi kolumnami (repeat(3, 1fr)), odstęp 16 px',
  'Dla klasy karta: ukryta zawartość wychodząca poza element, biały kolor tła, zaokrąglenie rogów 6 px, płynne przejście cienia w czasie 0,2 s; gdy kursor znajdzie się na karcie, pojawia się cień 0 6px 18px w kolorze czarnym o nieprzezroczystości 0,15',
  'Dla klasy obraz: proporcje 16 : 9 (aspect-ratio). Tło – gradient ukośny (135 stopni): klasa o1 od #614385 do #516395, klasa o2 od #2193B0 do #6DD5ED, klasa o3 od #EE9CA7 do #FFDDE1',
  'Dla bloku tekst w karcie: marginesy wewnętrzne 12 px. Dla klasy kat: kolor #D7263D, rozmiar czcionki 0,72 rem, pogrubienie, wielkie litery uzyskane za pomocą CSS',
  'Dla nagłówka trzeciego stopnia w karcie: marginesy zewnętrzne: górny 4 px, lewy i prawy 0, dolny 6 px, rozmiar czcionki 1 rem, wysokość linii 1,3; gdy kursor znajdzie się na odnośniku w nagłówku, kolor czcionki zmienia się na #0B5FD8. Paragrafy w karcie: kolor #555, rozmiar 0,88 rem; paragraf meta w karcie: kolor #888, rozmiar 0,78 rem',
  'Dla klasy box: dolny margines 16 px, marginesy wewnętrzne 16 px, biały kolor tła, zaokrąglenie rogów 6 px; nagłówek drugiego stopnia w boksie: dolny margines 10 px, rozmiar czcionki 1,1 rem',
  'Dla elementów listy popularne: sposób wyświetlania elastyczny, elementy wyśrodkowane w pionie, odstęp 12 px, marginesy wewnętrzne: górny i dolny 8 px, dolne obramowanie 1 px #EEE, rozmiar czcionki 0,92 rem; gdy kursor znajdzie się na odnośniku, kolor czcionki zmienia się na #0B5FD8',
  'Dla klasy nr: element nie zmienia rozmiaru w układzie elastycznym (flex: none), siatka z zawartością wyśrodkowaną w obu kierunkach (place-items: center), szerokość i wysokość 28 px, kolor tła #0A2540, biały kolor czcionki, kształt koła (zaokrąglenie 50%), rozmiar czcionki 0,85 rem, pogrubienie. Element z klasami nr i top ma kolor tła #D7263D',
  'Dla klasy pogoda: sposób wyświetlania elastyczny, elementy wyśrodkowane w pionie, odstęp 14 px. Dla klasy temp: rozmiar czcionki 2,4 rem, pogrubienie. Paragraf w bloku pogoda: kolor #666, rozmiar czcionki 0,88 rem',
  'Dla etykiety formularza w boksie: sposób wyświetlania blokowy, dolny margines 8 px, kolor #555, rozmiar czcionki 0,88 rem. Dla pola formularza: szerokość 100%, marginesy wewnętrzne 10 px, obramowanie 1 px linią ciągłą #CCC, zaokrąglenie rogów 4 px',
  'Dla przycisku formularza: szerokość 100%, górny margines 8 px, marginesy wewnętrzne 10 px, kolor tła #0A2540, biały pogrubiony tekst, brak obramowania, zaokrąglenie rogów 4 px, kursor w kształcie wskazującej dłoni; gdy kursor znajdzie się na przycisku, kolor tła zmienia się na #0B5FD8',
  'Dla identyfikatora komunikat: górny margines 8 px, rozmiar czcionki 0,85 rem. Dla klasy sukces: kolor #2E8B57. Dla klasy blad: kolor #D7263D, pogrubienie',
  'Dla klasy stopka: marginesy wewnętrzne: górny i dolny 32 px, lewy i prawy 4%, kolor tła #0A2540, kolor czcionki #B8C4D6. Dla klasy stopka-kolumny: siatka z czterema równymi kolumnami, odstęp 24 px. Nagłówki w stopce: dolny margines 8 px, biały kolor czcionki; elementy list: marginesy zewnętrzne górny i dolny 4 px, rozmiar czcionki 0,9 rem; gdy kursor znajdzie się na odnośniku w stopce: biały kolor i podkreślenie. Dla klasy prawa: górny margines 24 px, rozmiar 0,82 rem, tekst wyśrodkowany',
  'W przypadku ekranów o szerokości do 900 px: sekcja hero ma jedną kolumnę, automatyczne wiersze i automatyczną wysokość; artykuły hero mają minimalną wysokość 200 px, artykuł glowny zajmuje zwykły wiersz (grid-row: auto), ma minimalną wysokość 320 px i nagłówek 1,5 rem; klasa tresc ma jedną kolumnę (panel boczny pod treścią), a stopka-kolumny dwie kolumny',
  'W przypadku ekranów o szerokości do 560 px (ilustracja 5): temperatura w górnym pasku (pogoda-mala) jest ukryta, pasek pilne układa elementy jeden pod drugim (flex-direction: column), wyrównane do lewej, z odstępem 6 px, karty są w jednej kolumnie, a odstęp w nagłówku glowa wynosi 12 px',
];

const skryptyPhp = [
  { nr: 1, tytul: 'najnowsze', lines: ['Wysyła do bazy danych zapytanie 1', 'Dla każdego zwróconego rekordu tworzy element listy, w którym godzina jest zapisana w znaczniku time, a za nią tytuł jako odnośnik prowadzący do #'] },
  {
    nr: 2,
    tytul: 'karty działu Biznes',
    lines: ['Wysyła do bazy danych zapytanie 2',
      {
        text: 'Dla każdego zwróconego rekordu tworzy element article z klasą karta, zawierający:',
        children: [
          'blok div z klasami obraz oraz o1, o2 lub o3 – numer klasy jest numerem kolejnej karty (pierwsza karta o1, druga o2, trzecia o3)',
          'blok div z klasą tekst, a w nim: element span z klasą kat o treści „Biznes”, nagłówek trzeciego stopnia z odnośnikiem (#), którego treścią jest tytuł, paragraf z zajawką i paragraf z klasą meta z datą publikacji',
        ],
      }],
  },
  { nr: 3, tytul: 'najczęściej czytane', lines: ['Wysyła do bazy danych zapytanie 3', 'Dla każdego zwróconego tytułu tworzy element listy zawierający element span z klasą nr i numerem pozycji (od 1 do 5) oraz odnośnik (#) z tytułem', 'Elementy span trzech pierwszych pozycji mają dodatkowo klasę top'] },
];
const skryptJs = ['Wywoływany po kliknięciu przycisku „Zapisz się”', 'Pobiera wartość z pola o identyfikatorze email', 'Jeżeli wartość zawiera znak @: w paragrafie o identyfikatorze komunikat wyświetla tekst „Dziękujemy! Podsumowanie wyślemy na adres <adres>”, gdzie <adres> to wpisana wartość, i nadaje paragrafowi klasę sukces (ilustracja 4)', 'W przeciwnym razie wyświetla w tym paragrafie tekst „Podaj poprawny adres e-mail” i nadaje mu klasę blad'];

const SQL_POMOC = [
  ['DATE_FORMAT(data, \'%H:%i\')', 'Godzina i minuty, np. 10:42'],
  ['DATE_FORMAT(data, \'%d.%m.%Y %H:%i\')', 'Data i godzina, np. 17.11.2026 08:40'],
  ['LIMIT n', 'Ogranicza wynik do n pierwszych wierszy'],
];
const CSS_POMOC = [
  ['position: sticky; top: 0', 'Element przewija się z treścią, a po dojściu do górnej krawędzi okna zostaje do niej przyklejony'],
  ['grid-template-columns: 2fr 1fr', 'Dwie kolumny, pierwsza dwa razy szersza od drugiej'],
  ['grid-row: 1 / 3', 'Element zajmuje wiersze od linii 1 do linii 3 (dwa wiersze)'],
  ['repeat(3, 1fr)', 'Trzy równe kolumny'],
  ['aspect-ratio: 16 / 9', 'Wysokość elementu wynika z jego szerokości w proporcji 16 : 9'],
  ['linear-gradient(135deg, #614385, #516395)', 'Gradient ukośny między dwoma kolorami'],
  ['linear-gradient(to top, rgba(0, 0, 0, 0.85), transparent)', 'Gradient od dołu: od czarnego półprzezroczystego do przezroczystości'],
  ['text-transform: uppercase', 'Wszystkie litery wielkie'],
  ['letter-spacing: -0.5px', 'Zmniejszenie odstępów między literami'],
  ['flex: none', 'Element nie rozciąga się i nie zwęża w układzie flex'],
  ['place-items: center', 'Zawartość siatki wyśrodkowana w obu kierunkach'],
  ['overflow-x: auto', 'Poziomy pasek przewijania, gdy zawartość się nie mieści'],
];
const DOM = [
  ['document.getElementById(id)', 'element.innerHTML = "wartość"'],
  ['element.value', 'element.className = "klasa"'],
  ['napis.includes(\'@\')', 'true, gdy napis zawiera podany znak'],
];

const sheet = `${titlePage(KOD, 'Kurier24 – portal informacyjny')}
<section class="page task">
  <h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową portalu informacyjnego Kurier24, wykorzystując pakiet XAMPP oraz edytor zaznaczający składnię.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>

  <h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera połączone relacją tabele przedstawione na ilustracji 1. Tabela kategorie zawiera działy portalu, tabela artykuly – artykuły z datą i godziną publikacji oraz liczbą wyświetleń. Nazwa serwisu, artykuły i dane są wymyślone.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>kurier</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku kurier.sql do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie PNG pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie kurier. Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie PNG i nadaj im nazwy kw1, kw2, kw3, kw4, kw5. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>
  <p>W tabeli 1 zamieszczono wybrane elementy języka SQL.</p>

  <h3>Witryna internetowa</h3>
  ${frame(podglad, 2, 'Wygląd witryny internetowej na ekranie o szerokości 1280 px, kursor na pierwszej karcie działu Biznes; dane pochodzą z bazy', 1280, 0.5)}
  <div class="with-layout"><div>
  ${frame(podgladNewsletter, 4, 'Panel boczny po wpisaniu adresu i kliknięciu „Zapisz się”', 344, 0.6, { cls: 'newsletter' })}
  </div><figure class="layout">${uklad}<figcaption>Ilustracja 3. Układ bloków</figcaption></figure></div>
  ${frame(podglad, 5, 'Wygląd witryny na ekranie o szerokości 400 px (początek strony)', 400, 0.6, { cls: 'mobile' })}
  <p>Cechy witryny:</p>
  ${renderLines(cechy)}

  <h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. W tabeli 3 zamieszczono pomoc do niektórych właściwości CSS. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(css)}
  <p class="note">Uwaga: styl CSS ciała strony, odnośnika oraz list należy zdefiniować wyłącznie przy pomocy selektora tych znaczników. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.</p>

  <h3>Skrypty działające po stronie serwera (PHP)</h3>
  <p>W tabeli 2 zamieszczono wybrane funkcje PHP. Wymagania dotyczące skryptów:</p>
  ${renderLines(['Napisane w języku PHP', 'Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim', 'Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie kurier', 'Na końcu zamykane jest połączenie z serwerem'])}
  ${skryptyPhp.map((s) => `<p class="script-name">Skrypt ${s.nr} (${s.tytul}):</p>${renderLines(s.lines)}`).join('')}
  <h3>Skrypt działający po stronie klienta (JavaScript)</h3>
  <p>W tabeli 4 zamieszczono wybrane pola i metody języka JavaScript. Skrypt jest napisany w języku JavaScript (w pliku skrypt.js lub w znaczniku script), należy stosować znaczące nazewnictwo zmiennych i funkcji.</p>
  <p class="script-name">Skrypt 4 (newsletter):</p>${renderLines(skryptJs)}

  <div class="help-tables">
  ${table2('Tabela 1. Wybrane elementy języka SQL (MySQL)', ['Zapis', 'Znaczenie'], esc(SQL_POMOC))}
  ${table2('Tabela 2. Wybrane funkcje języka PHP', ['Funkcja', 'Zwracana wartość'], esc(MYSQLI))}
  ${table2('Tabela 3. Wybrane właściwości CSS', ['Zapis', 'Znaczenie'], esc(CSS_POMOC))}
  ${table2('Tabela 4. Wybrane pola i metody języka JavaScript', ['Wyszukiwanie i odczyt', 'Zmiana elementów'], esc(DOM))}
  </div>

  <p class="note">UWAGA: po zakończeniu pracy utwórz plik tekstowy o nazwie przeglądarka.txt. Zapisz w nim nazwę przeglądarki internetowej, w której weryfikowana była poprawność działania witryny. Umieść go w folderze z numerem zdającego.</p>
  <p>W folderze z numerem zdającego powinny znajdować się pliki: import.png, index.php, kw1.png, kw2.png, kw3.png, kw4.png, kw5.png, kwerendy.txt, przeglądarka.txt, skrypt.js, styl.css, ewentualnie inne przygotowane pliki. Spakuj folder do archiwum ZIP o nazwie równej numerowi zdającego i prześlij je w sposób wskazany przez nauczyciela.</p>
  <p><b>Czas przeznaczony na wykonanie zadania wynosi 150 minut.</b></p>
  <p>Ocenie podlegać będzie 5 rezultatów:</p>
  ${renderLines(['operacje na bazie danych,', 'zawartość witryny internetowej,', 'działanie witryny internetowej,', 'styl CSS witryny internetowej,', 'skrypty.'])}
</section>`;

// Ilustracja 2: cień na pierwszej karcie Biznesu (efekt :hover). Ilustracja 4: tylko panel boczny, po kliknięciu "Zapisz się".
const sheetHtml = sheetDocument(`${KOD} – Kurier24 – arkusz ćwiczeniowy`, sheet, `
figure.preview.mobile .frame-wrap { height: 900px !important; overflow: hidden; }
`, `
document.querySelectorAll('figure.preview iframe.site').forEach(function (f, i) {
  f.addEventListener('load', function () {
    try {
      var d = f.contentDocument;
      if (i === 0) d.querySelector('.karta').style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.15)';
      if (f.closest('.newsletter')) { d.querySelector('.box form button').click(); dopasuj(); }
    } catch (e) {}
  });
});
`);
P.write('arkusz.html', sheetHtml);

// ---------- klucz ----------
const sqlZ = P.sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));
const wyniki = [
  'widocznych jest dokładnie 6 wierszy od 10:42 „Wojewoda ostrzega…” do 09:22 „Szkoły wprowadzają…”, godziny w formacie GG:MM',
  'widoczne są dokładnie 3 wiersze: „Inflacja w listopadzie…” (17.11.2026 08:40), „Polskie startupy…” (07:35), „Eksport rolno-spożywczy…” (05:30)',
  'widocznych jest dokładnie 5 tytułów w kolejności: „Jak przygotować dom…”, „Pięć błędów…”, „Prognoza pogody…”, „Test: który smartfon…”, „Przepis na… zupę dyniową”',
  'widocznych jest 5 wierszy: Biznes 4, Kultura 1, Lifestyle 3, Polska 5, Technologia 2 (kolejność dowolna)',
  'widoczny jest komunikat o zmianie 1 wiersza',
];
const R = [
  ['Operacje na bazie danych', [
    'Wykonany import tabel do bazy danych kurier, co jest udokumentowane w pliku import w formacie PNG',
    'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
    ...sqlZ.map((q, i) => `Wykonane zapytanie ${i + 1}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${q} oraz wynik działania udokumentowany zrzutem kw${i + 1}, na którym ${wyniki[i]}`),
  ]],
  ['Zawartość witryny internetowej', [
    'Witryna zapisana w pliku index.php, jawnie zapisany standard kodowania polskich znaków, deklaracja <!DOCTYPE html>, język polski, meta viewport, tytuł „Kurier24 – wiadomości z kraju i ze świata”',
    'Bloki zdefiniowane zgodnie z ilustracją 3: div gorny-pasek, header glowa, div pilne, div strona z section hero i div tresc (main, aside boczna), footer stopka',
    'Górny pasek: data w span, blok gorny-prawa ze span pogoda-mala i dwoma odnośnikami',
    'Nagłówek: odnośnik logo do index.php z „24” w osobnym span, nav glowne z listą ośmiu odnośników',
    'Pasek pilne: tekst „Pilne” w znaczniku strong i odnośnik z treścią komunikatu',
    'Sekcja hero: trzy elementy article (klasy glowny t1, t2, t3), w każdym odnośnik podpis z etykietą (span) i nagłówkiem h2; paragraf meta tylko w pierwszym',
    'W main: trzy nagłówki h2 z klasą naglowek-sekcji („Najnowsze”, „Biznes”, „Sport”), lista ul najnowsze i dwie sekcje karty',
    'Sekcja Sport: trzy karty article z blokami obraz o1–o3, kategorią w span kat, nagłówkiem h3 z odnośnikiem, zajawką i paragrafem meta',
    'Panel boczny: trzy sekcje box z nagłówkami h2; lista ol popularne; blok pogoda ze span temp i strong „Białystok”',
    'Formularz newslettera: etykieta powiązana z polem przez for/id, pole typu email z podpowiedzią, przycisk „Zapisz się”, paragraf z id komunikat',
    'Stopka: stopka-kolumny z czterema blokami (h4 i lista trzech odnośników) oraz paragraf prawa „Stronę wykonał: ” z numerem zdającego',
  ]],
  ['Działanie witryny internetowej', [
    'Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracjami 2 i 3; panel boczny ma 320 px szerokości',
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów styl.css, formatowanie CSS pochodzi jedynie z tego arkusza',
    'Nagłówek z menu pozostaje przyklejony do górnej krawędzi okna podczas przewijania strony i leży nad treścią',
    'Lista „Najnowsze” zawiera 6 pozycji z godzinami od 10:42 do 09:22 (dane z bazy)',
    'Sekcja Biznes zawiera 3 karty z bazy (Inflacja…, Polskie startupy…, Eksport…) z kolejnymi gradientami o1, o2, o3 i datą publikacji',
    '„Najczęściej czytane” zawiera 5 tytułów z bazy; numery 1–3 są czerwone, 4–5 granatowe',
    'Kliknięcie „Zapisz się” z adresem zawierającym @ wyświetla zielony komunikat z wpisanym adresem; bez @ – czerwony pogrubiony komunikat o błędzie',
    'Przy szerokości do 900 px sekcja hero i treść są w jednej kolumnie, stopka w dwóch; do 560 px karty są jedna pod drugą, temperatura w górnym pasku ukryta, pasek „Pilne” w kolumnie',
  ]],
  ['Styl CSS witryny internetowej', css.map((c) => `Ustawione ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
  ['Skrypty', [
    'Skrypt PHP łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza kurier (np. mysqli_connect)',
    'Skrypt 1 wysyła zapytanie 1 i dla każdego rekordu tworzy element li z godziną w znaczniku time i tytułem w odnośniku',
    'Skrypt 2 wysyła zapytanie 2 i dla każdego rekordu tworzy element article z klasą karta, blokiem obraz i blokiem tekst z kategorią, nagłówkiem h3 z odnośnikiem, zajawką i datą w paragrafie meta',
    'Skrypt 2 nadaje kolejnym kartom klasy o1, o2, o3 (licznik w pętli)',
    'Skrypt 3 wysyła zapytanie 3 i dla każdego tytułu tworzy element li ze span nr z numerem pozycji i odnośnikiem',
    'Skrypt 3 dodaje klasę top tylko trzem pierwszym pozycjom',
    'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)',
    'Skrypt 4 jest napisany w języku JavaScript, uruchamiany kliknięciem przycisku „Zapisz się”, odczytuje wartość pola email',
    'Skrypt 4 sprawdza obecność znaku @ i wyświetla odpowiedni komunikat w paragrafie komunikat',
    'Skrypt 4 nadaje paragrafowi klasę sukces lub blad zależnie od wyniku sprawdzenia',
    'Zastosowano znaczące nazewnictwo zmiennych i funkcji',
  ]],
];
const key = keyDocument({
  title: `${KOD} – Kurier24 – klucz`,
  heading: 'Kurier24 – zasady oceniania i rozwiązanie',
  meta: `${KOD} · baza kurier · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>).`,
  R,
  files: ['kwerendy.txt', 'index.php', 'styl.css', 'skrypt.js'].map((f) => [f, P.sol(f)]),
});
P.write('klucz.html', key.html);
console.log(`arkusz.html, klucz.html (kryteria: ${key.total})`);
