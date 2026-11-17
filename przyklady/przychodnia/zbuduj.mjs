// Buduje arkusz egzaminacyjny "Przychodnia Pod Lipami" (styl INF.03) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/przychodnia/zbuduj.mjs
// Wejście: dla_zdajacego/przychodnia.sql, logo.png, rozwiazanie/* - podglad.html (index.php po zapytaniu 5),
// podglad_zapis.html (po wysłaniu formularza), podglad_okulista.html (filtr bez wyników).
import { fileURLToPath } from 'node:url';
import { project, previewDoc, frame, table2, esc, layoutSvg, titlePage, sheetDocument, keyDocument, renderLines, schemaSvg, h, MYSQLI } from '../wspolne.mjs';

const P = project(fileURLToPath(new URL('.', import.meta.url)));
const KOD = 'INF.03-PM-SG';
const ARCHIWUM = { nazwa: 'przychodnia', haslo: 'L1pa+Zdrowie' };
const images = { 'logo.png': P.dataUri('logo.png', 'image/png') };

// Podgląd ekranowy: blok @media print wyłączony (inaczej działałby przy drukowaniu arkusza do PDF).
const ekran = (html) => html.replace('@media print', '@media (max-width: 1px)');
const podglad = ekran(previewDoc(P.sol, { images }));
const podgladZapis = ekran(previewDoc(P.sol, {
  file: 'podglad_zapis.html',
  images,
  extraCss: '.naglowek,.menu,.lekarze,.porady,.stopka{display:none}.uklad{grid-template-columns:1fr;padding:12px}.rejestracja{margin:0}',
}));
const podgladOkulista = ekran(previewDoc(P.sol, {
  file: 'podglad_okulista.html',
  images,
  extraCss: '.naglowek,.menu,.boczna,.stopka{display:none}.uklad{grid-template-columns:1fr;padding:12px}',
}));
// Widok wydruku: reguły @media print działają zawsze.
const podgladWydruk = previewDoc(P.sol, { images }).replace('@media print', '@media all');

const schema = schemaSvg({
  tables: [
    { name: 'lekarze', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'imie', type: 'VARCHAR(30)' }, { name: 'nazwisko', type: 'VARCHAR(30)' }, { name: 'specjalizacja', type: 'VARCHAR(30)' }, { name: 'gabinet', type: 'INT' }] },
    { name: 'dyzury', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'lekarze_id', type: 'INT', role: 'fk', ref: 'lekarze' }, { name: 'dzien_nr', type: 'INT' }, { name: 'dzien', type: 'VARCHAR(3)' }, { name: 'godziny', type: 'VARCHAR(11)' }] },
    {
      name: 'wizyty',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'lekarze_id', type: 'INT', role: 'fk', ref: 'lekarze' }, { name: 'pacjent', type: 'VARCHAR(50)' }, { name: 'telefon', type: 'VARCHAR(9)' }, { name: 'data', type: 'DATE' }, { name: 'potwierdzona', type: 'TINYINT(1)' }],
    },
  ],
});

const uklad = layoutSvg([
  ['nagłówek (header.naglowek): logo | nazwa i telefon', 32],
  ['menu (nav.menu)', 20],
  ['main.uklad: lekarze (section) | aside.boczna: rejestracja, porady', 120],
  ['stopka (footer.stopka)', 22],
]);

const zapytania = [
  'Zapytanie 1: wybierające jedynie specjalizacje lekarzy bez powtórzeń, posortowane alfabetycznie',
  'Zapytanie 2: wybierające imię, nazwisko i numer gabinetu pediatrów oraz ich dyżury połączone w jeden napis (kolumna „dyzury”) – dla każdego dyżuru skrót dnia, spacja i godziny (np. „Pn 8–14”), dyżury posortowane według pola dzien_nr i rozdzielone przecinkiem i spacją; wynik posortowany według nazwiska. Należy posłużyć się relacją i grupowaniem',
  'Zapytanie 3: wybierające nazwisko lekarza i liczbę jego wizyt (kolumna „liczba”) w dniach od 23 do 27 listopada 2026 włącznie – tylko dla lekarzy, którzy mają w tym czasie co najmniej 2 wizyty',
  'Zapytanie 4: wybierające jedynie imię, nazwisko i specjalizację lekarzy, których nazwisko zaczyna się na literę K',
  'Zapytanie 5: oznaczające jako potwierdzone (pole potwierdzona równe 1) wszystkie wizyty z dnia 23 listopada 2026',
];

