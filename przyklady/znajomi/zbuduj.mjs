// Buduje arkusz egzaminacyjny "Znajomi" (styl INF.03) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/znajomi/zbuduj.mjs
// Wejście: dla_zdajacego/znajomi.sql, rozwiazanie/* (podglad.html - wynik działania index.php z bazą).
import { fileURLToPath } from 'node:url';
import { project, previewDoc, frame, table2, esc, layoutSvg, titlePage, sheetDocument, keyDocument, renderLines, schemaSvg, h, MYSQLI } from '../wspolne.mjs';

const P = project(fileURLToPath(new URL('.', import.meta.url)));
const KOD = 'INF.03-ZN-SG';
const ARCHIWUM = { nazwa: 'znajomi', haslo: 'Zn@jomi!2026' };

const podglad = previewDoc(P.sol);

const schema = schemaSvg({
  tables: [
    {
      name: 'uzytkownicy',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'imie', type: 'VARCHAR(30)' }, { name: 'nazwisko', type: 'VARCHAR(30)' }, { name: 'kolor', type: 'INT' },
        { name: 'online', type: 'TINYINT(1)' }, { name: 'status', type: 'VARCHAR(15)' }, { name: 'wspolni', type: 'INT' }, { name: 'data_urodzenia', type: 'DATE' }],
    },
    {
      name: 'posty',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'uzytkownicy_id', type: 'INT', role: 'fk', ref: 'uzytkownicy' }, { name: 'tresc', type: 'VARCHAR(250)' },
        { name: 'tlo', type: 'TINYINT(1)' }, { name: 'obraz', type: 'INT' }, { name: 'dodano', type: 'DATETIME' }, { name: 'polubienia', type: 'INT' }, { name: 'komentarze', type: 'INT' }, { name: 'udostepnienia', type: 'INT' }],
    },
  ],
});

const uklad = layoutSvg([
  ['pasek górny (header.pasek) – przypięty: lewa | środek | prawa', 30],
  ['strona (div.strona): aside.lewa | main.feed | aside.prawa', 150],
]);

const zapytania = [
  'Zapytanie 1: wybierające identyfikator posta, inicjały autora (pierwsza litera imienia i pierwsza litera nazwiska, połączone, np. AK; kolumna o nazwie „inicjaly”), imię, nazwisko i kolor autora, datę dodania w formacie DD.MM.RRRR GG:MM (kolumna „data”) oraz treść, pola tlo i obraz, liczbę polubień, komentarzy i udostępnień wszystkich postów, posortowane od najnowszego. Należy posłużyć się relacją',
  'Zapytanie 2: wybierające inicjały (jak w zapytaniu 1), imię, nazwisko, kolor oraz pole online użytkowników, których status ma wartość „znajomy”',
  'Zapytanie 3: wybierające inicjały, imię, nazwisko, kolor oraz liczbę wspólnych znajomych użytkowników o statusie „zaproszenie”, posortowane malejąco według liczby wspólnych znajomych',
  'Zapytanie 4: wybierające jedynie imię i nazwisko użytkowników, którzy urodzili się 17 listopada (dowolnego roku)',
  'Zapytanie 5: zliczające znajomych (status „znajomy”), którzy są aktualnie online (pole online równe 1); kolumna z wynikiem ma nazwę „liczba”',
];

