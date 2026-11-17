// Buduje arkusz PROJEKTOWY "Biblioteka szkolna" (pełny CRUD, kilka plików PHP) oraz klucz z zasadami oceniania.
// Uruchomienie z katalogu repozytorium: node przyklady/biblioteka/zbuduj.mjs
// Wejście: dla_zdajacego/biblioteka.sql, rozwiazanie/*.php|css|js, podglądy podglad*.html (wynik działania stron).
import { fileURLToPath } from 'node:url';
import { project, previewDoc, frame, table2, esc, titlePage, sheetDocument, keyDocument, renderLines, schemaSvg, h, MYSQLI } from '../wspolne.mjs';

const P = project(fileURLToPath(new URL('.', import.meta.url)));
const KOD = 'INF.03-BS-PR';
const ARCHIWUM = { nazwa: 'biblioteka', haslo: 'Ks1azki!CRUD' };
const PLIKI_PHP = ['polaczenie.php', 'menu.php', 'index.php', 'dodaj.php', 'edytuj.php', 'usun.php', 'wypozyczenia.php'];

const pv = (file, extraCss = '') => previewDoc(P.sol, { file, extraCss });
const tylkoTresc = '.naglowek,.stopka{display:none}.tresc{padding:12px}';
const podgladKatalog = pv('podglad.html');
const podgladDodaj = pv('podglad_dodaj.html', tylkoTresc);
const podgladEdytuj = pv('podglad_edytuj.html', tylkoTresc);
const podgladUsun = pv('podglad_usun.html', tylkoTresc);
const podgladBlokada = pv('podglad_usun_blokada.html', tylkoTresc);
const podgladWyp = pv('podglad_wypozyczenia.html');

const schema = schemaSvg({
  tables: [
    { name: 'kategorie', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'nazwa', type: 'VARCHAR(30)' }] },
    {
      name: 'ksiazki',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'tytul', type: 'VARCHAR(80)' }, { name: 'autor', type: 'VARCHAR(50)' }, { name: 'rok_wydania', type: 'INT' },
        { name: 'isbn', type: 'CHAR(13)' }, { name: 'egzemplarze', type: 'INT' }, { name: 'kategorie_id', type: 'INT', role: 'fk', ref: 'kategorie' }],
    },
    {
      name: 'wypozyczenia',
      columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'ksiazki_id', type: 'INT', role: 'fk', ref: 'ksiazki' }, { name: 'czytelnicy_id', type: 'INT', role: 'fk', ref: 'czytelnicy' },
        { name: 'data_wypozyczenia', type: 'DATE' }, { name: 'data_zwrotu', type: 'DATE' }],
    },
    { name: 'czytelnicy', columns: [{ name: 'id', type: 'INT', role: 'pk' }, { name: 'imie', type: 'VARCHAR(30)' }, { name: 'nazwisko', type: 'VARCHAR(30)' }, { name: 'klasa', type: 'VARCHAR(5)' }] },
  ],
});