const cechy = [
  'Składa się ze strony o nazwie index.php',
  'Zapisana w języku HTML5, zadeklarowany polski język zawartości witryny, jawnie zastosowany standard kodowania polskich znaków, znacznik meta viewport',
  'Tytuł strony widoczny na karcie przeglądarki: „Przychodnia Pod Lipami”',
  'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony; wygląd w całości w CSS, bez stylów w atrybutach',
  'Podział strony na bloki zrealizowany za pomocą znaczników semantycznych HTML5 zgodnie z ilustracją 3',
  'Nagłówek (header z klasą naglowek): obraz logo.png z tekstem alternatywnym „Logo przychodni Pod Lipami” oraz blok div z nagłówkiem pierwszego stopnia „Przychodnia Pod Lipami” i paragrafem „Rejestracja: 85 123 45 67 · pon.–pt. 8:00–19:00”',
  'Menu (nav z klasą menu): odnośniki „Lekarze” (#lekarze), „Rejestracja” (#rejestracja), „Przed wizytą” (#porady)',
  'Blok główny (main z klasą uklad): sekcja z klasą i identyfikatorem lekarze oraz panel boczny (aside z klasą boczna) z sekcjami o klasach i identyfikatorach rejestracja i porady; każda sekcja zaczyna się nagłówkiem drugiego stopnia: „Nasi lekarze”, „Rejestracja na wizytę”, „Przed wizytą”',
  'Sekcja lekarze: formularz z klasą filtr wysyłany metodą GET do index.php, zawierający etykietę „Specjalizacja” powiązaną z listą o nazwie i identyfikatorze specjalizacja (pierwsza opcja „wszystkie” o pustej wartości, kolejne generuje skrypt 1) oraz przycisk „Filtruj”; pod formularzem blok div z klasą karty wypełniany przez skrypt 2',
  {
    text: 'Sekcja rejestracja: komunikat skryptu 4 oraz formularz wysyłany metodą POST do index.php; wysłanie formularza poprzedza sprawdzenie skryptem 5 (atrybut onsubmit). Formularz zawiera kolejno:',
    children: [
      'listę o nazwie i identyfikatorze lekarz z etykietą „Lekarz” – opcje generuje skrypt 3',
      'pole tekstowe pacjent z etykietą „Imię i nazwisko”, pole tekstowe telefon z etykietą „Telefon (9 cyfr)”',
      'pole typu date o nazwie i identyfikatorze data z etykietą „Data wizyty”, wymagane (required)',
      'etykietę z klasą zgoda zawierającą pole wyboru o identyfikatorze zgoda i tekst „Wyrażam zgodę na przetwarzanie danych osobowych”',
      'pusty paragraf o identyfikatorze bledy i przycisk „Zarejestruj” wysyłający formularz',
    ],
  },
  'Sekcja porady: lista numerowana z klasą kroki z czterema punktami: „Przyjdź 10 minut przed godziną wizyty.”, „Weź dokument tożsamości.”, „Przygotuj listę przyjmowanych leków.”, „Zabierz wyniki wcześniejszych badań.”',
  'Stopka (footer z klasą stopka): paragraf „Przychodnia Pod Lipami, ul. Lipowa 4 · W nagłych przypadkach dzwoń pod numer 112” i paragraf „Stronę wykonał: ”, dalej wstawiony numer zdającego',
];