const cechy = [
  'Składa się ze strony o nazwie index.php',
  'Zapisana w języku HTML5, zadeklarowany polski język zawartości witryny, jawnie zastosowany standard kodowania polskich znaków, znacznik meta viewport',
  'Tytuł strony widoczny na karcie przeglądarki: „Znajomi – strona główna”',
  'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony; wygląd w całości w CSS, bez stylów w atrybutach (również gradienty są ustawiane klasami)',
  'Podział strony na bloki zrealizowany za pomocą znaczników semantycznych HTML5 zgodnie z ilustracją 3',
  'Awatar to element span z klasą avatar i klasą koloru a1–a8, zawierający inicjały osoby (np. <span class="avatar a7">JN</span>)',
  {
    text: 'Pasek górny (header z klasą pasek) z trzema częściami:',
    children: [
      'blok div z klasą pasek-lewa: odnośnik z klasą logo do index.php o treści „Z” oraz pole tekstowe z klasą szukaj i podpowiedzią „Szukaj wśród znajomych”',
      'blok nawigacyjny (nav) z klasą pasek-srodek z listą punktowaną pięciu odnośników o treściach 🏠, 👥, 🎬, 🛍, 👪 i podpowiedziach (atrybut title) „Start”, „Znajomi”, „Wideo”, „Sklep”, „Grupy”; pierwszy odnośnik ma klasę aktywny',
      'blok div z klasą pasek-prawa: dwa przyciski z klasą okragly (💬 „Wiadomości”, 🔔 „Powiadomienia” w atrybucie title) oraz awatar JN w kolorze a7',
    ],
  },
  'Blok div z klasą strona, a w nim: lewy panel (aside z klasą lewa), blok główny (main z klasą feed) i prawy panel (aside z klasą prawa)',
  'Lewy panel: lista punktowana z klasą menu, z sześcioma odnośnikami; pierwszy zawiera awatar JN (a7) i span „Jan Nowak”, kolejne – element span z klasą ikona i span z napisem: 👥 „Znajomi”, 👪 „Grupy”, 📅 „Wydarzenia”, 🔖 „Zapisane”, 🕘 „Wspomnienia”',
  {
    text: 'Blok główny zawiera kolejno:',
    children: [
      'sekcję z klasą relacje z czterema artykułami z klasą relacja: pierwszy z dodatkową klasą dodaj zawiera span z klasą plus („+”) i span z klasą imie „Dodaj relację”; kolejne (klasy r1, r2, r3) zawierają awatar i span z klasą imie: AK (a1) „Anna Kowalska”, PW (a2) „Piotr Wiśniewski”, MZ (a4) „Marek Zieliński”',
      'sekcję z klasami karta i nowy-post: blok nowy-gora z awatarem JN i polem tekstowym z podpowiedzią „Co słychać, Janie?” oraz blok nowy-dol z przyciskami „🎥 Wideo”, „🖼 Zdjęcie”, „😊 Nastrój”',
      'posty wygenerowane przez skrypt 1',
      'na końcu stopkę (footer) z klasą autor-strony o treści „Stronę wykonał: ”, dalej wstawiony numer zdającego',
    ],
  },
  {
    text: 'Prawy panel zawiera trzy sekcje z nagłówkami drugiego stopnia:',
    children: [
      '„Zaproszenia do znajomych” – zawartość generuje skrypt 2',
      '„Urodziny” – paragraf z klasą urodziny o treści „🎂 Dziś urodziny ma Ewa Lis.”, gdzie „Ewa Lis” jest pogrubione znacznikiem strong',
      '„Kontakty” – lista punktowana z klasą kontakty, wypełniona przez skrypt 3',
    ],
  },
  'Wszystkie przyciski są typu button, a wszystkie odnośniki poza logo prowadzą do adresu #',
];

