// Buduje arkusz egzaminacyjny "Kino Orbita" (styl INF.03) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/kino/zbuduj.mjs
// Wejście: dla_zdajacego/kino.sql, rozwiazanie/* - podglad.html (index.php?seans=2, baza po zapytaniu 5)
// i podglad_start.html (index.php bez parametru).
import { fileURLToPath } from 'node:url';
import { project, previewDoc, frame, table2, esc, layoutSvg, titlePage, sheetDocument, keyDocument, renderLines, schemaSvg, h, MYSQLI } from '../wspolne.mjs';

const P = project(fileURLToPath(new URL('.', import.meta.url)));
const KOD = 'INF.03-KI-SG';
const ARCHIWUM = { nazwa: 'kino', haslo: 'Orb1ta#Kino' };

const podglad = previewDoc(P.sol);
const podgladStart = previewDoc(P.sol, {
  file: 'podglad_start.html',
  extraCss: '.naglowek,.repertuar,.stopka{display:none}.uklad{grid-template-columns:1fr;padding:12px}',
});

const schema = schemaSvg({
  tables: [
    { name: 'filmy', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'tytul', type: 'VARCHAR(50)' }, { name: 'gatunek', type: 'VARCHAR(30)' }, { name: 'czas_trwania', type: 'INT' }, { name: 'wiek', type: 'INT' }] },
    {
      name: 'seanse',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'filmy_id', type: 'INT', role: 'fk', ref: 'filmy' }, { name: 'data', type: 'DATE' }, { name: 'godzina', type: 'TIME' }, { name: 'sala', type: 'INT' }, { name: 'cena', type: 'DECIMAL(5,2)' }],
    },
    { name: 'rezerwacje', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'seanse_id', type: 'INT', role: 'fk', ref: 'seanse' }, { name: 'rzad', type: 'CHAR(1)' }, { name: 'miejsce', type: 'INT' }] },
  ],
});

const uklad = layoutSvg([
  ['nagłówek (header.naglowek): logo | menu', 30],
  ['main.uklad: repertuar (section) | rezerwacja (aside, 380 px)', 130],
  ['stopka (footer.stopka)', 24],
]);

const zapytania = [
  'Zapytanie 1: wybierające jedynie identyfikator, tytuł, gatunek, czas trwania i ograniczenie wiekowe wszystkich filmów, posortowane alfabetycznie według tytułu',
  'Zapytanie 2: wybierające identyfikator seansu, godzinę w formacie GG:MM (kolumna „godz”) oraz liczbę wolnych miejsc (kolumna „wolne”) seansów filmu o identyfikatorze 1, posortowane według godziny. Sala ma 40 miejsc; liczba wolnych miejsc to 40 minus liczba rezerwacji danego seansu. Należy użyć złączenia LEFT JOIN z tabelą rezerwacje, aby uwzględnić także seanse bez rezerwacji',
  'Zapytanie 3: wybierające jedynie tytuł filmu, datę w formacie DD.MM.RRRR (kolumna „dzien”), godzinę w formacie GG:MM (kolumna „godz”), numer sali i cenę biletu dla seansu o identyfikatorze 2. Należy posłużyć się relacją',
  'Zapytanie 4: wybierające jedynie rząd i numer miejsca wszystkich rezerwacji seansu o identyfikatorze 2',
  'Zapytanie 5: dodające rezerwację miejsca 8 w rzędzie E na seans o identyfikatorze 2',
];