const css = [
  'Domyślnie dla wszystkich selektorów (*): marginesy zewnętrzne i wewnętrzne 0, model pudełkowy border-box. Dla selektora ciała strony: kolor tła #F0FDFA, kolor czcionki #134E4A, krój Trebuchet MS, w przypadku braku Arial, a następnie sans-serif, wysokość linii 1,5',
  'Dla selektora nagłówka drugiego stopnia: dolny margines 14 px, kolor #0F766E, rozmiar 1,3 rem',
  'Dla klasy naglowek: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 20 px, marginesy wewnętrzne: górny i dolny 20 px, lewy i prawy 6%, białe tło. Obraz w nagłówku: szerokość i wysokość 80 px. Nagłówek pierwszego stopnia: 2 rem, kolor #0F766E; paragraf: kolor #5F7D7A',
  'Dla klasy menu: układ elastyczny, odstęp 4 px, marginesy wewnętrzne: lewy i prawy 6%, tło #0F766E. Odnośniki menu: marginesy wewnętrzne 12 px / 20 px, biały pogrubiony tekst bez podkreślenia; gdy kursor znajdzie się na odnośniku – tło #115E59 i wewnętrzny cień przy dolnej krawędzi (box-shadow: inset 0 -4px 0 #86EFAC)',
  'Dla klasy uklad: siatka z kolumnami 1fr i 360 px, odstęp 24 px, elementy wyrównane do góry, maksymalna szerokość 1200 px, blok wyśrodkowany, marginesy wewnętrzne: górny i dolny 24 px, lewy i prawy 20 px',
  'Dla klasy filtr: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 10 px, dolny margines 18 px; etykieta, lista i przycisk w tym formularzu mają automatyczną szerokość i marginesy 0',
  'Dla klasy karty: siatka z kolumnami o szerokości co najmniej 230 px wypełniającymi wiersz (repeat(auto-fit, minmax(230px, 1fr))), odstęp 16 px',
  'Dla klasy lekarz: marginesy wewnętrzne 16 px, białe tło, lewe obramowanie 6 px linią ciągłą #14B8A6, zaokrąglenie 8 px, cień 0 2px 6px w kolorze rgba(15, 118, 110, 0.15); nagłówek trzeciego stopnia w karcie: 1,05 rem',
  'Dla klasy specjalizacja: kolor #0D9488, pogrubienie, pierwsza litera wielka uzyskana za pomocą CSS (text-transform: capitalize). Dla klasy brak: marginesy wewnętrzne 14 px, tło #FEF3C7, zaokrąglenie 8 px',
  'Dla klasy dyzury: górny margines 8 px, marginesy wewnętrzne 6 px / 10 px, tło #CCFBF1, zaokrąglenie 6 px, 0,85 rem; przed treścią wstawiany jest pseudoelementem ::before znak „🕘” i spacja',
  'Dla klas rejestracja i porady: dolny margines 20 px, marginesy wewnętrzne 20 px, białe tło, zaokrąglenie 10 px',
  'Dla selektora etykiety: wyświetlanie blokowe, marginesy: górny 10 px, dolny 4 px, 0,9 rem, pogrubienie. Dla selektorów input i select: szerokość 100%, marginesy wewnętrzne 8 px, obramowanie 1 px linią ciągłą #99F6E4, zaokrąglenie 6 px, czcionka dziedziczona; aktywne pole (:focus) ma obrys 2 px linią ciągłą #14B8A6',
  'Dla klasy zgoda: układ elastyczny, odstęp 8 px, bez pogrubienia; pole wyboru w niej ma automatyczną szerokość',
  'Dla selektora przycisku: szerokość 100%, górny margines 12 px, marginesy wewnętrzne 10 px / 18 px, tło #0F766E, biały pogrubiony tekst, bez obramowania, zaokrąglenie 6 px, czcionka dziedziczona, kursor w kształcie dłoni; gdy kursor znajdzie się na przycisku – tło #115E59',
  'Dla identyfikatora bledy: kolor #DC2626, 0,85 rem. Dla klasy potwierdzenie: dolny margines 10 px, marginesy wewnętrzne 10 px, tło #DCFCE7, obramowanie 1 px linią ciągłą #16A34A, zaokrąglenie 6 px',
  'Dla klasy kroki: brak numeracji listy oraz licznik CSS o nazwie krok, zerowany na liście (counter-reset). Elementy listy: pozycjonowanie względne, dolny margines 10 px (ostatni element – pseudoklasa :last-child – 0), lewy margines wewnętrzny 40 px, każdy zwiększa licznik krok (counter-increment)',
  'Przed każdym elementem listy kroki pseudoelement ::before z wartością licznika (content: counter(krok)), pozycjonowany bezwzględnie przy lewej i górnej krawędzi, 28 × 28 px, tło #14B8A6, biały pogrubiony tekst wyśrodkowany w poziomie, wysokość linii 28 px, kształt koła',
  'Dla klasy stopka: marginesy wewnętrzne 18 px, tło #134E4A, kolor #CCFBF1, tekst wyśrodkowany, 0,85 rem',
  'W przypadku ekranów o szerokości do 860 px: siatka klasy uklad ma jedną kolumnę, nagłówek układa elementy jeden pod drugim z tekstem wyśrodkowanym, a menu jest wyśrodkowane',
  'Podczas drukowania (reguła @media print, ilustracja 5): ukryte są menu, formularz filtr i panel boczny, tło strony jest białe, siatka uklad ma jedną kolumnę, a karty lekarzy nie mają cienia i mają czarne obramowanie 1 px',
];