const css = [
  'Domyślnie dla wszystkich selektorów (*): marginesy zewnętrzne i wewnętrzne 0, model pudełkowy border-box. Dla selektora ciała strony: kolor tła #F0F2F5, kolor czcionki #1C1E21, krój Arial, w przypadku braku Helvetica, a następnie sans-serif, wysokość linii 1,4',
  'Dla selektora odnośnika: kolor dziedziczony, bez podkreślenia. Dla selektora listy punktowanej: brak punktorów. Dla selektorów przycisku i pola input: czcionka dziedziczona (font: inherit); przyciski mają kursor w kształcie wskazującej dłoni',
  'Dla klasy avatar: pozycjonowanie względne, element nie zmienia rozmiaru w układzie flex (flex: none), siatka z zawartością wyśrodkowaną (place-items: center), szerokość i wysokość 40 px, kształt koła, biały pogrubiony tekst 0,9 rem. Awatar z klasą maly: 32 × 32 px, 0,78 rem',
  'Kolory tła awatarów: a1 #E17055, a2 #6C5CE7, a3 #E84393, a4 #00A8A8, a5 #F39C12, a6 #2D98DA, a7 #0E9F8E, a8 #34495E',
  'Dla klasy online: pseudoelement ::after z pustą zawartością, pozycjonowany bezwzględnie 1 px poza prawą i dolną krawędzią awatara (right i bottom: -1px), 12 × 12 px, kolor tła #31A24C, biała ramka 2 px, kształt koła – zielona kropka „dostępny”',
  'Dla klasy pasek: przypięty do górnej krawędzi okna (position: fixed, top, left, right: 0) nad pozostałą treścią (z-index: 50), siatka z trzema kolumnami 1fr auto 1fr, elementy wyśrodkowane w pionie, wysokość 56 px, marginesy wewnętrzne: lewy i prawy 16 px, białe tło, cień 0 1px 3px w kolorze czarnym o nieprzezroczystości 0,2',
  'Dla klasy pasek-lewa: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 10 px. Dla klasy logo: siatka z wyśrodkowaną zawartością, 40 × 40 px, kolor tła #0E9F8E, biały tekst, kształt koła, rozmiar 1,5 rem, pogrubienie',
  'Dla klasy szukaj: szerokość 240 px, marginesy wewnętrzne 10 px / 14 px, kolor tła #F0F2F5, bez obramowania i bez obrysu (outline), zaokrąglenie 20 px',
  'Dla listy w klasie pasek-srodek: układ elastyczny, odstęp 6 px. Odnośniki: siatka z wyśrodkowaną zawartością, 100 × 56 px, dolne obramowanie 3 px przezroczyste, zaokrąglone tylko górne rogi (8 px), rozmiar 1,5 rem; gdy kursor znajdzie się na odnośniku – tło #F0F2F5; odnośnik z klasą aktywny ma dolne obramowanie w kolorze #0E9F8E',
  'Dla klasy pasek-prawa: układ elastyczny, elementy dosunięte do prawej (justify-content: flex-end) i wyśrodkowane w pionie, odstęp 8 px. Dla klasy okragly: 40 × 40 px, tło #E4E6EB, bez obramowania, kształt koła, rozmiar 1,1 rem; gdy kursor znajdzie się na przycisku – tło #D8DADF',
  'Dla klasy strona: siatka z trzema kolumnami: 280 px, środkowa od 0 do 680 px (minmax(0, 680px)), 300 px, kolumny wyśrodkowane w poziomie (justify-content: center), odstęp 24 px, marginesy wewnętrzne: górny 72 px, lewy i prawy 16 px, dolny 24 px, elementy wyrównane do góry',
  'Dla klas lewa i prawa: pozycjonowanie przyklejone (sticky) 72 px od górnej krawędzi okna',
  'Dla odnośników w klasie menu: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 12 px, marginesy wewnętrzne 8 px, zaokrąglenie 8 px, pogrubienie, 0,95 rem; gdy kursor znajdzie się na odnośniku – tło #E4E6EB. Dla klasy ikona: siatka z wyśrodkowaną zawartością, 40 × 40 px, tło #E4E6EB, kształt koła, 1,2 rem',
  'Dla klasy relacje: układ elastyczny, odstęp 8 px, dolny margines 16 px, poziomy pasek przewijania widoczny tylko wtedy, gdy relacje się nie mieszczą',
  'Dla klasy relacja: pozycjonowanie względne, stała szerokość 110 px bez rozciągania i zwężania (flex: 0 0 110px), wysokość 190 px, zaokrąglenie 10 px, ukryta zawartość wychodząca poza element, biały tekst, kursor w kształcie dłoni, płynne przejście transformacji 0,2 s; gdy kursor znajdzie się na relacji, jest ona powiększana 1,03 raza (scale)',
  'Tło relacji – gradient liniowy pod kątem 160 stopni: klasa r1 od #F6D365 do #FDA085, r2 od #84FAB0 do #8FD3F4, r3 od #A18CD1 do #FBC2EB',
  'Dla awatara w relacji: pozycjonowanie bezwzględne 10 px od górnej i lewej krawędzi, 36 × 36 px, ramka 3 px linią ciągłą #0E9F8E, 0,75 rem. Dla klasy imie w relacji: pozycjonowanie bezwzględne 10 px od lewej, prawej i dolnej krawędzi, 0,82 rem, pogrubienie, cień tekstu 0 1px 3px czarny o nieprzezroczystości 0,6',
  'Dla relacji z klasą dodaj: układ elastyczny kolumnowy, elementy wyśrodkowane w obu kierunkach, odstęp 10 px, białe tło, kolor tekstu #1C1E21, cień 0 1px 2px czarny o nieprzezroczystości 0,2; jej klasa imie ma zwykłe pozycjonowanie (static), tekst wyśrodkowany, bez cienia. Dla klasy plus: siatka z wyśrodkowaną zawartością, 40 × 40 px, tło #0E9F8E, biały tekst, kształt koła, 1,6 rem',
  'Dla klasy karta: dolny margines 16 px, białe tło, zaokrąglenie 8 px, cień 0 1px 2px czarny o nieprzezroczystości 0,2',
  'Dla klasy nowy-gora: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 10 px, marginesy wewnętrzne 12 px / 16 px; pole tekstowe w tym bloku zajmuje wolne miejsce (flex: 1), marginesy wewnętrzne 10 px / 14 px, tło #F0F2F5, bez obramowania i obrysu, zaokrąglenie 20 px',
  'Dla klas nowy-dol i akcje: układ elastyczny, marginesy zewnętrzne: lewy i prawy 16 px, górne obramowanie 1 px #DDD; marginesy wewnętrzne górny i dolny: 6 px (nowy-dol) i 4 px (akcje)',
  'Dla przycisków w klasach nowy-dol i akcje (jedna wspólna reguła): równy podział szerokości (flex: 1), marginesy wewnętrzne 8 px, bez tła i obramowania, zaokrąglenie 6 px, kolor #65676B, pogrubienie; gdy kursor znajdzie się na przycisku – tło #F0F2F5. Przycisk z klasą polubione w klasie akcje ma kolor #0E9F8E',
  'Dla klasy post-naglowek: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 10 px, marginesy wewnętrzne 12 px / 16 px. Klasa autor zajmuje wolne miejsce (flex: 1); pogrubione imię w niej jest wyświetlane blokowo, a span ma kolor #65676B i 0,8 rem',
  'Dla klasy post-tekst: marginesy wewnętrzne: górny 0, lewy i prawy 16 px, dolny 12 px. Dla klasy post-obraz: wysokość 320 px; tło – gradient 135 stopni: klasa g1 od #F6D365 do #C0562C, g2 od #4FACFE do #00C6A7',
  'Dla klasy post-tlo: siatka z wyśrodkowaną zawartością, minimalna wysokość 240 px, marginesy wewnętrzne 24 px, tło – gradient 135 stopni od #0E9F8E do #2D98DA, biały pogrubiony tekst 1,6 rem wyśrodkowany',
  'Dla klasy statystyki: układ elastyczny, elementy rozsunięte do krawędzi, marginesy wewnętrzne 10 px / 16 px, kolor #65676B, 0,88 rem. Dla klasy autor-strony: marginesy wewnętrzne: górny 8 px, dolny 16 px, kolor #65676B, 0,85 rem, tekst wyśrodkowany',
  'Dla sekcji w klasie prawa: dolny margines 16 px, dolny margines wewnętrzny 12 px, dolne obramowanie 1 px #DDD; nagłówki: dolny margines 10 px, kolor #65676B, 1 rem. Dla klasy urodziny: 0,92 rem',
  'Dla klasy zaproszenie: układ elastyczny, odstęp 10 px, dolny margines 12 px; paragraf w zaproszeniu: kolor #65676B, 0,8 rem. Dla klasy przyciski: układ elastyczny, odstęp 6 px, górny margines 6 px; przyciski: równy podział szerokości, marginesy wewnętrzne 7 px / 10 px, bez obramowania, zaokrąglenie 6 px, 0,85 rem, pogrubienie',
  'Dla klasy btn-glowny: tło #0E9F8E, biały tekst, po najechaniu tło #0B8577. Dla klasy btn-szary: tło #E4E6EB, tekst #1C1E21, po najechaniu tło #D8DADF',
  'Dla odnośników w klasie kontakty: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 10 px, marginesy wewnętrzne 6 px / 8 px, zaokrąglenie 8 px, 0,92 rem, pogrubienie; gdy kursor znajdzie się na odnośniku – tło #E4E6EB',
  'W przypadku ekranów o szerokości do 1100 px: siatka klasy strona ma dwie kolumny (240 px i minmax(0, 680px)), a prawy panel jest ukryty',
  'W przypadku ekranów o szerokości do 800 px: siatka strony ma jedną kolumnę (minmax(0, 680px)), ukryte są lewy panel, pole wyszukiwania i przyciski okragly w pasku; odnośniki w pasek-srodek mają szerokość 56 px, a post-obraz wysokość 220 px',
  'W przypadku ekranów o szerokości do 560 px (ilustracja 4): pasek ma marginesy wewnętrzne lewy i prawy 10 px, odstęp w liście pasek-srodek 2 px, a odnośniki w niej szerokość 44 px',
];

