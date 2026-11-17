// Buduje arkusz egzaminacyjny "FitPoint" (styl INF.03) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/fitpoint/zbuduj.mjs
// Wejście: dla_zdajacego/fitpoint.sql, rozwiazanie/* - podglad.html (GET, baza po zapytaniach 4 i 5)
// i podglad_zapis.html (wynik wysłania formularza zapisu).
import { fileURLToPath } from 'node:url';
import { project, previewDoc, frame, table2, esc, layoutSvg, titlePage, sheetDocument, keyDocument, renderLines, schemaSvg, h, MYSQLI } from '../wspolne.mjs';

const P = project(fileURLToPath(new URL('.', import.meta.url)));
const KOD = 'INF.03-FP-SG';
const ARCHIWUM = { nazwa: 'fitpoint', haslo: 'F1tP0int!' };

const podglad = previewDoc(P.sol);
const podgladZapis = previewDoc(P.sol, {
  file: 'podglad_zapis.html',
  extraCss: '.baner,.menu,.grafik,.bmi,.trenerzy,.stopka{display:none}.uklad{grid-template-columns:1fr;grid-template-areas:"zapis";margin:0;padding:12px}',
});

const schema = schemaSvg({
  tables: [
    { name: 'trenerzy', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'imie', type: 'VARCHAR(30)' }, { name: 'nazwisko', type: 'VARCHAR(30)' }, { name: 'specjalizacja', type: 'VARCHAR(50)' }] },
    {
      name: 'zajecia',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'nazwa', type: 'VARCHAR(40)' }, { name: 'dzien', type: 'VARCHAR(15)' }, { name: 'godzina', type: 'TIME' },
        { name: 'sala', type: 'VARCHAR(10)' }, { name: 'miejsca', type: 'INT' }, { name: 'trenerzy_id', type: 'INT', role: 'fk', ref: 'trenerzy' }],
    },
    {
      name: 'zapisy',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'zajecia_id', type: 'INT', role: 'fk', ref: 'zajecia' }, { name: 'imie', type: 'VARCHAR(30)' }, { name: 'email', type: 'VARCHAR(60)' }, { name: 'data_zapisu', type: 'DATETIME' }],
    },
  ],
});

const uklad = layoutSvg([
  ['baner (header.baner)', 30],
  ['menu (nav.menu) – przyklejone', 20],
  ['main.uklad: grafik | zapis', 60],
  ['main.uklad: grafik | bmi', 50],
  ['main.uklad: trenerzy (cała szerokość)', 44],
  ['stopka (footer.stopka)', 22],
]);

const zapytania = [
  'Zapytanie 1: wybierające jedynie godzinę zajęć w formacie GG:MM (kolumna „godz”), nazwę zajęć, salę oraz imię i nazwisko trenera dla zajęć odbywających się w poniedziałek, posortowane rosnąco według godziny. Należy posłużyć się relacją',
  'Zapytanie 2: wybierające jedynie identyfikator, nazwę, dzień i godzinę w formacie GG:MM (kolumna „godz”) zajęć, na które są jeszcze wolne miejsca',
  'Zapytanie 3: wybierające imię, nazwisko i specjalizację trenerów oraz liczbę prowadzonych przez nich zajęć (kolumna „liczba”), tylko dla trenerów prowadzących zajęcia; wynik posortowany malejąco według liczby zajęć, a przy równej liczbie – alfabetycznie według nazwiska',
  'Zapytanie 4: dodające do tabeli zapisy zapis na zajęcia o identyfikatorze 3: imię Ola, e-mail ola@example.com, data zapisu – bieżąca data i godzina (funkcja NOW())',
  'Zapytanie 5: zmniejszające o 1 liczbę wolnych miejsc na zajęciach o identyfikatorze 3',
];