const skryptyPhp = [
  { nr: 1, tytul: 'specjalizacje', lines: ['Wysyła do bazy danych zapytanie 1', 'Dla każdej specjalizacji tworzy opcję listy z jej nazwą'] },
  {
    nr: 2,
    tytul: 'lekarze',
    lines: ['Jeżeli formularz filtru został wysłany i wybrana specjalizacja nie jest pusta, wysyła zapytanie 2 dla wybranej specjalizacji; w przeciwnym razie zapytanie 2 bez warunku specjalizacji (wszyscy lekarze mający dyżury)',
      'Jeżeli zapytanie nie zwróciło żadnego wiersza (np. dla specjalizacji okulista), wyświetla paragraf z klasą brak „Brak lekarzy przyjmujących w tej specjalizacji.” (ilustracja 4)',
      'Dla każdego lekarza tworzy element article z klasą lekarz zawierający: nagłówek trzeciego stopnia „lek. <imię> <nazwisko>”, paragraf z klasą specjalizacja, paragraf „Gabinet nr <numer>” i paragraf z klasą dyzury z dyżurami'],
  },
  { nr: 3, tytul: 'lista lekarzy w formularzu', lines: ['Wysyła zapytanie wybierające identyfikator, imię, nazwisko i specjalizację wszystkich lekarzy posortowanych według nazwiska', 'Dla każdego lekarza tworzy opcję o wartości równej identyfikatorowi i treści „<nazwisko> <imię> (<specjalizacja>)”'] },
  {
    nr: 4,
    tytul: 'zapis wizyty',
    lines: ['Umieszczony na początku pliku. Jeżeli formularz rejestracji został wysłany metodą POST, pobiera z niego lekarza, pacjenta, telefon i datę, a następnie dodaje do tabeli wizyty niepotwierdzoną wizytę (pole potwierdzona równe 0)',
      'Odczytuje z bazy imię i nazwisko wybranego lekarza i nad formularzem wyświetla paragraf z klasą potwierdzenie: „Zarejestrowano wizytę u lek. <imię> <nazwisko> w dniu <data>. Potwierdzimy ją telefonicznie.”, gdzie data ma format DD.MM.RRRR (np. funkcje date i strtotime)'],
  },
];
const skryptJs = [
  'Wywoływany przed wysłaniem formularza rejestracji (onsubmit="return sprawdzFormularz()")',
  'Sprawdza, czy pole pacjent zawiera co najmniej 5 znaków – w przeciwnym razie błąd „Podaj imię i nazwisko”',
  'Sprawdza, czy telefon ma dokładnie 9 znaków i jest liczbą – w przeciwnym razie błąd „Numer telefonu musi mieć 9 cyfr”',
  'Sprawdza, czy pole wyboru zgoda jest zaznaczone (właściwość checked) – w przeciwnym razie błąd „Zaznacz zgodę na przetwarzanie danych”',
  'Wyświetla wszystkie znalezione błędy w paragrafie bledy, każdy w osobnej linii (ilustracja 2); gdy błędów nie ma, paragraf jest pusty',
  'Zwraca false, gdy wystąpił co najmniej jeden błąd (formularz nie zostanie wysłany), w przeciwnym razie true',
];