const cechy = [
  'Składa się ze strony o nazwie index.php',
  'Zapisana w języku HTML5, zadeklarowany polski język zawartości witryny, jawnie zastosowany standard kodowania polskich znaków, znacznik meta viewport',
  'Tytuł strony widoczny na karcie przeglądarki: „Kino Orbita – repertuar i rezerwacje”',
  'Arkusz stylów w pliku o nazwie styl.css prawidłowo połączony z kodem strony; wygląd w całości w CSS, bez stylów w atrybutach',
  'Podział strony na bloki zrealizowany za pomocą znaczników semantycznych HTML5 zgodnie z ilustracją 3',
  'Nagłówek (header z klasą naglowek): odnośnik z klasą logo do index.php o treści „KINO ORBITA”, w którym „ORBITA” jest w osobnym elemencie span, oraz blok nawigacyjny z listą punktowaną trzech odnośników: „Repertuar” (index.php), „Cennik” (#), „Kontakt” (#)',
  'Blok główny (main z klasą uklad) zawiera sekcję z klasą repertuar oraz panel (aside) z klasą rezerwacja',
  'Sekcja repertuar: nagłówek pierwszego stopnia „Repertuar – piątek 20.11.2026” oraz blok div z klasą filmy, wypełniony przez skrypty 1 i 2',
  'Panel rezerwacja: zawartość generowana przez skrypt 3; po wybraniu seansu zawiera tytuł, dane seansu, cenę biletu w elemencie span o identyfikatorze cena, blok div z klasą ekran o treści „EKRAN”, blok div z klasą sala z 40 przyciskami miejsc oraz paragraf o identyfikatorze podsumowanie o początkowej treści „Nie wybrano miejsc”',
  'Stopka (footer z klasą stopka): paragraf „Kino Orbita · ul. Filmowa 12 · bilety: 500 100 200” i paragraf „Stronę wykonał: ”, dalej wstawiony numer zdającego',
];

const css = [
  'Domyślnie dla wszystkich selektorów (*): marginesy zewnętrzne i wewnętrzne 0, model pudełkowy border-box. Dla selektora ciała strony: kolor tła #0F0F14, kolor czcionki #E5E7EB, krój Tahoma, w przypadku braku Arial, a następnie sans-serif',
  'Dla selektora odnośnika: kolor dziedziczony, bez podkreślenia. Dla selektora listy punktowanej: brak punktorów',
  'Dla klasy naglowek: układ elastyczny, elementy rozsunięte do krawędzi i wyśrodkowane w pionie, marginesy wewnętrzne: górny i dolny 16 px, lewy i prawy 5%, czarne tło, dolne obramowanie 3 px linią ciągłą #F59E0B. Lista w nagłówku: układ elastyczny, odstęp 24 px; gdy kursor znajdzie się na odnośniku menu, kolor czcionki zmienia się na #F59E0B',
  'Dla klasy logo: rozmiar 1,8 rem, pogrubienie, odstęp między literami 4 px; element span w logo ma kolor #F59E0B',
  'Dla klasy uklad: siatka z kolumnami 1fr i 380 px, odstęp 28 px, elementy wyrównane do góry, maksymalna szerokość 1240 px, blok wyśrodkowany, marginesy wewnętrzne: górny i dolny 28 px, lewy i prawy 20 px. Dla selektora nagłówka pierwszego stopnia: dolny margines 20 px, rozmiar 1,6 rem',
  'Dla klasy filmy: siatka z kolumnami o szerokości co najmniej 180 px, w liczbie mieszczącej się w bloku (repeat(auto-fill, minmax(180px, 1fr))), odstęp 20 px. Dla klasy film: marginesy wewnętrzne 12 px, tło #1C1C24, zaokrąglenie 10 px',
  'Dla klasy plakat: pozycjonowanie względne, proporcje 2 : 3 (aspect-ratio), dolny margines 10 px, zaokrąglenie 8 px. Tło plakatów – gradient liniowy pod kątem 160 stopni: p1 od #1E3A8A do #0EA5E9, p2 od #7C3AED do #F472B6, p3 od #111827 do #B91C1C, p4 od #065F46 do #FCD34D',
  'Dla klasy wiek: pozycjonowanie bezwzględne 8 px od górnej i prawej krawędzi plakatu, marginesy wewnętrzne 2 px / 8 px, tło #F59E0B, czarny pogrubiony tekst 0,8 rem, zaokrąglenie 4 px',
  'Dla nagłówka drugiego stopnia w klasie film: 1,05 rem. Dla klasy info: marginesy: górny 4 px, dolny 10 px, kolor #9CA3AF, 0,85 rem. Dla klasy godziny: układ elastyczny z zawijaniem, odstęp 6 px',
  'Dla klasy godzina: marginesy wewnętrzne 6 px / 10 px, obramowanie 1 px linią ciągłą #F59E0B, zaokrąglenie 6 px, pogrubienie, 0,9 rem; element small w niej: wyświetlanie blokowe, bez pogrubienia, 0,7 rem, kolor #9CA3AF',
  'Gdy kursor znajdzie się na odnośniku z klasą godzina: tło #F59E0B, kolor tekstu czarny (również w elemencie small). Klasa ostatnie: kolor obramowania #EF4444. Klasa pelny: kolor obramowania #4B5563, kolor tekstu #6B7280, tekst przekreślony',
  'Dla klasy rezerwacja: przyklejona 20 px od górnej krawędzi okna (sticky), marginesy wewnętrzne 20 px, tło #1C1C24, zaokrąglenie 10 px; jej nagłówek ma kolor #F59E0B, a paragrafy górny margines 6 px. Dla klasy wskazowka: kolor #9CA3AF, kursywa',
  'Dla klasy ekran: marginesy: górny 22 px, dolny 16 px, marginesy wewnętrzne 6 px, tło – gradient od góry do dołu od #E5E7EB do #374151, kolor tekstu #111827, zaokrąglenie górnej krawędzi w kształcie łuku (border-radius: 50% 50% 0 0 / 100% 100% 0 0), tekst wyśrodkowany, 0,75 rem, odstęp między literami 6 px',
  'Dla klasy sala: siatka z ośmioma równymi kolumnami, odstęp 6 px',
  'Dla klasy miejsce: marginesy wewnętrzne: górny i dolny 8 px, tło #374151, kolor tekstu #E5E7EB, bez obramowania, zaokrąglenie: górne rogi 6 px, dolne 2 px, 0,72 rem, kursor w kształcie dłoni; gdy kursor znajdzie się na miejscu – tło #4B5563',
  'Miejsce z klasą wybrane: tło #22D3EE, czarny pogrubiony tekst. Miejsce z klasą zajete: tło #7F1D1D, kolor tekstu #FCA5A5, kursor „niedozwolone” (not-allowed)',
  'Dla identyfikatora podsumowanie: górny margines 16 px, marginesy wewnętrzne 10 px, obramowanie 1 px linią przerywaną #F59E0B, zaokrąglenie 6 px, wysokość linii 1,6',
  'Dla klasy stopka: marginesy wewnętrzne 18 px, czarne tło, kolor #6B7280, tekst wyśrodkowany, 0,85 rem',
  'W przypadku ekranów o szerokości do 860 px (ilustracja 5): siatka klasy uklad ma jedną kolumnę, panel rezerwacja ma zwykłe pozycjonowanie (static) i jest wyświetlany przed repertuarem (order: -1), a nagłówek układa elementy jeden pod drugim z odstępem 10 px',
];