const cechy = [
  'Składa się ze strony o nazwie index.php',
  'Zapisana w języku HTML5, zadeklarowany polski język zawartości witryny, jawnie zastosowany standard kodowania polskich znaków, znacznik meta viewport',
  'Tytuł strony widoczny na karcie przeglądarki: „FitPoint – grafik zajęć”',
  'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony; wygląd w całości w CSS, bez stylów w atrybutach',
  'Podział strony na bloki zrealizowany za pomocą znaczników semantycznych HTML5 zgodnie z ilustracją 3',
  'Baner (header z klasą baner): odnośnik z klasą logo do index.php o treści „FITPOINT”, w którym „POINT” jest w osobnym elemencie span, oraz paragraf z klasą haslo „Siłownia osiedlowa · otwarte 6:00–23:00”',
  'Menu (nav z klasą menu): cztery odnośniki prowadzące do sekcji na tej samej stronie: „Grafik” (#grafik), „Zapisy” (#zapis), „Kalkulator BMI” (#bmi), „Trenerzy” (#trenerzy)',
  'Blok główny (main z klasą uklad) zawiera cztery sekcje (section) o klasach i identyfikatorach: grafik, zapis, bmi, trenerzy; każda zaczyna się nagłówkiem drugiego stopnia',
  {
    text: 'Sekcja grafik:',
    children: [
      'nagłówek „Grafik zajęć: <dzień>”, gdzie <dzień> to dzień wybrany w formularzu (domyślnie Poniedziałek)',
      'formularz z klasą filtr, wysyłany metodą GET do index.php: etykieta „Dzień tygodnia” powiązana z listą rozwijaną o nazwie i identyfikatorze dzien (opcje: Poniedziałek, Wtorek, Środa, Czwartek, Piątek) oraz przycisk „Pokaż” wysyłający formularz',
      'tabela z nagłówkiem (thead) zawierającym komórki nagłówkowe: Godzina, Zajęcia, Sala, Trener, Wolne miejsca, oraz częścią tbody wypełnianą przez skrypt 1',
    ],
  },
  'Sekcja zapis: nagłówek „Zapisz się” i formularz wysyłany metodą POST do index.php, zawierający: listę rozwijaną o nazwie i identyfikatorze zajecia (opcje generuje skrypt 2), pole tekstowe imie i pole typu email o nazwie email – oba wymagane (required), każde pole z etykietą powiązaną atrybutami for i id („Zajęcia”, „Imię”, „E-mail”), przycisk „Zapisz mnie” wysyłający formularz; pod formularzem komunikat skryptu 3 (ilustracja 4)',
  'Sekcja bmi: nagłówek „Kalkulator BMI”, etykiety „Waga [kg]” i „Wzrost [cm]” z polami liczbowymi o identyfikatorach waga i wzrost, przycisk „Oblicz” uruchamiający skrypt 5 oraz pusty paragraf o identyfikatorze wynik',
  'Sekcja trenerzy: nagłówek „Nasi trenerzy” i blok div z klasą karty, wypełniony przez skrypt 4',
  'Stopka (footer z klasą stopka): paragraf „FitPoint, ul. Sportowa 7 · tel. 500 600 700” i paragraf „Stronę wykonał: ”, dalej wstawiony numer zdającego',
];