const SQL_POMOC = [
  ['SELECT DISTINCT kolumna', 'Wartości bez powtórzeń'],
  ['GROUP_CONCAT(wyrażenie ORDER BY kolumna SEPARATOR \', \')', 'Wartości z grupy połączone w jeden napis'],
  ['CONCAT(napis1, napis2, …)', 'Połączone napisy'],
  ['HAVING warunek', 'Warunek dla grup (po GROUP BY), np. na wyniku COUNT'],
  ['kolumna BETWEEN a AND b', 'Wartość z przedziału od a do b włącznie'],
  ['kolumna LIKE \'K%\'', 'Napis zaczynający się od K (% – dowolny ciąg znaków)'],
];
const PHP_POMOC = [
  ['date(\'d.m.Y\', znacznik_czasu)', 'Data w formacie DD.MM.RRRR'],
  ['strtotime(\'2026-11-26\')', 'Znacznik czasu dla podanej daty'],
];
const CSS_POMOC = [
  ['counter-reset: krok', 'Utworzenie (wyzerowanie) licznika krok'],
  ['counter-increment: krok', 'Zwiększenie licznika krok o 1'],
  ['content: counter(krok)', 'Wstawienie wartości licznika w pseudoelemencie'],
  ['li:last-child', 'Ostatni element listy'],
  ['@media print { … }', 'Reguły stosowane tylko podczas drukowania strony'],
  ['text-transform: capitalize', 'Pierwsza litera każdego słowa wielka'],
  ['box-shadow: inset 0 -4px 0 kolor', 'Cień wewnątrz elementu – pasek przy dolnej krawędzi'],
];
const JS_POMOC = [
  ['<form onsubmit="return funkcja()">', 'Formularz zostanie wysłany tylko wtedy, gdy funkcja zwróci true'],
  ['element.checked', 'true, gdy pole wyboru jest zaznaczone'],
  ['napis.length', 'Liczba znaków napisu'],
  ['isNaN(napis)', 'true, gdy napis nie jest liczbą'],
  ['tablica.join(\'<br>\')', 'Elementy tablicy połączone znacznikiem nowej linii'],
];