const skryptyPhp = [
  {
    nr: 1,
    tytul: 'posty',
    lines: ['Wysyła do bazy danych zapytanie 1',
      {
        text: 'Dla każdego postu tworzy element article z klasami karta i post, zawierający:',
        children: [
          'blok div z klasą post-naglowek: awatar autora (klasa koloru a + pole kolor, np. a4, treść – inicjały), blok div z klasą autor z imieniem i nazwiskiem w znaczniku strong i datą w elemencie span, przycisk z klasą okragly o treści „…”',
          'jeżeli pole tlo ma wartość 1: blok div z klasą post-tlo z treścią postu; w przeciwnym razie paragraf z klasą post-tekst z treścią, a pod nim – tylko gdy pole obraz nie jest puste – blok div z klasami post-obraz oraz g + pole obraz (np. g2)',
          'blok div z klasą statystyki z dwoma elementami span: „👍 ” i liczba polubień zapisana w osobnym elemencie span o identyfikatorze lajki + id postu (np. lajki2) oraz „Komentarze: <liczba> · Udostępnienia: <liczba>”',
          'blok div z klasą akcje z trzema przyciskami: „👍 Lubię to” (kliknięcie uruchamia skrypt 4 dla tego postu), „💬 Komentarz”, „↗ Udostępnij”',
        ],
      }],
  },
  { nr: 2, tytul: 'zaproszenia', lines: ['Wysyła do bazy danych zapytanie 3', 'Dla każdej osoby tworzy blok div z klasą zaproszenie zawierający awatar oraz blok div z imieniem i nazwiskiem w znaczniku strong, paragrafem „Wspólni znajomi: <liczba>” i blokiem div z klasą przyciski z przyciskami „Potwierdź” (klasa btn-glowny) i „Usuń” (klasa btn-szary)'] },
  { nr: 3, tytul: 'kontakty', lines: ['Wysyła do bazy danych zapytanie 2', 'Dla każdego znajomego tworzy element listy z odnośnikiem (#) zawierającym awatar i element span z imieniem i nazwiskiem', 'Awatar osoby, której pole online ma wartość 1, ma dodatkowo klasę online'] },
];
const skryptJs = [
  'Wywoływany po kliknięciu przycisku „👍 Lubię to” w dowolnym poście; otrzymuje kliknięty przycisk i numer postu',
  'Jeżeli przycisk nie ma klasy polubione: zwiększa o 1 liczbę polubień wyświetlaną w elemencie o identyfikatorze lajki + numer postu i dodaje przyciskowi klasę polubione (ilustracja 2 – pierwszy post)',
  'Jeżeli przycisk ma już klasę polubione: zmniejsza tę liczbę o 1 i usuwa klasę polubione (ponowne kliknięcie cofa polubienie)',
];