const css = [
  'Domyślnie dla wszystkich selektorów (*): marginesy zewnętrzne i wewnętrzne 0, model pudełkowy border-box. Dla selektora html: płynne przewijanie (scroll-behavior: smooth) – po kliknięciu pozycji menu strona płynnie przewija się do sekcji',
  'Dla selektora ciała strony: kolor tła #F3F4F6, kolor czcionki #111827, krój Verdana, w przypadku braku Geneva, a następnie sans-serif, wysokość linii 1,5',
  'Dla selektora nagłówka drugiego stopnia: dolny margines 14 px, rozmiar 1,25 rem, wielkie litery (text-transform), odstęp między literami 1 px',
  'Dla klasy baner: marginesy wewnętrzne: górny i dolny 28 px, lewy i prawy 5%, tło – gradient liniowy pod kątem 120 stopni od #111827 do #4C1D95, biały kolor czcionki',
  'Dla klasy logo: biały kolor, rozmiar 2,4 rem, pogrubienie, bez podkreślenia, odstęp między literami 3 px; element span w logo ma kolor #FACC15. Dla klasy haslo: kolor #C4B5FD, kursywa',
  'Dla klasy menu: przyklejone do górnej krawędzi okna podczas przewijania (position: sticky, top: 0, z-index: 10), układ elastyczny z elementami wyśrodkowanymi w poziomie, odstęp 6 px, marginesy wewnętrzne 8 px, kolor tła #7C3AED',
  'Dla odnośników menu: marginesy wewnętrzne 8 px / 18 px, zaokrąglenie 20 px, biały pogrubiony tekst bez podkreślenia; gdy kursor znajdzie się na odnośniku – tło #FACC15, kolor tekstu #111827',
  'Dla klasy uklad: siatka z kolumnami 1fr i 320 px oraz obszarami nazwanymi (grid-template-areas): w pierwszym wierszu „grafik zapis”, w drugim „grafik bmi”, w trzecim „trenerzy trenerzy”; odstęp 20 px, maksymalna szerokość 1200 px, blok wyśrodkowany, górny i dolny margines 24 px, marginesy wewnętrzne lewy i prawy 20 px',
  'Klasy grafik, zapis, bmi i trenerzy są przypisane do obszarów siatki o tych samych nazwach (grid-area). Sekcje grafik, zapis i bmi mają marginesy wewnętrzne 20 px, białe tło, zaokrąglenie 10 px, cień 0 2px 8px czarny o nieprzezroczystości 0,08',
  'Dla selektora etykiety: wyświetlanie blokowe, marginesy: górny 10 px, dolny 4 px, rozmiar 0,85 rem, pogrubienie. Dla selektorów input i select: szerokość 100%, marginesy wewnętrzne 9 px, obramowanie 2 px linią ciągłą #D1D5DB, zaokrąglenie 6 px, czcionka dziedziczona',
  'Gdy pole input lub lista select jest aktywna (pseudoklasa :focus): kolor obramowania #7C3AED i brak obrysu (outline)',
  'Dla selektora przycisku: szerokość 100%, górny margines 14 px, marginesy wewnętrzne 10 px, tło #7C3AED, biały pogrubiony tekst, bez obramowania, zaokrąglenie 6 px, czcionka dziedziczona, kursor w kształcie dłoni; gdy kursor znajdzie się na przycisku – tło #5B21B6',
  'Dla klasy filtr: układ elastyczny, elementy wyśrodkowane w pionie, odstęp 10 px, dolny margines 16 px; etykieta i przycisk w tym formularzu mają marginesy 0, automatyczną szerokość i tekst bez łamania wierszy',
  'Dla klasy potwierdzenie: górny margines 14 px, marginesy wewnętrzne 10 px, tło #DCFCE7, lewe obramowanie 5 px linią ciągłą #16A34A, kolor tekstu #14532D. Dla identyfikatora wynik: górny margines 14 px, rozmiar 1,1 rem, pogrubienie, kolor #5B21B6',
  'Dla tabeli: szerokość 100%, obramowania komórek scalone (border-collapse: collapse). Komórki nagłówkowe: marginesy wewnętrzne 10 px, tło #111827, biały tekst wyrównany do lewej, 0,85 rem. Komórki danych: marginesy wewnętrzne 10 px, dolne obramowanie 1 px #E5E7EB',
  'Co drugi (parzysty) wiersz części tbody ma tło #F5F3FF (pseudoklasa :nth-child); gdy kursor znajdzie się na wierszu tbody, jego tło zmienia się na #FEF9C3. Dla klasy pelne: kolor #DC2626, pogrubienie',
  'Dla klasy karty: układ elastyczny z zawijaniem do kolejnego wiersza, odstęp 16 px. Dla klasy trener: podstawa szerokości 220 px z możliwością rozciągania i zwężania (flex: 1 1 220px), marginesy wewnętrzne 18 px, białe tło, górne obramowanie 6 px #FACC15, zaokrąglenie 10 px, tekst wyśrodkowany, płynne przejście transformacji 0,3 s',
  'Gdy kursor znajdzie się na karcie trenera, karta przesuwa się o 5 px w górę (translateY). Nagłówek karty: kolor #4C1D95. Dla klasy liczba: górny margines 8 px, 0,85 rem, kolor #6B7280',
  'Dla klasy stopka: marginesy wewnętrzne 20 px, tło #111827, kolor #9CA3AF, tekst wyśrodkowany, 0,85 rem',
  'W przypadku ekranów o szerokości do 900 px (ilustracja 5): siatka klasy uklad ma jedną kolumnę i obszary kolejno: grafik, zapis, bmi, trenerzy; formularz filtr zawija elementy; komórki tabeli mają marginesy wewnętrzne 6 px i rozmiar 0,8 rem',
];