const sheet = `${titlePage(KOD, 'Przychodnia Pod Lipami – lekarze i rejestracja')}
<section class="page task">
  <h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową przychodni z listą lekarzy i rejestracją na wizytę, wykorzystując pakiet XAMPP oraz edytor zaznaczający składnię.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować. W archiwum znajdują się pliki: przychodnia.sql i logo.png.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>

  <h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera trzy tabele połączone relacjami, przedstawione na ilustracji 1. Tabela dyzury zawiera dni i godziny przyjęć lekarzy (dzien_nr: 1 – poniedziałek … 5 – piątek, dzien: skrót dnia, godziny: np. „8–14”). Nazwa przychodni, lekarze i pacjenci są wymyśleni.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>przychodnia</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku przychodnia.sql do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie PNG pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie przychodnia. Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie PNG i nadaj im nazwy kw1, kw2, kw3, kw4, kw5. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>
  <p>W tabeli 1 zamieszczono wybrane elementy języka SQL.</p>

  <h3>Witryna internetowa</h3>
  ${frame(podglad, 2, 'Wygląd witryny na ekranie o szerokości 1280 px po próbie wysłania formularza z imieniem „Jan”, telefonem „12345” i niezaznaczoną zgodą; dane pochodzą z bazy', 1280, 0.5, { cls: 'glowny' })}
  <div class="with-layout"><div>
  ${frame(podgladZapis, 4, 'Sekcja rejestracji po wysłaniu poprawnie wypełnionego formularza (lek. Marta Zając, 26.11.2026)', 360, 0.6, { cls: 'zapis' })}
  </div><figure class="layout">${uklad}<figcaption>Ilustracja 3. Układ bloków</figcaption></figure></div>
  ${frame(podgladOkulista, 5, 'Sekcja lekarzy po wybraniu specjalizacji okulista (brak dyżurów)', 700, 0.5, { cls: 'okulista' })}
  ${frame(podgladWydruk, 6, 'Podgląd wydruku strony (reguła @media print)', 800, 0.45, { cls: 'wydruk' })}
  <p>Cechy witryny:</p>
  ${renderLines(cechy)}

  <h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. W tabeli 3 zamieszczono pomoc do niektórych właściwości CSS. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(css)}
  <p class="note">Uwaga: styl CSS ciała strony, nagłówka drugiego stopnia, etykiety, pól formularza i przycisku należy zdefiniować wyłącznie przy pomocy selektora tych znaczników. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.</p>

  <h3>Skrypty działające po stronie serwera (PHP)</h3>
  <p>W tabeli 2 zamieszczono wybrane funkcje PHP. Wymagania dotyczące skryptów:</p>
  ${renderLines(['Napisane w języku PHP', 'Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim', 'Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie przychodnia', 'Na końcu zamykane jest połączenie z serwerem'])}
  ${skryptyPhp.map((s) => `<p class="script-name">Skrypt ${s.nr} (${s.tytul}):</p>${renderLines(s.lines)}`).join('')}
  <h3>Skrypt działający po stronie klienta (JavaScript)</h3>
  <p>W tabeli 4 zamieszczono wybrane elementy języka JavaScript. Skrypt jest napisany w języku JavaScript (w pliku skrypt.js lub w znaczniku script), należy stosować znaczące nazewnictwo zmiennych i funkcji.</p>
  <p class="script-name">Skrypt 5 (sprawdzenie formularza):</p>${renderLines(skryptJs)}

  <div class="help-tables">
  ${table2('Tabela 1. Wybrane elementy języka SQL (MySQL)', ['Zapis', 'Znaczenie'], esc(SQL_POMOC))}
  ${table2('Tabela 2. Wybrane funkcje języka PHP', ['Funkcja', 'Zwracana wartość'], esc([...MYSQLI, ...PHP_POMOC]))}
  ${table2('Tabela 3. Wybrane właściwości CSS', ['Zapis', 'Znaczenie'], esc(CSS_POMOC))}
  ${table2('Tabela 4. Wybrane elementy HTML i JavaScript', ['Zapis', 'Znaczenie'], esc(JS_POMOC))}
  </div>

  <p class="note">UWAGA: po zakończeniu pracy utwórz plik tekstowy o nazwie przeglądarka.txt. Zapisz w nim nazwę przeglądarki internetowej, w której weryfikowana była poprawność działania witryny. Umieść go w folderze z numerem zdającego.</p>
  <p>W folderze z numerem zdającego powinny znajdować się pliki: import.png, index.php, kw1.png, kw2.png, kw3.png, kw4.png, kw5.png, kwerendy.txt, logo.png, przeglądarka.txt, skrypt.js, styl.css, ewentualnie inne przygotowane pliki. Spakuj folder do archiwum ZIP o nazwie równej numerowi zdającego i prześlij je w sposób wskazany przez nauczyciela.</p>
  <p><b>Czas przeznaczony na wykonanie zadania wynosi 150 minut.</b></p>
  <p>Ocenie podlegać będzie 5 rezultatów:</p>
  ${renderLines(['operacje na bazie danych,', 'zawartość witryny internetowej,', 'działanie witryny internetowej,', 'styl CSS witryny internetowej,', 'skrypty.'])}
</section>`;