const skryptyPhp = [
  {
    nr: 1,
    tytul: 'filmy',
    lines: ['Wysyła do bazy danych zapytanie 1',
      {
        text: 'Dla każdego filmu tworzy element article z klasą film, zawierający:',
        children: [
          'blok div z klasami plakat oraz p + identyfikator filmu (np. p3), a w nim element span z klasą wiek: dla ograniczenia 0 tekst „b.o.”, w pozostałych przypadkach wartość ze znakiem +, np. „12+”',
          'nagłówek drugiego stopnia z tytułem i paragraf z klasą info: „<gatunek> · <czas trwania> min”',
          'blok div z klasą godziny wypełniony przez skrypt 2',
        ],
      }],
  },
  {
    nr: 2,
    tytul: 'seanse filmu',
    lines: ['Umieszczony wewnątrz pętli skryptu 1; dla każdego filmu wysyła do bazy zapytanie 2, w którym zamiast identyfikatora 1 użyty jest identyfikator bieżącego filmu',
      {
        text: 'Dla każdego seansu tworzy element z klasą godzina zawierający godzinę oraz element small:',
        children: [
          'gdy wolnych miejsc jest 0: element span z dodatkową klasą pelny i tekstem small „brak miejsc” (nie jest odnośnikiem)',
          'w pozostałych przypadkach: odnośnik do index.php?seans=<id seansu> z tekstem small „wolne: <liczba>”; gdy wolnych miejsc jest 5 lub mniej, odnośnik ma dodatkową klasę ostatnie',
        ],
      }],
  },
  {
    nr: 3,
    tytul: 'plan sali',
    lines: ['Jeżeli w adresie strony nie ma parametru seans, wyświetla paragraf z klasą wskazowka „Wybierz godzinę seansu z repertuaru, aby zobaczyć plan sali.” (ilustracja 4)',
      'W przeciwnym razie wysyła zapytanie 3 dla wybranego seansu i wyświetla: nagłówek drugiego stopnia z tytułem, paragraf „<data>, godz. <godzina> · Sala <numer>” oraz paragraf „Cena biletu: <cena> zł”, w którym cena jest w elemencie span o identyfikatorze cena',
      'Wysyła zapytanie 4 dla wybranego seansu i zapisuje zajęte miejsca w tablicy jako napisy złożone z rzędu i numeru, np. „A1”',
      'Wyświetla blok ekran, a pod nim blok sala z przyciskami miejsc dla rzędów A–E i miejsc 1–8 (dwie zagnieżdżone pętle) – w kolejności A1…A8, B1…B8 itd.; treścią przycisku jest oznaczenie miejsca',
      'Przycisk miejsca zajętego (znajdującego się w tablicy) ma klasy miejsce i zajete oraz atrybut disabled; przycisk miejsca wolnego ma klasę miejsce, a jego kliknięcie uruchamia skrypt 4',
      'Pod salą wyświetla paragraf o identyfikatorze podsumowanie z tekstem „Nie wybrano miejsc”'],
  },
];
const skryptJs = [
  'Wywoływany po kliknięciu przycisku wolnego miejsca',
  'Jeżeli kliknięte miejsce nie jest wybrane, a wybrane są już 4 miejsca, wyświetla w paragrafie podsumowanie tekst „Można wybrać najwyżej 4 miejsca” i nie zmienia wyboru',
  'W przeciwnym razie przełącza klasę wybrane klikniętego przycisku (dodaje, gdy jej nie ma; usuwa, gdy jest)',
  'Gdy żadne miejsce nie jest wybrane, wyświetla w paragrafie podsumowanie tekst „Nie wybrano miejsc”; w przeciwnym razie tekst „Wybrane miejsca: <lista>”, a w nowej linii „Do zapłaty: <kwota> zł”, gdzie <lista> to oznaczenia wybranych miejsc rozdzielone przecinkiem i spacją, a <kwota> to cena biletu (odczytana z elementu cena) pomnożona przez liczbę wybranych miejsc, z dwoma miejscami po przecinku (ilustracja 2)',
];