const skryptyPhp = [
  {
    nr: 1,
    tytul: 'grafik',
    lines: ['Jeżeli formularz filtru został wysłany (istnieje parametr dzien w tablicy $_GET), wybranym dniem jest jego wartość; w przeciwnym razie Poniedziałek. Wybrany dzień jest wypisywany w nagłówku sekcji',
      'Wysyła do bazy danych zapytanie 1, w którym zamiast stałej wartości Poniedziałek użyty jest wybrany dzień',
      'Dla każdego rekordu tworzy wiersz tabeli z komórkami: godzina, nazwa, sala, imię i nazwisko trenera (w jednej komórce, rozdzielone spacją) oraz liczba wolnych miejsc',
      'Jeżeli liczba wolnych miejsc wynosi 0, ostatnia komórka ma klasę pelne i treść „brak miejsc”'],
  },
  { nr: 2, tytul: 'lista zajęć w formularzu', lines: ['Wysyła do bazy danych zapytanie 2', 'Dla każdego rekordu tworzy opcję listy, której wartością (atrybut value) jest identyfikator zajęć, a treścią: nazwa – dzień godzina, np. „Joga – Poniedziałek 08:00”'] },
  {
    nr: 3,
    tytul: 'zapis na zajęcia',
    lines: ['Umieszczony na początku pliku, przed kodem HTML, aby grafik pokazywał liczbę miejsc już po zapisie',
      'Jeżeli formularz zapisu został wysłany (istnieje pole zajecia w tablicy $_POST): pobiera z formularza identyfikator zajęć, imię i e-mail, wysyła do bazy zapytanie dodające zapis (jak zapytanie 4, z danymi z formularza) oraz zapytanie zmniejszające liczbę wolnych miejsc wybranych zajęć (jak zapytanie 5)',
      'Pod formularzem zapisu wyświetla paragraf z klasą potwierdzenie o treści „Dziękujemy, <imię>! Zapis został przyjęty.”; gdy formularz nie został wysłany, paragraf nie jest wyświetlany'],
  },
  { nr: 4, tytul: 'trenerzy', lines: ['Wysyła do bazy danych zapytanie 3', 'Dla każdego trenera tworzy element article z klasą trener, zawierający nagłówek trzeciego stopnia z imieniem i nazwiskiem, paragraf ze specjalizacją i paragraf z klasą liczba o treści „Zajęć w tygodniu: <liczba>”'] },
];
const skryptJs = [
  'Wywoływany po kliknięciu przycisku „Oblicz”',
  'Pobiera wagę w kilogramach i wzrost w centymetrach; jeżeli któraś wartość jest pusta lub nie jest większa od 0, wyświetla w paragrafie wynik tekst „Podaj wagę i wzrost” i kończy działanie',
  'Oblicza BMI = waga / (wzrost w metrach)², np. dla 70 kg i 175 cm BMI wynosi 22,9',
  'Wyświetla w paragrafie wynik tekst „Twoje BMI: <bmi> – <opis>”, gdzie <bmi> jest zaokrąglone do jednego miejsca po przecinku, a <opis> to „niedowaga” dla BMI poniżej 18,5, „waga prawidłowa” dla BMI od 18,5 do mniej niż 25, „nadwaga” w pozostałych przypadkach',
];

const SQL_POMOC = [
  ['TIME_FORMAT(czas, \'%H:%i\')', 'Godzina i minuty, np. 08:00'],
  ['NOW()', 'Bieżąca data i godzina'],
  ['INSERT INTO tabela (kolumny) VALUES (wartości)', 'Dodanie rekordu'],
  ['UPDATE tabela SET kolumna = wartość WHERE warunek', 'Zmiana rekordów spełniających warunek'],
];
const PHP_POMOC = [
  ['isset($zmienna)', 'TRUE, gdy zmienna (np. $_POST[\'imie\']) istnieje'],
  ['$_GET[\'nazwa\'], $_POST[\'nazwa\']', 'Wartość pola formularza wysłanego metodą GET / POST'],
];
const CSS_POMOC = [
  ['grid-template-areas: "a b" "a c"', 'Nazwane obszary siatki – każdy napis to jeden wiersz'],
  ['grid-area: a', 'Umieszczenie elementu w obszarze siatki o nazwie a'],
  ['tbody tr:nth-child(even)', 'Parzyste wiersze części tbody'],
  ['input:focus', 'Pole, w którym znajduje się kursor'],
  ['border-collapse: collapse', 'Wspólne obramowania sąsiednich komórek tabeli'],
  ['flex: 1 1 220px', 'Podstawa 220 px, element może się rozciągać i zwężać'],
  ['scroll-behavior: smooth', 'Płynne przewijanie do odnośników wewnątrz strony'],
];
const JS_POMOC = [
  ['document.getElementById(id).value', 'Wartość pola formularza (napis)'],
  ['Number(napis)', 'Liczba z napisu'],
  ['liczba.toFixed(1)', 'Liczba zaokrąglona do 1 miejsca po przecinku (napis)'],
  ['element.innerHTML = "tekst"', 'Zmiana zawartości elementu'],
];