// Ilustracja 2: formularz z błędnymi danymi i wynik walidacji (bez wysyłania).
const sheetHtml = sheetDocument(`${KOD} – Przychodnia Pod Lipami – arkusz ćwiczeniowy`, sheet, `
figure.preview.okulista .frame-wrap { height: 95px !important; overflow: hidden; }
figure.preview.wydruk .frame-wrap { height: 325px !important; overflow: hidden; border-bottom: 1px dashed #999; }
`, `
document.querySelectorAll('figure.preview.glowny iframe.site').forEach(function (f) {
  f.addEventListener('load', function () {
    try {
      var d = f.contentDocument;
      d.getElementById('pacjent').value = 'Jan';
      d.getElementById('telefon').value = '12345';
      d.getElementById('data').value = '2026-11-25';
      f.contentWindow.sprawdzFormularz();
      dopasuj();
    } catch (e) {}
  });
});
document.querySelectorAll('figure.preview.okulista iframe.site').forEach(function (f) {
  f.addEventListener('load', function () {
    try { f.contentDocument.getElementById('specjalizacja').value = 'okulista'; } catch (e) {}
  });
});
`);
P.write('arkusz.html', sheetHtml);

// ---------- klucz ----------
const sqlZ = P.sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));
const wyniki = [
  'widocznych jest dokładnie 5 wierszy: dermatolog, internista, kardiolog, okulista, pediatra',
  'widoczne są 2 wiersze: Anna Kowalczyk, 12, „Pn 8–14, Śr 8–14, Pt 12–18”; Marta Zając, 14, „Wt 12–18, Cz 12–18”',
  'widoczne są dokładnie 2 wiersze: Kowalczyk 3, Lis 3 (Kwiatkowski ma w tym tygodniu tylko 1 wizytę)',
  'widoczne są dokładnie 2 wiersze: Anna Kowalczyk (pediatra), Piotr Kwiatkowski (kardiolog)',
  'widoczny jest komunikat o zmianie 2 wierszy (trzecia wizyta z 23.11 była już potwierdzona; uznać także 3, jeśli serwer zlicza dopasowane wiersze)',
];
const R = [
  ['Operacje na bazie danych', [
    'Wykonany import tabel do bazy danych przychodnia, co jest udokumentowane w pliku import w formacie PNG',
    'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
    ...sqlZ.map((q, i) => `Wykonane zapytanie ${i + 1}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${q} oraz wynik działania udokumentowany zrzutem kw${i + 1}, na którym ${wyniki[i]}`),
  ]],
  ['Zawartość witryny internetowej', [
    'Witryna zapisana w pliku index.php, jawnie zapisany standard kodowania polskich znaków, deklaracja <!DOCTYPE html>, język polski, meta viewport, tytuł „Przychodnia Pod Lipami”',
    'Bloki zdefiniowane znacznikami semantycznymi zgodnie z ilustracją 3: header naglowek, nav menu, main uklad z section lekarze i aside boczna (dwie sekcje), footer stopka',
    'W nagłówku obraz logo.png z tekstem alternatywnym, nagłówek h1 i paragraf z numerem rejestracji; menu z trzema odnośnikami do #lekarze, #rejestracja, #porady',
    'Formularz filtr: metoda get, lista specjalizacja z pierwszą opcją „wszystkie” o pustej wartości, etykieta powiązana z listą, przycisk „Filtruj”',
    'Formularz rejestracji: metoda post, atrybut onsubmit z return, lista lekarz, pola pacjent i telefon, pole typu date z required, etykiety powiązane z polami (for/id)',
    'Pole wyboru zgoda wewnątrz etykiety z klasą zgoda, paragraf bledy, przycisk „Zarejestruj” typu submit',
    'Lista numerowana ol z klasą kroki z czterema punktami; stopka z dwoma paragrafami, w tym „Stronę wykonał: ” z numerem zdającego',
  ]],
  ['Działanie witryny internetowej', [
    'Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracjami 2 i 3; logo widoczne w nagłówku',
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów styl.css, formatowanie CSS pochodzi jedynie z tego arkusza',
    'Bez filtru wyświetla się 6 kart lekarzy posortowanych według nazwiska (bez okulistki Karoliny Bąk, która nie ma dyżurów), z dyżurami w kolejności dni tygodnia',
    'Lista specjalizacji zawiera „wszystkie” i 5 specjalizacji bez powtórzeń; wybór „pediatra” pokazuje 2 karty, a „okulista” – komunikat o braku lekarzy',
    'Lista lekarzy w formularzu rejestracji zawiera 7 lekarzy z identyfikatorami jako wartościami opcji',
    'Wysłanie formularza z błędnymi danymi wyświetla czerwone komunikaty (każdy w nowej linii) i nie przeładowuje strony; poprawne dane wysyłają formularz',
    'Po wysłaniu poprawnego formularza w tabeli wizyty pojawia się nowy rekord z potwierdzona = 0, a nad formularzem komunikat z nazwiskiem lekarza i datą w formacie DD.MM.RRRR',
    'Kroki w sekcji „Przed wizytą” mają numery 1–4 w kołach generowane przez CSS',
    'W podglądzie wydruku (Ctrl+P) nie ma menu, filtru ani panelu bocznego; przy szerokości do 860 px układ ma jedną kolumnę',
  ]],
  ['Styl CSS witryny internetowej', css.map((c) => `Ustawione ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
  ['Skrypty', [
    'Skrypt PHP łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza przychodnia (np. mysqli_connect)',
    'Skrypt 1 wysyła zapytanie 1 (DISTINCT) i tworzy opcje listy specjalizacji',
    'Skrypt 2 dodaje warunek specjalizacji do zapytania tylko wtedy, gdy parametr został wysłany i nie jest pusty',
    'Skrypt 2 wyświetla komunikat brak, gdy zapytanie nie zwróciło wierszy (np. mysqli_num_rows)',
    'Skrypt 2 tworzy karty article lekarz z h3 „lek. imię nazwisko”, specjalizacją, gabinetem i dyżurami',
    'Skrypt 3 tworzy opcje z identyfikatorem lekarza w value i treścią „nazwisko imię (specjalizacja)”',
    'Skrypt 4 sprawdza wysłanie formularza POST i dodaje wizytę zapytaniem INSERT z potwierdzona = 0',
    'Skrypt 4 wyświetla komunikat z imieniem i nazwiskiem lekarza odczytanym z bazy oraz datą w formacie DD.MM.RRRR',
    'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)',
    'Skrypt 5 jest napisany w języku JavaScript i sprawdza długość pola pacjent oraz telefon (9 znaków, liczba)',
    'Skrypt 5 sprawdza zaznaczenie zgody (checked) i wyświetla wszystkie błędy w paragrafie bledy',
    'Skrypt 5 zwraca false przy błędach, a formularz używa wyniku (onsubmit="return …")',
    'Zastosowano znaczące nazewnictwo zmiennych i funkcji',
  ]],
];
const key = keyDocument({
  title: `${KOD} – Przychodnia Pod Lipami – klucz`,
  heading: 'Przychodnia Pod Lipami – zasady oceniania i rozwiązanie',
  meta: `${KOD} · baza przychodnia · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>, zawiera przychodnia.sql i logo.png).`,
  R,
  files: ['kwerendy.txt', 'index.php', 'styl.css', 'skrypt.js'].map((f) => [f, P.sol(f)]),
});
P.write('klucz.html', key.html);
console.log(`arkusz.html, klucz.html (kryteria: ${key.total})`);