const SQL_POMOC = [
  ['LEFT(napis, n)', 'n pierwszych znaków napisu'],
  ['CONCAT(napis1, napis2, …)', 'Połączone napisy'],
  ['DATE_FORMAT(data, \'%d.%m.%Y %H:%i\')', 'Data i godzina, np. 17.11.2026 08:05'],
  ['DAY(data), MONTH(data)', 'Dzień, miesiąc z daty'],
];
const PHP_POMOC = [['mysqli_fetch_array(wynik)[\'kolumna\']', 'Wartość kolumny o podanej nazwie z bieżącego wiersza']];
const CSS_POMOC = [
  ['position: fixed', 'Element przypięty do okna – nie przewija się z treścią'],
  ['position: sticky; top: 72px', 'Element przewija się, a po dojściu do 72 px od góry okna zostaje w miejscu'],
  ['grid-template-columns: 1fr auto 1fr', 'Środkowa kolumna o szerokości zawartości, boczne dzielą resztę po równo'],
  ['minmax(0, 680px)', 'Kolumna o szerokości od 0 do 680 px'],
  ['flex: 0 0 110px', 'Element o szerokości 110 px, który się nie rozciąga i nie zwęża'],
  ['.online::after { content: ""; }', 'Pseudoelement wstawiany na końcu elementu'],
  ['transform: scale(1.03)', 'Powiększenie elementu 1,03 raza'],
  ['text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6)', 'Cień tekstu'],
  ['outline: none', 'Brak obrysu pola po kliknięciu'],
  ['border-radius: 8px 8px 0 0', 'Zaokrąglone tylko górne rogi'],
];
const DOM = [
  ['document.getElementById(id)', 'element.innerHTML = wartość'],
  ['element.classList.contains("klasa")', 'element.classList.add("klasa")'],
  ['Number(napis)', 'element.classList.remove("klasa")'],
  ['onclick="funkcja(this, 2)"', 'this – kliknięty element'],
];