const sheet = `${titlePage(KOD, 'FitPoint – grafik zajęć i zapisy')}
<section class="page task">
  <h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową siłowni FitPoint z grafikiem zajęć i formularzem zapisów, wykorzystując pakiet XAMPP oraz edytor zaznaczający składnię.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>

  <h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera trzy tabele połączone relacjami, przedstawione na ilustracji 1. Pole miejsca w tabeli zajecia oznacza liczbę wolnych miejsc. Nazwa klubu, trenerzy i zajęcia są wymyślone.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>fitpoint</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku fitpoint.sql do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie PNG pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie fitpoint (każde dokładnie jeden raz). Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie PNG i nadaj im nazwy kw1, kw2, kw3, kw4, kw5. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>
  <p>W tabeli 1 zamieszczono wybrane elementy języka SQL.</p>

  <h3>Witryna internetowa</h3>
  ${frame(podglad, 2, 'Wygląd witryny na ekranie o szerokości 1280 px po wykonaniu zapytań 4 i 5, kursor na drugim wierszu tabeli; dane pochodzą z bazy', 1280, 0.5)}
  <div class="with-layout"><div>
  ${frame(podgladZapis, 4, 'Sekcja zapisu po wysłaniu formularza z imieniem Kasia', 344, 0.6, { cls: 'zapis' })}
  </div><figure class="layout">${uklad}<figcaption>Ilustracja 3. Układ bloków (szerokość powyżej 900 px)</figcaption></figure></div>
  ${frame(podglad, 5, 'Wygląd witryny na ekranie o szerokości 420 px (początek strony)', 420, 0.6, { cls: 'mobile' })}
  <p>Cechy witryny:</p>
  ${renderLines(cechy)}

  <h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. W tabeli 3 zamieszczono pomoc do niektórych właściwości CSS. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(css)}
  <p class="note">Uwaga: styl CSS ciała strony, nagłówka drugiego stopnia, etykiety, pól formularza, przycisku i komórek tabeli należy zdefiniować wyłącznie przy pomocy selektora tych znaczników. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.</p>

  <h3>Skrypty działające po stronie serwera (PHP)</h3>
  <p>W tabeli 2 zamieszczono wybrane funkcje i zmienne PHP. Wymagania dotyczące skryptów:</p>
  ${renderLines(['Napisane w języku PHP', 'Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim', 'Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie fitpoint', 'Na końcu zamykane jest połączenie z serwerem'])}
  ${skryptyPhp.map((s) => `<p class="script-name">Skrypt ${s.nr} (${s.tytul}):</p>${renderLines(s.lines)}`).join('')}
  <h3>Skrypt działający po stronie klienta (JavaScript)</h3>
  <p>W tabeli 4 zamieszczono wybrane elementy języka JavaScript. Skrypt jest napisany w języku JavaScript (w pliku skrypt.js lub w znaczniku script), należy stosować znaczące nazewnictwo zmiennych i funkcji.</p>
  <p class="script-name">Skrypt 5 (kalkulator BMI):</p>${renderLines(skryptJs)}

  <div class="help-tables">
  ${table2('Tabela 1. Wybrane elementy języka SQL (MySQL)', ['Zapis', 'Znaczenie'], esc(SQL_POMOC))}
  ${table2('Tabela 2. Wybrane funkcje i zmienne języka PHP', ['Funkcja', 'Zwracana wartość'], esc([...MYSQLI, ...PHP_POMOC]))}
  ${table2('Tabela 3. Wybrane właściwości CSS', ['Zapis', 'Znaczenie'], esc(CSS_POMOC))}
  ${table2('Tabela 4. Wybrane elementy języka JavaScript', ['Zapis', 'Znaczenie'], esc(JS_POMOC))}
  </div>

  <p class="note">UWAGA: po zakończeniu pracy utwórz plik tekstowy o nazwie przeglądarka.txt. Zapisz w nim nazwę przeglądarki internetowej, w której weryfikowana była poprawność działania witryny. Umieść go w folderze z numerem zdającego.</p>
  <p>W folderze z numerem zdającego powinny znajdować się pliki: import.png, index.php, kw1.png, kw2.png, kw3.png, kw4.png, kw5.png, kwerendy.txt, przeglądarka.txt, skrypt.js, styl.css, ewentualnie inne przygotowane pliki. Spakuj folder do archiwum ZIP o nazwie równej numerowi zdającego i prześlij je w sposób wskazany przez nauczyciela.</p>
  <p><b>Czas przeznaczony na wykonanie zadania wynosi 150 minut.</b></p>
  <p>Ocenie podlegać będzie 5 rezultatów:</p>
  ${renderLines(['operacje na bazie danych,', 'zawartość witryny internetowej,', 'działanie witryny internetowej,', 'styl CSS witryny internetowej,', 'skrypty.'])}
</section>`;