const SQL_POMOC = [
  ['LEFT JOIN', 'Złączenie zwracające wszystkie wiersze z lewej tabeli, także bez pasujących wierszy w prawej'],
  ['COUNT(kolumna)', 'Liczba wartości różnych od NULL w grupie'],
  ['TIME_FORMAT(czas, \'%H:%i\')', 'Godzina i minuty, np. 20:15'],
  ['DATE_FORMAT(data, \'%d.%m.%Y\')', 'Data, np. 20.11.2026'],
];
const PHP_POMOC = [
  ['isset($_GET[\'nazwa\'])', 'TRUE, gdy w adresie strony jest parametr, np. index.php?nazwa=2'],
  ['in_array(wartość, tablica)', 'TRUE, gdy wartość znajduje się w tablicy'],
  ['$tablica[] = wartość', 'Dodanie elementu na koniec tablicy'],
];
const CSS_POMOC = [
  ['repeat(auto-fill, minmax(180px, 1fr))', 'Tyle kolumn, ile się zmieści, każda co najmniej 180 px'],
  ['aspect-ratio: 2 / 3', 'Proporcje szerokości do wysokości'],
  ['border-radius: 50% 50% 0 0 / 100% 100% 0 0', 'Promienie poziome / pionowe rogów – górna krawędź w kształcie łuku'],
  ['order: -1', 'Element wyświetlany przed pozostałymi elementami siatki'],
  ['cursor: not-allowed', 'Kursor oznaczający niedostępną akcję'],
  ['a.godzina:hover small', 'Element small w odnośniku z klasą godzina wskazanym kursorem'],
];
const JS_POMOC = [
  ['document.querySelectorAll(\'.klasa\')', 'Lista elementów z klasą; liczba elementów: lista.length'],
  ['element.classList.toggle(\'klasa\')', 'Dodaje klasę, gdy jej nie ma, lub usuwa, gdy jest'],
  ['element.classList.contains(\'klasa\')', 'true, gdy element ma klasę'],
  ['tablica.push(x), tablica.join(\', \')', 'Dodanie elementu; połączenie elementów w napis'],
  ['liczba.toFixed(2)', 'Napis z liczbą z dwoma miejscami po przecinku'],
];