const sheet = `${titlePage(KOD, 'Znajomi – serwis społecznościowy')}
<section class="page task">
  <h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową serwisu społecznościowego Znajomi, wykorzystując pakiet XAMPP oraz edytor zaznaczający składnię.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>

  <h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera połączone relacją tabele przedstawione na ilustracji 1. W tabeli uzytkownicy pole kolor to numer koloru awatara (1–8), pole status przyjmuje wartości: ja, znajomy, zaproszenie, strona, a pole wspolni to liczba wspólnych znajomych. W tabeli posty pole tlo ma wartość 1 dla postów z dużym napisem na kolorowym tle, a pole obraz zawiera numer obrazu (1 lub 2) albo jest puste. Serwis, osoby i wpisy są wymyślone.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>znajomi</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku znajomi.sql do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie PNG pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie znajomi. Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie PNG i nadaj im nazwy kw1, kw2, kw3, kw4, kw5. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>
  <p>W tabeli 1 zamieszczono wybrane funkcje języka SQL.</p>

  <h3>Witryna internetowa</h3>
  ${frame(podglad, 2, 'Wygląd witryny na ekranie o szerokości 1280 px po jednokrotnym kliknięciu „Lubię to” w pierwszym poście (liczba polubień zwiększona z 24 na 25); kursor na drugiej relacji; dane pochodzą z bazy', 1280, 0.5)}
  <div class="with-layout"><div>
  ${frame(podglad, 4, 'Wygląd witryny na ekranie o szerokości 400 px (początek strony)', 400, 0.6, { cls: 'mobile' })}
  </div><figure class="layout">${uklad}<figcaption>Ilustracja 3. Układ bloków</figcaption></figure></div>
  <p>Cechy witryny:</p>
  ${renderLines(cechy)}

  <h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. W tabeli 3 zamieszczono pomoc do niektórych właściwości CSS. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(css)}
  <p class="note">Uwaga: styl CSS ciała strony, odnośnika, listy, przycisku i pola input należy zdefiniować wyłącznie przy pomocy selektora tych znaczników. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.</p>

  <h3>Skrypty działające po stronie serwera (PHP)</h3>
  <p>W tabeli 2 zamieszczono wybrane funkcje PHP. Wymagania dotyczące skryptów:</p>
  ${renderLines(['Napisane w języku PHP', 'Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim', 'Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie znajomi', 'Na końcu zamykane jest połączenie z serwerem'])}
  ${skryptyPhp.map((s) => `<p class="script-name">Skrypt ${s.nr} (${s.tytul}):</p>${renderLines(s.lines)}`).join('')}
  <h3>Skrypt działający po stronie klienta (JavaScript)</h3>
  <p>W tabeli 4 zamieszczono wybrane pola i metody modelu DOM. Skrypt jest napisany w języku JavaScript (w pliku skrypt.js lub w znaczniku script), należy stosować znaczące nazewnictwo zmiennych i funkcji.</p>
  <p class="script-name">Skrypt 4 (Lubię to):</p>${renderLines(skryptJs)}

  <div class="help-tables">
  ${table2('Tabela 1. Wybrane funkcje języka SQL (MySQL)', ['Funkcja', 'Zwracana wartość'], esc(SQL_POMOC))}
  ${table2('Tabela 2. Wybrane funkcje języka PHP', ['Funkcja', 'Zwracana wartość'], esc([...MYSQLI, ...PHP_POMOC]))}
  ${table2('Tabela 3. Wybrane właściwości CSS', ['Zapis', 'Znaczenie'], esc(CSS_POMOC))}
  ${table2('Tabela 4. Wybrane pola i metody modelu DOM', ['Wyszukiwanie i odczyt', 'Zmiana elementów'], esc(DOM))}
  </div>

  <p class="note">UWAGA: po zakończeniu pracy utwórz plik tekstowy o nazwie przeglądarka.txt. Zapisz w nim nazwę przeglądarki internetowej, w której weryfikowana była poprawność działania witryny. Umieść go w folderze z numerem zdającego.</p>
  <p>W folderze z numerem zdającego powinny znajdować się pliki: import.png, index.php, kw1.png, kw2.png, kw3.png, kw4.png, kw5.png, kwerendy.txt, przeglądarka.txt, skrypt.js, styl.css, ewentualnie inne przygotowane pliki. Spakuj folder do archiwum ZIP o nazwie równej numerowi zdającego i prześlij je w sposób wskazany przez nauczyciela.</p>
  <p><b>Czas przeznaczony na wykonanie zadania wynosi 150 minut.</b></p>
  <p>Ocenie podlegać będzie 5 rezultatów:</p>
  ${renderLines(['operacje na bazie danych,', 'zawartość witryny internetowej,', 'działanie witryny internetowej,', 'styl CSS witryny internetowej,', 'skrypty.'])}
</section>`;