// Schemat przepływu między stronami aplikacji.
function mapaStron() {
  const box = (x, y, w, t, sub, fill = '#fff') => `<rect x="${x}" y="${y}" width="${w}" height="46" rx="6" fill="${fill}" stroke="#222" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + 20}" font-size="13" font-weight="bold" text-anchor="middle">${h(t)}</text><text x="${x + w / 2}" y="${y + 37}" font-size="11" text-anchor="middle">${h(sub)}</text>`;
  const arrow = (x1, y1, x2, y2, label = '', dx = 0, dy = -4) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222" stroke-width="1.3" marker-end="url(#g)"/>${label ? `<text x="${(x1 + x2) / 2 + dx}" y="${(y1 + y2) / 2 + dy}" font-size="10.5" text-anchor="middle" fill="#7C2D12">${h(label)}</text>` : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 250" width="640" height="250" font-family="Arial, sans-serif">
<defs><marker id="g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#222"/></marker></defs>
${box(230, 8, 180, 'index.php', 'katalog – READ', '#FFF7ED')}
${box(10, 140, 170, 'dodaj.php', 'CREATE (POST)', '#ECFDF5')}
${box(235, 140, 170, 'edytuj.php?id=…', 'UPDATE (POST)', '#EFF6FF')}
${box(460, 140, 170, 'usun.php?id=…', 'DELETE (POST)', '#FEF2F2')}
${box(460, 8, 170, 'wypozyczenia.php', 'INSERT / UPDATE', '#F5F3FF')}
${arrow(260, 54, 110, 138, 'menu', -18)}
${arrow(320, 54, 320, 138, 'Edytuj', 22)}
${arrow(380, 54, 530, 138, 'Usuń', 16)}
${arrow(140, 186, 140, 220)}${arrow(320, 186, 320, 220)}${arrow(545, 186, 545, 220)}
<line x1="140" y1="222" x2="545" y2="222" stroke="#7C2D12" stroke-width="1.3" stroke-dasharray="5 3"/>
<text x="320" y="242" font-size="11" text-anchor="middle" fill="#7C2D12">po zapisie: header('Location: index.php?komunikat=…') – dodano / zmieniono / usunieto</text>
${arrow(410, 31, 458, 31)}
<text x="320" y="72" font-size="10" text-anchor="middle" fill="#555">każda strona: require_once 'polaczenie.php'; include 'menu.php';</text>
</svg>`;
}

const zapytania = [
  'Zapytanie 1 (READ): wybierające jedynie tytuł i autora książki oraz nazwę jej kategorii, posortowane alfabetycznie według tytułu',
  'Zapytanie 2 (READ): wybierające tytuł i liczbę dostępnych egzemplarzy każdej książki (kolumna „dostepne”) – liczba egzemplarzy minus liczba niezwróconych wypożyczeń (data_zwrotu jest pusta). Muszą zostać uwzględnione również książki bez wypożyczeń (LEFT JOIN; warunek pustej daty zwrotu należy umieścić w klauzuli ON złączenia). Wynik posortowany według tytułu',
  'Zapytanie 3 (READ): wybierające imię i nazwisko czytelnika, tytuł oraz liczbę dni od wypożyczenia do 17 listopada 2026 (kolumna „dni”) dla niezwróconych książek przetrzymywanych dłużej niż 14 dni, posortowane malejąco według liczby dni. Należy posłużyć się relacjami (trzy tabele)',
  'Zapytanie 4 (CREATE): dodające książkę: Solaris, Stanisław Lem, 1961, ISBN 9788306791051, 2 egzemplarze, kategoria Fantastyka (id 2)',
  'Zapytanie 5 (UPDATE): zmieniające liczbę egzemplarzy książki o tytule Solaris na 3',
  'Zapytanie 6 (DELETE): usuwające książkę o tytule Solaris',
];

const ETAP_STRUKTURA = [
  'Aplikacja składa się z plików: polaczenie.php, menu.php, index.php, dodaj.php, edytuj.php, usun.php, wypozyczenia.php, styl.css i skrypt.js (schemat przepływu – ilustracja 3)',
  'Plik polaczenie.php łączy się z serwerem MySQL na localhost (użytkownik root bez hasła, baza biblioteka) i ustawia kodowanie połączenia utf8mb4 (mysqli_set_charset). Każda strona dołącza go na początku instrukcją require_once',
  'Plik menu.php zawiera wspólny nagłówek (header z klasą naglowek): odnośnik z klasą logo do index.php o treści „📚 Biblioteka szkolna”, gdzie słowo „szkolna” jest w elemencie span, oraz blok nav z odnośnikami „Katalog” (index.php), „Dodaj książkę” (dodaj.php), „Wypożyczenia” (wypozyczenia.php). Każda strona dołącza go instrukcją include',
  'Przed dołączeniem menu każda strona ustawia zmienną $aktywna (katalog, dodaj lub wypozyczenia); odnośnik bieżącej strony otrzymuje klasę aktywna (edytuj.php i usun.php należą do katalogu)',
  'Każda strona: HTML5, język polski, kodowanie UTF-8, meta viewport, tytuł karty zaczynający się od „Biblioteka szkolna – ” (np. „Biblioteka szkolna – katalog”), arkusz styl.css, treść w bloku main z klasą tresc zaczynająca się nagłówkiem pierwszego stopnia, stopka (footer z klasą stopka) „Projekt wykonał: ”, dalej numer zdającego',
  'Dane, które wpisał użytkownik (tytuł, autor, ISBN, fraza wyszukiwania), są wyświetlane przez htmlspecialchars; identyfikatory i liczby z formularzy są rzutowane na liczbę całkowitą ((int)), a teksty przed wstawieniem do zapytania przekazywane przez mysqli_real_escape_string',
  'Na końcu każdej strony zamykane jest połączenie z serwerem; po przekierowaniu (header) połączenie jest zamykane przed instrukcją exit',
];

const ETAP_KATALOG = [
  'Nagłówek „Katalog książek”. Jeżeli w adresie jest parametr komunikat o wartości dodano, zmieniono lub usunieto, nad wyszukiwarką wyświetla się paragraf z klasami komunikat i sukces o treści odpowiednio: „Dodano nową książkę.”, „Zapisano zmiany.”, „Książka została usunięta.” (inne wartości są ignorowane)',
  'Formularz z klasą wyszukiwarka wysyłany metodą GET do index.php: pole typu search o nazwie szukaj z podpowiedzią „Tytuł lub autor”, lista kategoria (pierwsza opcja „Wszystkie kategorie” o wartości 0, kolejne – kategorie z bazy posortowane według nazwy, wartością jest id) i przycisk „Szukaj”. Po wyszukaniu pole i lista zachowują wybrane wartości (atrybuty value i selected)',
  'Tabela z klasą katalog i nagłówkiem: Tytuł, Autor, Rok, Kategoria, Dostępne, Akcje. Wiersze tabeli pochodzą z zapytania jak zapytanie 2, rozszerzonego o id, autora, rok, nazwę kategorii i liczbę egzemplarzy oraz warunek: tytuł LUB autor zawiera wpisaną frazę (LIKE), a jeżeli wybrano kategorię – także kategoria równa wybranej',
  'Kolumna Dostępne ma postać „<dostępne> / <egzemplarze>” (np. „0 / 2”); gdy dostępnych egzemplarzy jest 0, komórka ma klasę brak',
  'Kolumna Akcje (komórka z klasą akcje) zawiera odnośniki z klasami przycisk i edytuj („Edytuj”, do edytuj.php?id=<id>) oraz przycisk i usun („Usuń”, do usun.php?id=<id>)',
  'Gdy żadna książka nie spełnia warunków, tabela zawiera jeden wiersz z komórką z klasą pusto, zajmującą 6 kolumn (colspan), o treści „Nie znaleziono książek.”. Pod tabelą paragraf z klasą podsumowanie „Liczba tytułów: <liczba wierszy wyniku>”',
];

const ETAP_DODAJ = [
  'Strona dodaj.php: nagłówek „Dodaj książkę” i formularz z klasą formularz wysyłany metodą POST do dodaj.php; przed wysłaniem uruchamiany jest skrypt JS 1 (onsubmit="return sprawdzIsbn()")',
  'Pola formularza z etykietami powiązanymi przez for/id: tytul (text, „Tytuł”), autor (text, „Autor”), w bloku div z klasą wiersz dwa bloki: rok (number, „Rok wydania”) i egzemplarze (number, min 1, „Liczba egzemplarzy”), isbn (text, maxlength 13, „ISBN (13 cyfr)”), pod nim pusty paragraf o identyfikatorze blad-isbn, lista kategoria („Kategoria”, opcje z bazy). Na dole blok div z klasą przyciski: przycisk „Dodaj książkę” i odnośnik z klasami przycisk i anuluj „Anuluj” do index.php',
  'Po wysłaniu formularza skrypt PHP sprawdza dane (po usunięciu spacji z początku i końca – trim): tytuł i autor niepuste, rok od 1400 do 2026, ISBN o długości 13, liczba egzemplarzy co najmniej 1; komunikaty błędów: „Podaj tytuł.”, „Podaj autora.”, „Rok wydania musi być z przedziału 1400–2026.”, „ISBN musi mieć 13 cyfr.”, „Liczba egzemplarzy musi być co najmniej 1.”',
  'Jeżeli są błędy, nad formularzem wyświetla się lista punktowana z klasami komunikat i bledy zawierająca wszystkie błędy, a pola formularza zachowują wpisane wartości (ilustracja 4)',
  'Jeżeli błędów nie ma, książka jest dodawana do bazy (INSERT), a przeglądarka zostaje przekierowana do index.php?komunikat=dodano',
  'Strona edytuj.php?id=<id>: nagłówek „Edycja książki”, formularz jak w dodaj.php wysyłany do edytuj.php, z ukrytym polem id i przyciskiem „Zapisz zmiany”; po otwarciu pola są wypełnione danymi książki z bazy, a na liście zaznaczona jest jej kategoria (ilustracja 5)',
  'Po wysłaniu edytuj.php sprawdza dane tak samo jak dodaj.php; bez błędów zapisuje zmiany (UPDATE … WHERE id = <id>) i przekierowuje do index.php?komunikat=zmieniono',
  'Jeżeli książka o podanym id nie istnieje, edytuj.php wyświetla zamiast formularza paragraf z klasami komunikat i bledy „Nie ma książki o podanym identyfikatorze.” z odnośnikiem „Wróć do katalogu”',
];

const ETAP_USUN = [
  'Strona usun.php?id=<id>: nagłówek „Usuwanie książki”. Jeżeli książka nie istnieje – komunikat jak w edytuj.php',
  'Jeżeli książka ma niezwrócone wypożyczenia, wyświetla się paragraf z klasami komunikat i bledy: „Nie można usunąć książki „<tytuł>”, ponieważ jest wypożyczona (liczba egzemplarzy u czytelników: <liczba>).” z odnośnikiem „Wróć do katalogu”; książka nie jest usuwana (ilustracja 7)',
  'W pozostałych przypadkach wyświetla się blok div z klasą potwierdzenie z pytaniem „Czy na pewno usunąć książkę „<tytuł>” (<autor>)?” (tytuł w znaczniku strong), paragrafem z klasą uwaga „Zostanie usunięta także historia wypożyczeń tej książki.” oraz formularzem POST z ukrytym polem id, przyciskiem o nazwie potwierdz z klasą usun „Tak, usuń” i odnośnikiem „Anuluj” (ilustracja 6)',
  'Usunięcie następuje dopiero po wysłaniu formularza (metoda POST, a nie samo otwarcie adresu): najpierw usuwana jest historia wypożyczeń książki, potem książka (klucz obcy), po czym następuje przekierowanie do index.php?komunikat=usunieto',
];

const ETAP_WYP = [
  'Strona wypozyczenia.php: nagłówek „Wypożyczenia”, komunikaty „Zapisano wypożyczenie.” / „Zapisano zwrot książki.” dla parametrów komunikat=wypozyczono / zwrocono',
  'Formularz z klasami formularz i poziomy (POST, ukryte pole akcja o wartości wypozycz): lista ksiazka zawierająca tylko książki z dostępnymi egzemplarzami (HAVING), w postaci „<tytuł> (dostępne: <liczba>)”, lista czytelnik w postaci „<nazwisko> <imię> (<klasa>)” posortowana według nazwiska i imienia, przycisk „Wypożycz”',
  'Po wysłaniu formularza wypożyczenia dodawany jest rekord z bieżącą datą (CURDATE()) i pustą datą zwrotu, a następnie przekierowanie do wypozyczenia.php?komunikat=wypozyczono',
  'Nagłówek drugiego stopnia „Książki u czytelników” i tabela niezwróconych wypożyczeń posortowanych według daty: Czytelnik (imię i nazwisko), Klasa, Tytuł, Wypożyczono (DD.MM.RRRR), Dni (liczba dni od wypożyczenia do dziś – DATEDIFF i CURDATE), Zwrot. Wiersz wypożyczenia trwającego ponad 14 dni ma klasę przetrzymana. Gdy nie ma wypożyczeń – wiersz „Wszystkie książki są w bibliotece.”',
  'W kolumnie Zwrot formularz POST (ukryte pola akcja = zwrot i wypozyczenie = id) z przyciskiem z klasą maly „Zwróć”; przed wysłaniem uruchamiany jest skrypt JS 2. Zwrot ustawia datę zwrotu na bieżącą (UPDATE) i przekierowuje do wypozyczenia.php?komunikat=zwrocono. Pod tabelą paragraf z klasą legenda „Wiersze wyróżnione na czerwono: książka przetrzymana dłużej niż 14 dni.”',
];

const JS = [
  'Skrypt JS 1 (sprawdzIsbn, dodaj.php i edytuj.php): jeżeli wartość pola isbn nie ma 13 znaków lub nie jest liczbą, wyświetla w paragrafie blad-isbn „ISBN musi składać się z 13 cyfr” i zwraca false',
  'Skrypt JS 1 oblicza cyfrę kontrolną ISBN-13: suma pierwszych 12 cyfr, w której cyfry na pozycjach 1, 3, 5, … mają wagę 1, a na pozycjach 2, 4, 6, … wagę 3; cyfra kontrolna = (10 − suma mod 10) mod 10. Jeżeli różni się od 13. cyfry, wyświetla „Niepoprawna cyfra kontrolna ISBN (powinna być <cyfra>)” i zwraca false; w przeciwnym razie czyści komunikat i zwraca true (ilustracja 5)',
  'Skrypt JS 2 (potwierdzZwrot, wypozyczenia.php): wyświetla okno potwierdzenia „Czy potwierdzasz zwrot książki?” (confirm) i zwraca odpowiedź użytkownika – po wybraniu „Anuluj” formularz nie jest wysyłany',
];

const css = [
  'Wspólny arkusz styl.css dla wszystkich stron. Domyślnie (*): marginesy 0, model border-box. Ciało strony: układ elastyczny kolumnowy, minimalna wysokość 100vh (stopka zawsze na dole okna), tło #FAF7F2, kolor #2B2118, krój Georgia, w przypadku braku Times New Roman, a następnie serif, wysokość linii 1,5',
  'Nagłówki: h1 – kolor #7C2D12, 1,8 rem, dolny margines 18 px; h2 – kolor #7C2D12, 1,3 rem, marginesy górny 28 px i dolny 12 px',
  'Klasa naglowek: układ elastyczny, elementy rozsunięte i wyśrodkowane w pionie, zawijanie, odstęp 12 px, marginesy wewnętrzne 14 px / 5%, tło #7C2D12, biały tekst. Logo: biały pogrubiony tekst 1,5 rem bez podkreślenia; span w logo – kolor #FDBA74, kursywa',
  'Odnośniki menu: marginesy wewnętrzne 8 px / 14 px, zaokrąglenie 4 px, biały tekst bez podkreślenia, krój Arial; po najechaniu tło rgba(255, 255, 255, 0.15); odnośnik z klasą aktywna – tło #FDBA74, kolor #431407, pogrubienie',
  'Klasa tresc: zajmuje wolne miejsce w pionie (flex: 1), szerokość 100%, maksymalnie 1100 px, wyśrodkowana, marginesy wewnętrzne 28 px / 20 px. Klasa stopka: marginesy wewnętrzne 14 px, tło #431407, kolor #FED7AA, tekst wyśrodkowany, 0,85 rem',
  'Klasa komunikat: dolny margines 16 px, marginesy wewnętrzne 12 px / 16 px, zaokrąglenie 6 px, krój Arial. Klasa sukces: tło #DCFCE7 i lewe obramowanie 5 px #16A34A; klasa bledy: tło #FEE2E2, lewe obramowanie 5 px #DC2626, punktory wewnątrz bloku (list-style-position: inside)',
  'Klasa formularz: maksymalna szerokość 560 px, marginesy wewnętrzne 24 px, białe tło, obramowanie 1 px #E7DCCB, zaokrąglenie 8 px. Formularz z klasą poziomy: układ elastyczny, elementy wyrównane do dołu, odstęp 14 px, bez ograniczenia szerokości; bloki div w nim dzielą szerokość po równo',
  'Klasa wyszukiwarka: układ elastyczny, odstęp 8 px, dolny margines 18 px; pole wyszukiwania zajmuje wolne miejsce, a lista ma automatyczną szerokość. Klasa wiersz: siatka z dwiema równymi kolumnami, odstęp 16 px',
  'Etykiety: wyświetlanie blokowe, marginesy 12 px / 4 px (w formularzu poziomym bez górnego), Arial, 0,9 rem, pogrubienie. Pola input i select: szerokość 100%, marginesy wewnętrzne 9 px, obramowanie 1 px #C8B8A0, zaokrąglenie 4 px, czcionka dziedziczona; aktywne pole: kolor obramowania #7C2D12 i obrys 2 px #FDBA74',
  'Przyciski i odnośniki z klasą przycisk (wspólna reguła): inline-block, marginesy wewnętrzne 9 px / 18 px, tło #7C2D12, biały tekst bez podkreślenia, bez obramowania, zaokrąglenie 4 px, Arial 0,95 rem, kursor w kształcie dłoni; po najechaniu tło #9A3412. Klasa anuluj – tło #E7DCCB i ciemny tekst, klasa edytuj – tło #2563EB, klasa usun – tło #DC2626; przyciski w komórce akcje i z klasą maly – marginesy wewnętrzne 4 px / 10 px, 0,8 rem',
  'Klasa przyciski: układ elastyczny, odstęp 10 px, górny margines 20 px. Klasa akcje: tekst bez łamania wierszy (white-space: nowrap), odnośniki w niej z prawym marginesem 4 px. Identyfikator blad-isbn: kolor #DC2626, 0,85 rem',
  'Tabela: szerokość 100%, scalone obramowania, białe tło, Arial 0,92 rem; komórki nagłówkowe: marginesy wewnętrzne 10 px, tło #431407, biały tekst wyrównany do lewej; komórki danych: marginesy wewnętrzne 8 px / 10 px, dolne obramowanie 1 px #E7DCCB; wiersz tbody wskazany kursorem – tło #FFF7ED',
  'Klasa brak: kolor #DC2626, pogrubienie. Klasa przetrzymana: tło #FEE2E2. Klasa pusto: tekst wyśrodkowany, kursywa. Klasy podsumowanie i legenda: górny margines 10 px, kolor #78716C, 0,9 rem. Klasa potwierdzenie: maksymalna szerokość 560 px, marginesy wewnętrzne 24 px, białe tło, obramowanie 2 px #DC2626, zaokrąglenie 8 px; klasa uwaga: górny margines 8 px, kolor #78716C, 0,9 rem',
  'Dla ekranów do 760 px (ilustracja 9): wyszukiwarka i formularz poziomy układają elementy w kolumnie (rozciągnięte na szerokość), blok wiersz ma jedną kolumnę, lista w wyszukiwarce ma pełną szerokość, w tabeli katalog ukryte są kolumny Autor, Rok i Kategoria (selektor :nth-child), a odnośniki w komórce akcje są wyświetlane blokowo jeden pod drugim (dolny margines 4 px, tekst wyśrodkowany)',
];

const SQL_POMOC = [
  ['LEFT JOIN t ON warunek1 AND warunek2', 'Złączenie zachowujące wszystkie wiersze lewej tabeli; dodatkowy warunek w ON nie usuwa wierszy bez dopasowania'],
  ['DATEDIFF(data1, data2)', 'Liczba dni od data2 do data1'],
  ['CURDATE()', 'Bieżąca data'],
  ['HAVING warunek', 'Warunek na wynikach grup (po GROUP BY)'],
  ['kolumna LIKE \'%fraza%\'', 'Napis zawierający frazę'],
  ['INSERT / UPDATE / DELETE', 'Dodanie / zmiana / usunięcie rekordów'],
];
const PHP_POMOC = [
  ['require_once \'plik.php\'; include \'plik.php\';', 'Dołączenie pliku PHP (require – błąd krytyczny, gdy pliku brak)'],
  ['mysqli_set_charset(id, \'utf8mb4\')', 'Ustawienie kodowania połączenia'],
  ['mysqli_real_escape_string(id, napis)', 'Napis bezpieczny do wstawienia w zapytanie SQL'],
  ['htmlspecialchars(napis)', 'Napis bezpieczny do wyświetlenia w HTML (np. < → &lt;)'],
  ['(int) wartość', 'Wartość zamieniona na liczbę całkowitą'],
  ['trim(napis), strlen(napis)', 'Napis bez spacji na początku i końcu; długość napisu'],
  ['header(\'Location: adres\'); exit;', 'Przekierowanie przeglądarki (przed wysłaniem treści HTML)'],
  ['$tablica[] = x; count($tablica)', 'Dodanie elementu; liczba elementów'],
];
const JS_POMOC = [
  ['<form onsubmit="return funkcja()">', 'Formularz wysyłany tylko, gdy funkcja zwróci true'],
  ['napis[i], napis.length, isNaN(napis)', 'Znak na pozycji i (od 0); długość; true, gdy napis nie jest liczbą'],
  ['a % b', 'Reszta z dzielenia'],
  ['confirm(\'pytanie\')', 'Okno OK/Anuluj; zwraca true dla OK'],
];

const ETAPY = [
  ['Etap 2. Struktura aplikacji i pliki wspólne', ETAP_STRUKTURA],
  ['Etap 3. Katalog książek – odczyt (index.php)', ETAP_KATALOG],
  ['Etap 4. Dodawanie i edycja – CREATE, UPDATE (dodaj.php, edytuj.php)', ETAP_DODAJ],
  ['Etap 5. Usuwanie – DELETE (usun.php)', ETAP_USUN],
  ['Etap 6. Wypożyczenia i zwroty (wypozyczenia.php)', ETAP_WYP],
];

const sheet = `${titlePage(KOD, 'Biblioteka szkolna – aplikacja CRUD', { czas: '2 × 150 minut', naglowek: 'ARKUSZ PROJEKTOWY – APLIKACJA INTERNETOWA', podtytul: 'ZADANIE ROZSZERZONE · KWALIFIKACJA INF.03' })}
<section class="page task">
  <h2 class="task-title">Zadanie projektowe</h2>
  <p>UWAGA: numer z dziennika, którym został podpisany arkusz, jest w zadaniu nazywany numerem zdającego.</p>
  <p>Wykonaj wielostronicową aplikację internetową biblioteki szkolnej z pełną obsługą danych (CRUD – dodawanie, odczyt, zmiana i usuwanie) oraz rejestrem wypożyczeń, wykorzystując pakiet XAMPP oraz edytor zaznaczający składnię. Zadanie jest podzielone na etapy; zaleca się wykonywać je w podanej kolejności i sprawdzać działanie po każdym etapie. Projekt realizowany jest na dwóch zajęciach po 150 minut – po pierwszych zajęciach należy zapisać dotychczasowe pliki i zrzut bazy (eksport) w folderze z numerem zdającego.</p>
  <p>Na pulpicie znajduje się archiwum 7z o nazwie <b>${ARCHIWUM.nazwa}</b> zabezpieczone hasłem: <b class="mono">${h(ARCHIWUM.haslo)}</b>. Archiwum należy rozpakować. Na pulpicie należy utworzyć folder o nazwie równej numerowi zdającego i zapisywać w nim wszystkie wyniki.</p>

  <h3>Etap 1. Baza danych</h3>
  <p>Baza danych zawiera cztery tabele połączone relacjami (ilustracja 1). Każdy rekord tabeli wypozyczenia to jeden wypożyczony egzemplarz; pusta data_zwrotu oznacza, że książka jest u czytelnika. Czytelnicy i wypożyczenia są wymyśleni.</p>
  <figure class="schema">${schema}<figcaption>Ilustracja 1. Baza danych</figcaption></figure>
  <ul class="dash">
    <li>Utwórz bazę danych <b>biblioteka</b> z zestawem polskich znaków (np. utf8mb4_polish_ci) i zaimportuj do niej plik biblioteka.sql. Wykonaj zrzut ekranu po imporcie (import.png, cały ekran z paskiem zadań)</li>
    <li>Wykonaj w podanej kolejności zapytania SQL, zapisz je w pliku kwerendy.txt i wykonaj zrzuty wyników kw1–kw6 (zapytania 4–6 wykonują operacje CRUD na tym samym rekordzie, więc po nich baza wraca do stanu wyjściowego)
      <ul class="dash">${zapytania.map((z) => `<li>${h(z)}</li>`).join('')}</ul></li>
  </ul>

  <figure class="layout" style="text-align:center">${mapaStron()}<figcaption>Ilustracja 3. Strony aplikacji i przepływ między nimi</figcaption></figure>
  ${frame(podgladKatalog, 2, 'Strona index.php po dodaniu książki (adres index.php?komunikat=dodano), szerokość 1280 px', 1280, 0.5)}

  ${ETAPY.map(([t, items]) => `<h3>${h(t)}</h3>${renderLines(items)}${{
    'Etap 4. Dodawanie i edycja – CREATE, UPDATE (dodaj.php, edytuj.php)': `<div class="obok">${frame(podgladDodaj, 4, 'dodaj.php po wysłaniu formularza z pustym tytułem, rokiem 3000 i za krótkim ISBN (sprawdzenie w PHP)', 760, 0.42)}${frame(podgladEdytuj, 5, 'edytuj.php?id=9 – po zmianie ostatniej cyfry ISBN i kliknięciu „Zapisz zmiany” (sprawdzenie w JS)', 760, 0.42, { cls: 'edytuj' })}</div>`,
    'Etap 5. Usuwanie – DELETE (usun.php)': `<div class="obok">${frame(podgladUsun, 6, 'usun.php?id=8 – potwierdzenie usunięcia', 760, 0.42, { cls: 'usun' })}${frame(podgladBlokada, 7, 'usun.php?id=5 – książka wypożyczona', 760, 0.42, { cls: 'usun' })}</div>`,
    'Etap 6. Wypożyczenia i zwroty (wypozyczenia.php)': frame(podgladWyp, 8, 'Strona wypozyczenia.php w dniu 17.11.2026 (szerokość 1280 px)', 1280, 0.5),
  }[t] || ''}`).join('\n')}

  <h3>Etap 7. Skrypty JavaScript (plik skrypt.js, dołączany w dodaj.php, edytuj.php i wypozyczenia.php)</h3>
  ${renderLines(JS)}

  <h3>Etap 8. Styl CSS</h3>
  <p>Wygląd wszystkich stron jest zgodny z ilustracjami. Wymagane cechy formatowania:</p>
  ${renderLines(css)}
  ${frame(podgladKatalog, 9, 'index.php na ekranie o szerokości 420 px', 420, 0.55, { cls: 'mobile' })}

  <div class="help-tables">
  ${table2('Tabela 1. Wybrane elementy języka SQL (MySQL)', ['Zapis', 'Znaczenie'], esc(SQL_POMOC))}
  ${table2('Tabela 2. Wybrane funkcje i konstrukcje PHP', ['Zapis', 'Znaczenie'], esc([...MYSQLI, ...PHP_POMOC]))}
  ${table2('Tabela 3. Wybrane elementy JavaScript', ['Zapis', 'Znaczenie'], esc(JS_POMOC))}
  </div>

  <p class="note">UWAGA: po zakończeniu pracy utwórz plik przeglądarka.txt z nazwą przeglądarki, w której sprawdzano działanie aplikacji.</p>
  <p>W folderze z numerem zdającego powinny znajdować się: import.png, kw1.png – kw6.png, kwerendy.txt, przeglądarka.txt, ${PLIKI_PHP.join(', ')}, styl.css, skrypt.js. Spakuj folder do archiwum ZIP o nazwie równej numerowi zdającego.</p>
  <p>Ocenie podlegać będzie 8 rezultatów: baza danych, struktura i pliki wspólne, odczyt, dodawanie i edycja, usuwanie, wypożyczenia, JavaScript, styl CSS.</p>
</section>`;

// Ilustracja 5: zmieniona ostatnia cyfra ISBN i wywołany sprawdzIsbn (formularz nie zostaje wysłany).
const sheetHtml = sheetDocument(`${KOD} – Biblioteka szkolna – arkusz projektowy`, sheet, `
.obok { display: flex; gap: 12px; justify-content: center; align-items: flex-start; }
.obok figure.preview { flex: 1; margin: 6px 0; }
figure.preview.usun .frame-wrap { height: 120px !important; overflow: hidden; }
figure.preview.mobile .frame-wrap { height: 560px !important; overflow: hidden; }
figure.layout svg { max-width: 100%; height: auto; }
`, `
document.querySelectorAll('figure.preview.edytuj iframe.site').forEach(function (f) {
  f.addEventListener('load', function () {
    try {
      var d = f.contentDocument;
      var pole = d.getElementById('isbn');
      pole.value = pole.value.slice(0, 12) + ((Number(pole.value[12]) + 1) % 10);
      f.contentWindow.sprawdzIsbn();
      dopasuj();
    } catch (e) {}
  });
});
`);
P.write('arkusz.html', sheetHtml);

// ---------- klucz ----------
const sqlZ = P.sol('kwerendy.txt').split(/-- Zapytanie \d+\n/).slice(1).map((x) => x.trim().replace(/\n/g, ' '));
const wyniki = [
  '10 wierszy od „Czysty kod” do „Wiedźmin. Ostatnie życzenie” z nazwami kategorii',
  '10 wierszy; „Hobbit…” i „Morderstwo w Orient Expressie” mają 0 dostępnych, „Kamienie na szaniec” 4 (książka bez wypożyczeń jest widoczna)',
  '3 wiersze: Kacper Wiśniewski – Hobbit (28), Szymon Kamiński – Lalka (22), Szymon Kamiński – Morderstwo w Orient Expressie (18)',
  'komunikat o dodaniu 1 wiersza',
  'komunikat o zmianie 1 wiersza',
  'komunikat o usunięciu 1 wiersza',
];
const R = [
  ['Baza danych', [
    'Wykonany import bazy biblioteka (zrzut import.png)',
    'Plik kwerendy.txt zawiera zapytania w kolejności z treści zadania',
    ...sqlZ.map((q, i) => `Zapytanie ${i + 1}: np. ${q} – na zrzucie kw${i + 1}: ${wyniki[i]}`),
  ]],
  ['Struktura aplikacji i pliki wspólne', [
    'Komplet plików aplikacji o nazwach z treści zadania',
    'polaczenie.php łączy się z bazą biblioteka i ustawia kodowanie utf8mb4; jest dołączany przez require_once na każdej stronie (żadna strona nie ma własnego mysqli_connect)',
    'menu.php zawiera nagłówek z logo (span „szkolna”) i trzema odnośnikami; dołączany przez include na każdej stronie',
    'Odnośnik bieżącej strony ma klasę aktywna (ustawiana na podstawie zmiennej $aktywna; przy edycji i usuwaniu aktywny jest Katalog)',
    'Każda strona ma poprawny szkielet HTML5 (lang, charset, viewport), tytuł „Biblioteka szkolna – …”, main z klasą tresc, nagłówek h1 i stopkę „Projekt wykonał: ” z numerem zdającego',
    'Dane użytkownika są wyświetlane przez htmlspecialchars (np. wpisanie <b>test</b> w wyszukiwarce nie pogrubia tekstu)',
    'Identyfikatory i liczby są rzutowane na int, a teksty w zapytaniach przechodzą przez mysqli_real_escape_string (np. wyszukanie frazy z apostrofem nie powoduje błędu SQL)',
    'Połączenie z serwerem jest zamykane na końcu każdej strony oraz przed przekierowaniem',
  ]],
  ['Katalog – odczyt', [
    'index.php wyświetla tabelę 10 książek posortowanych według tytułu z kolumnami: Tytuł, Autor, Rok, Kategoria, Dostępne, Akcje',
    'Kolumna Dostępne pokazuje „dostępne / egzemplarze” wyliczone z niezwróconych wypożyczeń (Hobbit 0 / 2, Pan Tadeusz 2 / 3); dla 0 komórka ma klasę brak',
    'Wyszukiwarka filtruje po fragmencie tytułu lub autora (np. „sien” → Quo vadis), a lista kategorii po kategorii; oba warunki działają razem',
    'Po wyszukaniu pole i lista zachowują wybrane wartości',
    'Gdy brak wyników – wiersz „Nie znaleziono książek.” na całą szerokość tabeli; pod tabelą liczba tytułów zgodna z liczbą wierszy',
    'Komunikaty dodano / zmieniono / usunieto wyświetlają się tylko dla tych trzech wartości parametru',
    'Odnośniki Edytuj i Usuń prowadzą do edytuj.php?id=… i usun.php?id=… z właściwym identyfikatorem',
  ]],
  ['Dodawanie i edycja', [
    'Formularz dodawania zawiera wszystkie pola z etykietami (for/id), listę kategorii z bazy, przyciski „Dodaj książkę” i „Anuluj”',
    'PHP sprawdza wszystkie pięć warunków i wyświetla listę wszystkich błędów naraz',
    'Po błędzie pola formularza zachowują wpisane wartości (również wybraną kategorię)',
    'Poprawne dane są zapisywane w bazie (INSERT), a przeglądarka przechodzi do index.php?komunikat=dodano; odświeżenie strony nie dodaje książki ponownie',
    'edytuj.php wypełnia formularz danymi wybranej książki i zaznacza jej kategorię; formularz zawiera ukryte pole id',
    'Zapis edycji zmienia tylko wybraną książkę (UPDATE … WHERE id) i przekierowuje z komunikatem zmieniono',
    'Edycja sprawdza dane tak samo jak dodawanie; dla nieistniejącego id wyświetla komunikat zamiast formularza',
  ]],
  ['Usuwanie', [
    'usun.php wyświetla potwierdzenie z tytułem i autorem; samo otwarcie adresu nie usuwa książki',
    'Usunięcie następuje po wysłaniu formularza POST „Tak, usuń”; „Anuluj” wraca do katalogu',
    'Książki z niezwróconymi wypożyczeniami nie można usunąć – wyświetla się komunikat z liczbą egzemplarzy u czytelników',
    'Przed usunięciem książki usuwana jest jej historia wypożyczeń (brak błędu klucza obcego, np. dla „Kamienie na szaniec”, które mają tylko zwrócone wypożyczenia); po usunięciu przekierowanie z komunikatem usunieto',
    'Dla nieistniejącego id wyświetla się komunikat z odnośnikiem do katalogu',
  ]],
  ['Wypożyczenia', [
    'Lista książek w formularzu zawiera tylko tytuły z dostępnymi egzemplarzami (bez Hobbita i Orient Expressu) z liczbą dostępnych',
    'Lista czytelników ma postać „nazwisko imię (klasa)” i jest posortowana według nazwiska',
    'Wypożyczenie dodaje rekord z bieżącą datą i pustą datą zwrotu; liczba dostępnych w katalogu zmniejsza się o 1',
    'Tabela pokazuje tylko niezwrócone wypożyczenia posortowane według daty, z datą w formacie DD.MM.RRRR i liczbą dni liczoną od dziś (DATEDIFF, CURDATE)',
    'Wiersze wypożyczeń dłuższych niż 14 dni mają klasę przetrzymana (17.11.2026: Hobbit, Lalka, Orient Express)',
    'Przycisk „Zwróć” ustawia datę zwrotu na dziś; książka znika z tabeli, a dostępność w katalogu rośnie',
    'Po każdej operacji następuje przekierowanie z odpowiednim komunikatem',
  ]],
  ['JavaScript', [
    'Formularze dodawania i edycji wywołują sprawdzIsbn przez onsubmit="return …"',
    'Dla ISBN o długości innej niż 13 lub zawierającego litery wyświetla się komunikat i formularz nie jest wysyłany',
    'Cyfra kontrolna liczona poprawnie (wagi 1 i 3): 9788306791051 jest akceptowany, 9788306791052 odrzucany z informacją, że cyfra powinna być 1',
    'Poprawny ISBN czyści komunikat i formularz jest wysyłany',
    'Zwrot książki wymaga potwierdzenia (confirm); „Anuluj” przerywa wysłanie',
  ]],
  ['Styl CSS', css.map((c) => `Ustawione: ${c.charAt(0).toLowerCase()}${c.slice(1)}`)],
];
const notes = [
  'Uwaga: zapytanie 2 bez warunku data_zwrotu w ON (np. w WHERE) pomija książki bez wypożyczeń – kryterium niespełnione. W zapytaniu 3 dopuszcza się CURDATE() – wtedy liczby dni zależą od daty wykonania.',
  'Uwaga: kryteria sprawdzić w kodzie źródłowym wszystkich plików PHP.',
  'Uwaga: kryteria sprawdzić na działającej aplikacji (XAMPP) z bazą po imporcie.',
  'Uwaga: przekierowanie sprawdzić, odświeżając stronę po zapisie (F5) – nie może pojawić się pytanie o ponowne wysłanie formularza.',
  'Uwaga: sprawdzić, że usuwanie metodą GET (samo wejście na usun.php?id=…) nie zmienia bazy.',
  'Uwaga: liczby dni zależą od bieżącej daty – podane wartości dotyczą 17.11.2026.',
  'Uwaga: skrypty sprawdzić w przeglądarce z otwartą konsolą (brak błędów).',
  'Uwaga: kryteria muszą działać na stronie (sprawdzić w inspektorze); wspólny arkusz dla wszystkich stron.',
];
const key = keyDocument({
  title: `${KOD} – Biblioteka szkolna – klucz`,
  heading: 'Biblioteka szkolna (projekt CRUD) – zasady oceniania i rozwiązanie',
  meta: `${KOD} · baza biblioteka · archiwum ${ARCHIWUM.nazwa} (hasło: <code>${h(ARCHIWUM.haslo)}</code>).`,
  R,
  notes,
  files: ['kwerendy.txt', ...PLIKI_PHP, 'styl.css', 'skrypt.js'].map((f) => [f, P.sol(f)]),
});
P.write('klucz.html', key.html);
console.log(`arkusz.html, klucz.html (kryteria: ${key.total})`);