// Ilustracja 2: podświetlony drugi wiersz tabeli (efekt :hover) i obliczone BMI dla 70 kg / 175 cm.
const sheetHtml = sheetDocument(`${KOD} – FitPoint – arkusz ćwiczeniowy`, sheet, `
figure.preview.mobile .frame-wrap { height: 900px !important; overflow: hidden; }
`, `
document.querySelectorAll('figure.preview:not(.mobile):not(.zapis) iframe.site').forEach(function (f) {
  f.addEventListener('load', function () {
    try {
      var d = f.contentDocument;
      d.querySelectorAll('tbody tr')[1].style.backgroundColor = '#FEF9C3';
      d.getElementById('waga').value = 70;
      d.getElementById('wzrost').value = 175;
      d.querySelector('.bmi button').click();
    } catch (e) {}
  });
});
`);
P.write('arkusz.html', sheetHtml);

// ---------- klucz ----------
const sqlZ = P.sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));
const wyniki = [
  'widoczne są dokładnie 4 wiersze w kolejności godzin: 08:00 Joga, 17:00 Trening obwodowy, 18:30 Zumba, 19:30 Crossfit, z imionami i nazwiskami trenerów',
  'widocznych jest dokładnie 8 wierszy (bez zajęć o id 4 i 8, które nie mają wolnych miejsc)',
  'widoczne są 4 wiersze w kolejności: Mazur 3, Wójcik 3, Kaczmarek 2, Krawczyk 2 (bez trenera Igora Pawlaka, który nie prowadzi zajęć)',
  'widoczny jest komunikat o dodaniu 1 wiersza',
  'widoczny jest komunikat o zmianie 1 wiersza',
];
const R = [
  ['Operacje na bazie danych', [
    'Wykonany import tabel do bazy danych fitpoint, co jest udokumentowane w pliku import w formacie PNG',
    'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
    ...sqlZ.map((q, i) => `Wykonane zapytanie ${i + 1}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${q} oraz wynik działania udokumentowany zrzutem kw${i + 1}, na którym ${wyniki[i]}`),
  ]],
  ['Zawartość witryny internetowej', [
    'Witryna zapisana w pliku index.php, jawnie zapisany standard kodowania polskich znaków, deklaracja <!DOCTYPE html>, język polski, meta viewport, tytuł „FitPoint – grafik zajęć”',
    'Bloki zdefiniowane znacznikami semantycznymi: header baner, nav menu, main uklad z czterema section, footer stopka, w kolejności zgodnej z ilustracją 3',
    'Baner: odnośnik logo do index.php z „POINT” w span, paragraf haslo; menu: cztery odnośniki do #grafik, #zapis, #bmi, #trenerzy',
    'Sekcje mają klasy i identyfikatory grafik, zapis, bmi, trenerzy oraz nagłówki h2',
    'Formularz filtr: metoda get, akcja index.php, etykieta powiązana z listą dzien zawierającą pięć dni, przycisk typu submit „Pokaż”',
    'Tabela z thead (pięć komórek th: Godzina, Zajęcia, Sala, Trener, Wolne miejsca) i tbody',
    'Formularz zapisu: metoda post, akcja index.php, lista zajecia, pole text imie i pole email o nazwie email z atrybutem required, etykiety powiązane przez for/id, przycisk typu submit „Zapisz mnie”',
    'Sekcja bmi: dwa pola typu number o id waga i wzrost z etykietami, przycisk „Oblicz”, paragraf o id wynik; sekcja trenerzy z blokiem karty',
    'Stopka z adresem i paragrafem „Stronę wykonał: ” z numerem zdającego',
  ]],
  ['Działanie witryny internetowej', [
    'Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracjami 2 i 3: grafik po lewej na wysokość dwóch sekcji, zapis i BMI w kolumnie 320 px, trenerzy na całą szerokość',
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów styl.css, formatowanie CSS pochodzi jedynie z tego arkusza',
    'Menu pozostaje przyklejone do górnej krawędzi okna, a kliknięcie pozycji menu przewija stronę do odpowiedniej sekcji',
    'Po uruchomieniu (bez parametru) wyświetla się grafik na Poniedziałek: 4 wiersze od 08:00 do 19:30; Zumba ma czerwony napis „brak miejsc”; po wykonaniu zapytania 5 Trening obwodowy ma 3 wolne miejsca',
    'Wybranie w filtrze dnia (np. Środa) i kliknięcie „Pokaż” wyświetla grafik tego dnia (Środa: 16:00 Siłownia z trenerem, 19:00 Crossfit – brak miejsc) i nazwę dnia w nagłówku',
    'Lista w formularzu zapisu zawiera tylko zajęcia z wolnymi miejscami (8 opcji, np. „Joga – Poniedziałek 08:00”)',
    'Wysłanie formularza zapisu dodaje rekord do tabeli zapisy (sprawdzić w phpMyAdmin), zmniejsza liczbę wolnych miejsc wybranych zajęć i wyświetla zielony komunikat z imieniem',
    'Kalkulator BMI dla 70 kg i 175 cm wyświetla „Twoje BMI: 22.9 – waga prawidłowa” (dopuszcza się przecinek); dla pustych pól komunikat „Podaj wagę i wzrost”',
    'Przy szerokości do 900 px sekcje są w jednej kolumnie w kolejności: grafik, zapis, BMI, trenerzy; karty trenerów zawijają się do kolejnych wierszy',
  ]],
  ['Styl CSS witryny internetowej', css.map((c) => `Ustawione ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
  ['Skrypty', [
    'Skrypt PHP łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza fitpoint (np. mysqli_connect)',
    'Skrypt 1 odczytuje dzień z $_GET (z użyciem isset), a w przeciwnym razie przyjmuje Poniedziałek; wybrany dzień jest w nagłówku i w zapytaniu',
    'Skrypt 1 tworzy wiersze tabeli z pięcioma komórkami (imię i nazwisko trenera w jednej komórce)',
    'Skrypt 1 dla 0 wolnych miejsc wypisuje komórkę z klasą pelne i tekstem „brak miejsc”',
    'Skrypt 2 tworzy opcje listy z identyfikatorem zajęć w atrybucie value i treścią „nazwa – dzień godzina”',
    'Skrypt 3 sprawdza wysłanie formularza (isset na $_POST) i odczytuje trzy pola formularza',
    'Skrypt 3 wysyła zapytanie INSERT do tabeli zapisy z danymi z formularza i datą NOW() oraz zapytanie UPDATE zmniejszające liczbę miejsc wybranych zajęć',
    'Skrypt 3 wyświetla paragraf potwierdzenie z imieniem tylko po wysłaniu formularza; jest umieszczony przed wypisaniem grafiku',
    'Skrypt 4 tworzy element article z klasą trener z h3 (imię i nazwisko), specjalizacją i paragrafem liczba „Zajęć w tygodniu: <liczba>”',
    'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)',
    'Skrypt 5 jest napisany w języku JavaScript, pobiera wagę i wzrost, sprawdza poprawność wartości i przelicza wzrost na metry',
    'Skrypt 5 oblicza BMI, zaokrągla do jednego miejsca po przecinku i dobiera opis według progów 18,5 i 25',
    'Zastosowano znaczące nazewnictwo zmiennych i funkcji',
  ]],
];
const key = keyDocument({
  title: `${KOD} – FitPoint – klucz`,
  heading: 'FitPoint – zasady oceniania i rozwiązanie',
  meta: `${KOD} · baza fitpoint · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>).`,
  R,
  files: ['kwerendy.txt', 'index.php', 'styl.css', 'skrypt.js'].map((f) => [f, P.sol(f)]),
});
P.write('klucz.html', key.html);
console.log(`arkusz.html, klucz.html (kryteria: ${key.total})`);