// Ilustracja 2: polubiony pierwszy post i powiększona druga relacja (efekt :hover).
const sheetHtml = sheetDocument(`${KOD} – Znajomi – arkusz ćwiczeniowy`, sheet, `
figure.preview.mobile .frame-wrap { height: 820px !important; overflow: hidden; }
`, `
document.querySelectorAll('figure.preview:not(.mobile) iframe.site').forEach(function (f) {
  f.addEventListener('load', function () {
    try {
      var d = f.contentDocument;
      d.querySelector('.akcje button').click();
      d.querySelectorAll('.relacja')[2].style.transform = 'scale(1.03)';
    } catch (e) {}
  });
});
`);
P.write('arkusz.html', sheetHtml);

// ---------- klucz ----------
const sqlZ = P.sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));
const wyniki = [
  'widoczne są dokładnie 4 wiersze w kolejności: AK (17.11.2026 08:05), KI (17.11.2026 05:10), MZ (16.11.2026 19:12), PW (15.11.2026 20:30); pole obraz puste dla KI i PW',
  'widoczne są dokładnie 4 wiersze: AK, PW, EL, MZ z polami kolor i online (online = 0 tylko dla EL)',
  'widoczne są dokładnie 2 wiersze w kolejności: TN Tomek Nowicki (8), KD Kasia Dąbrowska (3)',
  'widoczny jest dokładnie jeden wiersz: Ewa Lis',
  'widoczny jest jeden wiersz z kolumną liczba o wartości 3',
];
const R = [
  ['Operacje na bazie danych', [
    'Wykonany import tabel do bazy danych znajomi, co jest udokumentowane w pliku import w formacie PNG',
    'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
    ...sqlZ.map((q, i) => `Wykonane zapytanie ${i + 1}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${q} oraz wynik działania udokumentowany zrzutem kw${i + 1}, na którym ${wyniki[i]}`),
  ]],
  ['Zawartość witryny internetowej', [
    'Witryna zapisana w pliku index.php, jawnie zapisany standard kodowania polskich znaków, deklaracja <!DOCTYPE html>, język polski, meta viewport, tytuł „Znajomi – strona główna”',
    'Bloki zdefiniowane znacznikami semantycznymi zgodnie z ilustracją 3: header pasek, div strona z aside lewa, main feed, aside prawa',
    'Pasek: pasek-lewa (logo do index.php, pole szukaj z podpowiedzią), nav pasek-srodek z pięcioma odnośnikami z atrybutami title (pierwszy z klasą aktywny), pasek-prawa z dwoma przyciskami okragly i awatarem JN',
    'Awatary zapisane jako span z klasami avatar i a1–a8 z inicjałami',
    'Lewy panel: lista menu z sześcioma odnośnikami (awatar JN i pięć ikon w span z klasą ikona)',
    'Sekcja relacje: cztery article z klasą relacja (dodaj z plusem, r1–r3 z awatarem i imieniem); gradienty ustawione klasami, a nie w atrybucie style',
    'Karta nowy-post: blok nowy-gora z awatarem i polem tekstowym z podpowiedzią, blok nowy-dol z trzema przyciskami typu button',
    'Prawy panel: trzy sekcje z nagłówkami h2 („Zaproszenia do znajomych”, „Urodziny”, „Kontakty”), paragraf urodziny z „Ewa Lis” w strong, lista ul kontakty',
    'Stopka (footer) autor-strony w bloku main z napisem „Stronę wykonał: ” i numerem zdającego',
  ]],
  ['Działanie witryny internetowej', [
    'Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracjami 2 i 3: trzy kolumny wyśrodkowane, pasek na górze',
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów styl.css, formatowanie CSS pochodzi jedynie z tego arkusza',
    'Pasek górny pozostaje na górze okna podczas przewijania, a lewy i prawy panel zatrzymują się 72 px od góry okna',
    'Wyświetlają się 4 posty z bazy w kolejności od najnowszego (Anna Kowalska, Klub Informatyków, Marek Zieliński, Piotr Wiśniewski); post Klubu jest napisem na kolorowym tle, post Piotra nie ma obrazu',
    'Zaproszenia: Tomek Nowicki (8 wspólnych), Kasia Dąbrowska (3); kontakty: 4 osoby, zielona kropka przy AK, PW i MZ, bez kropki przy EL',
    'Kliknięcie „Lubię to” zwiększa liczbę polubień danego postu o 1 i zmienia kolor napisu na #0E9F8E; ponowne kliknięcie przywraca poprzednią liczbę i kolor',
    'Przy szerokości do 1100 px znika prawy panel, do 800 px także lewy panel, wyszukiwarka i przyciski okrągłe; do 560 px ikony menu w pasku są węższe',
  ]],
  ['Styl CSS witryny internetowej', css.map((c) => `Ustawione ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
  ['Skrypty', [
    'Skrypt PHP łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza znajomi (np. mysqli_connect)',
    'Skrypt 1 wysyła zapytanie 1 i dla każdego postu tworzy article z klasami karta i post z nagłówkiem (awatar z klasą koloru z bazy, autor, data, przycisk „…”)',
    'Skrypt 1 wyświetla treść w bloku post-tlo, gdy pole tlo = 1, w przeciwnym razie w paragrafie post-tekst i blok post-obraz z klasą gN tylko dla niepustego pola obraz',
    'Skrypt 1 tworzy statystyki z liczbą polubień w span o id lajki + id postu oraz blok akcje z trzema przyciskami; „Lubię to” wywołuje skrypt 4 z numerem postu',
    'Skrypt 2 wysyła zapytanie 3 i tworzy bloki zaproszenie z awatarem, imieniem i nazwiskiem, liczbą wspólnych znajomych i dwoma przyciskami',
    'Skrypt 3 wysyła zapytanie 2 i tworzy elementy listy kontaktów z awatarem i imieniem i nazwiskiem; klasa online tylko dla osób z polem online = 1',
    'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)',
    'Skrypt 4 jest napisany w języku JavaScript, odczytuje liczbę polubień z elementu lajki + numer postu i zapisuje zmienioną wartość',
    'Skrypt 4 rozpoznaje stan przycisku po klasie polubione: dodaje klasę i zwiększa liczbę albo usuwa klasę i zmniejsza liczbę',
    'Zastosowano znaczące nazewnictwo zmiennych i funkcji',
  ]],
];
const key = keyDocument({
  title: `${KOD} – Znajomi – klucz`,
  heading: 'Znajomi – zasady oceniania i rozwiązanie',
  meta: `${KOD} · baza znajomi · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>).`,
  R,
  files: ['kwerendy.txt', 'index.php', 'styl.css', 'skrypt.js'].map((f) => [f, P.sol(f)]),
});
P.write('klucz.html', key.html);
console.log(`arkusz.html, klucz.html (kryteria: ${key.total})`);