const sheet = `${titlePage(KOD, 'Kino Orbita – repertuar i rezerwacje')}
<section class="page task">
  <h2 class="task-title">Zadanie egzaminacyjne</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj aplikację internetową kina z repertuarem i wyborem miejsc na sali, wykorzystując pakiet XAMPP oraz edytor zaznaczający składnię.</p>
  <p>Aby wykonać zadanie, należy zalogować się na konto <b>Egzamin</b> bez hasła. Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować.</p>
  <p>Na pulpicie konta Egzamin należy utworzyć folder. Jako nazwy folderu należy użyć numeru zdającego. Po skończonej pracy wszystkie wyniki należy zapisać w tym folderze.</p>

  <h3>Operacje na bazie danych</h3>
  <p>Baza danych zawiera trzy tabele połączone relacjami, przedstawione na ilustracji 1. Pole wiek w tabeli filmy to ograniczenie wiekowe (0 – bez ograniczeń). Każda sala ma 40 miejsc: rzędy A–E po 8 miejsc. Każdy rekord tabeli rezerwacje to jedno zajęte miejsce. Nazwa kina i filmy są wymyślone.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <p>Za pomocą narzędzia phpMyAdmin wykonaj następujące operacje na bazie danych:</p>
  <ul class="dash">
    <li>Utwórz bazę danych o nazwie <b>kino</b>, z zestawem polskich znaków (np. utf8mb4_polish_ci)</li>
    <li>Z rozpakowanego archiwum zaimportuj tabele z pliku kino.sql do utworzonej bazy</li>
    <li>Wykonaj zrzut ekranu po imporcie. Zapisz zrzut w formacie PNG pod nazwą import. Nie kadruj zrzutu. Powinien on obejmować cały ekran monitora, z widocznym paskiem zadań. Na zrzucie powinny być widoczne elementy wskazujące na poprawnie wykonany import tabel</li>
    <li>Wykonaj zapytania SQL działające na bazie kino (zapytanie 5 dokładnie jeden raz). Zapytania zapisz w pliku kwerendy.txt. Wykonaj zrzuty ekranu przedstawiające wyniki działania kwerend. Zrzuty zapisz w formacie PNG i nadaj im nazwy kw1, kw2, kw3, kw4, kw5. Zrzuty powinny obejmować cały ekran monitora z widocznym paskiem zadań
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>
  <p>W tabeli 1 zamieszczono wybrane elementy języka SQL.</p>

  <h3>Witryna internetowa</h3>
  ${frame(podglad, 2, 'Wygląd witryny na ekranie o szerokości 1280 px: adres index.php?seans=2 po wykonaniu zapytania 5, wybrane miejsca C4 i C5, kursor na godzinie 16:00; dane pochodzą z bazy', 1280, 0.5)}
  <div class="with-layout"><div>
  ${frame(podgladStart, 4, 'Panel rezerwacja bez wybranego seansu (adres index.php)', 344, 0.6, { cls: 'start' })}
  </div><figure class="layout">${uklad}<figcaption>Ilustracja 3. Układ bloków</figcaption></figure></div>
  ${frame(podglad, 5, 'Wygląd witryny na ekranie o szerokości 420 px (adres index.php?seans=2, początek strony)', 420, 0.6, { cls: 'mobile' })}
  <p>Cechy witryny:</p>
  ${renderLines(cechy)}

  <h3>Styl CSS witryny internetowej</h3>
  <p>Styl CSS zdefiniowany jest w całości w zewnętrznym pliku o nazwie styl.css. W tabeli 3 zamieszczono pomoc do niektórych właściwości CSS. Cechy formatowania CSS, działające na stronie:</p>
  ${renderLines(css)}
  <p class="note">Uwaga: styl CSS ciała strony, odnośnika, listy punktowanej i nagłówka pierwszego stopnia należy zdefiniować wyłącznie przy pomocy selektora tych znaczników. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.</p>

  <h3>Skrypty działające po stronie serwera (PHP)</h3>
  <p>W tabeli 2 zamieszczono wybrane funkcje i zmienne PHP. Wymagania dotyczące skryptów:</p>
  ${renderLines(['Napisane w języku PHP', 'Należy stosować znaczące nazewnictwo zmiennych i funkcji w języku polskim lub angielskim', 'Łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie kino', 'Na końcu zamykane jest połączenie z serwerem'])}
  ${skryptyPhp.map((s) => `<p class="script-name">Skrypt ${s.nr} (${s.tytul}):</p>${renderLines(s.lines)}`).join('')}
  <h3>Skrypt działający po stronie klienta (JavaScript)</h3>
  <p>W tabeli 4 zamieszczono wybrane elementy języka JavaScript. Skrypt jest napisany w języku JavaScript (w pliku skrypt.js lub w znaczniku script), należy stosować znaczące nazewnictwo zmiennych i funkcji.</p>
  <p class="script-name">Skrypt 4 (wybór miejsc):</p>${renderLines(skryptJs)}

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

// Ilustracja 2: wybrane C4 i C5 (kliknięcia), efekt :hover na godzinie 16:00.
const sheetHtml = sheetDocument(`${KOD} – Kino Orbita – arkusz ćwiczeniowy`, sheet, `
figure.preview.mobile .frame-wrap { height: 900px !important; overflow: hidden; }
figure.preview.start .frame-wrap { height: 62px !important; overflow: hidden; }
`, `
document.querySelectorAll('figure.preview:not(.start) iframe.site').forEach(function (f) {
  f.addEventListener('load', function () {
    try {
      var d = f.contentDocument;
      d.querySelectorAll('.miejsce').forEach(function (b) { if (b.innerHTML === 'C4' || b.innerHTML === 'C5') b.click(); });
      if (!f.closest('.mobile')) {
        d.querySelectorAll('a.godzina').forEach(function (a) {
          if (a.textContent.indexOf('16:00') === 0) { a.style.backgroundColor = '#F59E0B'; a.style.color = '#000'; a.querySelector('small').style.color = '#000'; }
        });
      }
      dopasuj();
    } catch (e) {}
  });
});
`);
P.write('arkusz.html', sheetHtml);

// ---------- klucz ----------
const sqlZ = P.sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));
const wyniki = [
  'widoczne są dokładnie 4 wiersze w kolejności: Cień nad miastem, Kosmiczne psy, Ostatni rejs, Szczyt',
  'widoczne są dokładnie 2 wiersze: 17:00 – 36 wolnych, 20:15 – 28 wolnych (przed wykonaniem zapytania 5; po nim 27)',
  'widoczny jest jeden wiersz: Ostatni rejs, 20.11.2026, 20:15, sala 2, cena 28.00',
  'widocznych jest 12 wierszy (od A1 do E1; 13 wierszy z E8, jeżeli zapytanie 5 zostało już wykonane)',
  'widoczny jest komunikat o dodaniu 1 wiersza',
];
const R = [
  ['Operacje na bazie danych', [
    'Wykonany import tabel do bazy danych kino, co jest udokumentowane w pliku import w formacie PNG',
    'Zapisany plik kwerendy.txt zawierający co najmniej jedno zapytanie SQL wynikające z treści zadania',
    ...sqlZ.map((q, i) => `Wykonane zapytanie ${i + 1}. W pliku z kwerendami lub na zrzucie istnieje zapis np. ${q} oraz wynik działania udokumentowany zrzutem kw${i + 1}, na którym ${wyniki[i]}`),
  ]],
  ['Zawartość witryny internetowej', [
    'Witryna zapisana w pliku index.php, jawnie zapisany standard kodowania polskich znaków, deklaracja <!DOCTYPE html>, język polski, meta viewport, tytuł „Kino Orbita – repertuar i rezerwacje”',
    'Bloki zdefiniowane znacznikami semantycznymi zgodnie z ilustracją 3: header naglowek, main uklad z section repertuar i aside rezerwacja, footer stopka',
    'Nagłówek: odnośnik logo do index.php z „ORBITA” w span, nav z listą trzech odnośników (Repertuar do index.php)',
    'Sekcja repertuar: nagłówek h1 „Repertuar – piątek 20.11.2026” i blok filmy',
    'Stopka z dwoma paragrafami, w drugim „Stronę wykonał: ” z numerem zdającego',
  ]],
  ['Działanie witryny internetowej', [
    'Układ bloków po uruchomieniu w przeglądarce jest zgodny z ilustracjami 2 i 3: repertuar po lewej, panel rezerwacji 380 px po prawej',
    'Strona zawiera działające połączenie z zewnętrznym arkuszem stylów styl.css, formatowanie CSS pochodzi jedynie z tego arkusza',
    'Wyświetlają się 4 filmy w kolejności alfabetycznej z plakatami w różnych gradientach i oznaczeniami wieku (Kosmiczne psy: b.o., Cień nad miastem: 16+)',
    'Godziny seansów każdego filmu są posortowane i pokazują liczbę wolnych miejsc; 21:00 (wolne: 4) ma czerwoną ramkę, 18:45 jest przekreślona z napisem „brak miejsc” i nie jest odnośnikiem; 12:00 ma 40 wolnych (seans bez rezerwacji)',
    'Po otwarciu index.php bez parametru panel zawiera tylko wskazówkę; kliknięcie godziny 20:15 otwiera index.php?seans=2 z tytułem Ostatni rejs, datą, salą 2 i ceną 28.00 zł',
    'Plan sali ma 5 rzędów po 8 miejsc pod łukowym ekranem; miejsca zajęte (13 po wykonaniu zapytania 5, w tym E8) są czerwone i nie dają się kliknąć',
    'Kliknięcie wolnego miejsca zaznacza je na turkusowo, a podsumowanie pokazuje listę miejsc i kwotę (np. C4, C5 – 56.00 zł); ponowne kliknięcie odznacza miejsce',
    'Nie można wybrać piątego miejsca – pojawia się komunikat o limicie 4 miejsc; po odznaczeniu wszystkich wraca „Nie wybrano miejsc”',
    'Przy szerokości do 860 px panel rezerwacji jest wyświetlany nad repertuarem, w jednej kolumnie; liczba kolumn filmów dopasowuje się do szerokości',
  ]],
  ['Styl CSS witryny internetowej', css.map((c) => `Ustawione ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
  ['Skrypty', [
    'Skrypt PHP łączy się z serwerem MySQL na localhost, użytkownik root bez hasła, baza kino (np. mysqli_connect)',
    'Skrypt 1 wysyła zapytanie 1 i tworzy element article film z blokiem plakat i klasą p + id filmu',
    'Skrypt 1 wyświetla „b.o.” dla wieku 0, a w pozostałych przypadkach wiek ze znakiem +; tytuł w h2 i paragraf info „gatunek · czas min”',
    'Skrypt 2 jest wywoływany w pętli dla każdego filmu z identyfikatorem bieżącego filmu w zapytaniu (LEFT JOIN, COUNT)',
    'Skrypt 2 tworzy odnośnik index.php?seans=<id> z godziną i liczbą wolnych miejsc; klasa ostatnie dla 5 lub mniej wolnych miejsc',
    'Skrypt 2 dla 0 wolnych miejsc tworzy element span z klasą pelny i tekstem „brak miejsc” zamiast odnośnika',
    'Skrypt 3 sprawdza parametr seans (isset na $_GET) i bez niego wyświetla wskazówkę',
    'Skrypt 3 wyświetla dane seansu z zapytania 3 i cenę w span o id cena',
    'Skrypt 3 zapisuje zajęte miejsca z zapytania 4 w tablicy i generuje 40 przycisków w dwóch zagnieżdżonych pętlach (rzędy A–E, miejsca 1–8)',
    'Skrypt 3 nadaje zajętym miejscom klasę zajete i atrybut disabled (np. in_array), a wolnym obsługę kliknięcia uruchamiającą skrypt 4',
    'Na końcu skryptu zamykane jest połączenie z serwerem (np. mysqli_close)',
    'Skrypt 4 jest napisany w języku JavaScript i przełącza klasę wybrane klikniętego przycisku',
    'Skrypt 4 ogranicza wybór do 4 miejsc i wyświetla komunikat o limicie',
    'Skrypt 4 tworzy listę oznaczeń wybranych miejsc rozdzieloną przecinkami i oblicza kwotę jako cena × liczba miejsc z dwoma miejscami po przecinku',
    'Zastosowano znaczące nazewnictwo zmiennych i funkcji',
  ]],
];
const key = keyDocument({
  title: `${KOD} – Kino Orbita – klucz`,
  heading: 'Kino Orbita – zasady oceniania i rozwiązanie',
  meta: `${KOD} · baza kino · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>).`,
  R,
  files: ['kwerendy.txt', 'index.php', 'styl.css', 'skrypt.js'].map((f) => [f, P.sol(f)]),
});
P.write('klucz.html', key.html);
console.log(`arkusz.html, klucz.html (kryteria: ${key.total})`);
