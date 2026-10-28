# Generator arkuszy INF.03

Aplikacja webowa generująca **nowe arkusze egzaminacyjne** do kwalifikacji INF.03 *(Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych – część praktyczna)*. Do każdego arkusza dostajesz też **klucz oceniania**, **rozwiązanie wzorcowe** i **materiały dla zdającego** (zrzut bazy `.sql`, obrazy).

Generator powstał na podstawie analizy 18 arkuszy z 2026 roku oraz 152 egzaminów E.14, EE.09 i INF.03 z lat 2018–2026 razem z ich zasadami oceniania (wnioski: [`docs/analiza-arkuszy.md`](docs/analiza-arkuszy.md)). Odtwarza ich strukturę, styl poleceń i zakres umiejętności, ale treść każdego arkusza jest nowa.

> Arkusze są materiałem ćwiczeniowym i są tak oznaczone. Nie są oficjalnymi arkuszami CKE.

## Uruchomienie

Wymagany jest Node.js 18 lub nowszy. Nie trzeba instalować żadnych pakietów.

```bash
npm start            # albo: node server.mjs 8080
```

Następnie otwórz http://localhost:8080.

`server.mjs` udostępnia pliki aplikacji i pośredniczy w połączeniu z Pixabay. Dzięki temu zdjęcia trafiają do paczki ZIP.

Aplikacja działa też na dowolnym serwerze plików, np. `python3 -m http.server 8080`, albo na GitHub Pages, ale wtedy bez pośrednika. Jeśli przeglądarka zablokuje Pixabay (CORS), zdjęcia będą widoczne tylko w podglądzie. Generator wyświetli wtedy odpowiedni komunikat.

`index.html` trzeba otwierać przez serwer HTTP: moduły ES nie działają z `file://`.

## Co generuje

| Element | Opis |
|---|---|
| **Arkusz** (`arkusz.html`) | Strona tytułowa, treść zadania, schemat bazy, podgląd witryny, układ bloków, wymagania CSS, opis skryptów, tabele pomocy i lista plików. Format A4, numeracja „Strona X z Y”; drukuje się do PDF przez Ctrl+P. |
| **Baza danych** | Od 2 do 3 tabel z relacjami i realistycznymi polskimi danymi; zrzut SQL w stylu phpMyAdmin (`CREATE TABLE`, `INSERT`, klucze obce). |
| **Kwerendy** | 4–6 zapytań z 37 wzorców, dobieranych z wagami według częstości w korpusie: selekcja z warunkami (`=`, `<`, `AND`, `OR`, `BETWEEN`, `LIKE`), sortowanie, `LIMIT`, `DISTINCT`, `RAND()`, funkcje agregujące z aliasami i `ROUND`, `GROUP BY`, `JOIN`, `LEFT JOIN`, `NOT IN`, `INSERT`, `UPDATE`, `DELETE`, `ALTER TABLE` (`ADD`, `ADD … AFTER`, `MODIFY`, `DROP COLUMN`), `CREATE TABLE`, `DROP TABLE`, `CREATE USER`, `GRANT`. |
| **Tematy** | 30 dziedzin, każda z 2–3 tabelami i relacjami: kwiaciarnia, biblioteka, schronisko, hotel, pizzeria, klub fitness, koncerty, wypożyczalnia samochodów, szkoła jazdy, sklep komputerowy, biuro podróży, weterynarz, wędkarstwo, prognoza pogody, salon fryzjerski, piekarnia, sklep z oponami, koło szachowe, kawiarnia, zoo, muzeum, teatr, szkoła językowa, apteka, stacja paliw, firma kurierska, kemping, sklep sportowy, galeria sztuki, stadnina koni. |
| **Witryna** | 10 układów bloków, w tym z dwoma banerami i dwiema stopkami, jak w arkuszach CKE; technika układu float, flexbox albo grid; opcjonalna responsywność (`@media` dla ekranów do 800 px); szerokość strony 100%, 1000 px lub 1200 px. Treść składa się z widżetów: listy, tabele (także ze scalonymi komórkami), formularze, obrazy, kontakt, listy definicji. |
| **Skrypty PHP** | Data z polskim dniem tygodnia, lista definicji, tabela z wynikami zapytania (opcjonalnie z kolumną wyliczaną), lista, lista według wzoru zdania, galeria, statystyki, karty z losowymi rekordami, bloki z warunkiem, filtr przez przyciski opcji, wyszukiwanie po początku nazwy, lista rozwijana ze szczegółami i obliczeniem wartości, formularze `INSERT` i `UPDATE`, dwie strony połączone parametrem `GET`. |
| **Skrypty JS** | Losowa ciekawostka (`Math.random`), podmiana obrazu po najechaniu, walidacja przy utracie fokusu, kalkulator kosztu (radio/select, checkbox, rabat), suwak, bieżąca data, galeria miniatur, pokaz zdjęć, zakładki, pokaż/ukryj, zmiana rozmiaru i koloru tekstu, walidacja i podsumowanie formularza, lista zadań, licznik odwiedzin (localStorage), wyszukiwarka w tablicy obiektów. |
| **CSS** | 10 palet (nazwy kolorów CSS i hex), 10 krojów pisma, reguły dla bloków, znaczników, klas i odnośników w menu (`nav a`), z adnotacją „wyłącznie selektor znacznika”. Do tego „smaczki” z arkuszy: gradient, cień tekstu, odstępy między wyrazami. Pseudoklasy podstawowe (`:hover`) albo rozszerzone: `:nth-child`, `::first-letter`, `::first-line`, `:focus`, `:active`, `:visited`, `transform` z `transition`, `filter`. |
| **Grafika / animacja** | Kadrowanie do wymiarów, skalowanie z zachowaniem proporcji, przezroczyste tło, odbicie, obrót, odcienie szarości (z wagami według częstości w arkuszach); animacja GIF z paska klatek. Wymiary grafik wynikają z szerokości strony i bloku, w którym stoi obraz (np. logo dopasowane do wysokości banera). Zdający dostaje większy oryginał do przeskalowania. |
| **Klucz** (`klucz.html`) | Zasady oceniania w formacie CKE: kryteria R.1.1–R.5.n po 1 pkt (około 40), z uwagami dla egzaminatora, przykładowym SQL i oczekiwaną liczbą wierszy na zrzucie. Do tego wyniki kwerend wyliczone na danych z arkusza i pełne rozwiązanie wzorcowe. |

### Zdjęcia z Pixabay

Domyślnie obrazy w arkuszu i paczce są grafikami zastępczymi. Generator może też dołączać prawdziwe zdjęcia z [Pixabay](https://pixabay.com/):

1. Załóż darmowe konto na pixabay.com i skopiuj klucz z [pixabay.com/api/docs](https://pixabay.com/api/docs/).
2. W panelu „Zdjęcia z Pixabay” wklej klucz i zaznacz „Dołączaj zdjęcia z Pixabay”. Klucz zostaje tylko w tej przeglądarce (localStorage).

Jak dobierane są zdjęcia:

- **Hasła:** zdjęcia z bazy (np. `kwiat3.jpg`) szukane są po nazwie rekordu („Storczyk kwiaty”), obrazy witryny po haśle przypisanym do pliku („róża”, „plaża”). Wyszukiwanie odbywa się po polsku (`lang=pl`), z hasłem zapasowym dla tematu.
- **Wybór wyniku:** zależy od kodu arkusza, więc ten sam arkusz dostaje te same zdjęcia.
- **Format:** zdjęcia są kadrowane do 640×440 px (JPEG), a logo do 300×300 px (PNG). Wchodzą do podglądu, arkusza i paczki ZIP.
- **Autorzy:** podane są w kluczu i w pliku `zrodla_zdjec.txt` (licencja Pixabay Content License).
- **Limit API:** wyniki wyszukiwania są zapamiętywane na 24 h, zgodnie z zasadami API, co ogranicza liczbę zapytań (limit Pixabay to 100 na minutę).
- **Gdy się nie uda:** obrazy, których nie udało się pobrać, zostają grafikami zastępczymi.
- **Połączenie:** przy uruchomieniu przez `npm start` zapytania i zdjęcia idą przez lokalny serwer (`/api/pixabay`, `/api/pixabay-image`, tylko adresy Pixabay), więc nie dotyczy ich blokada CORS. Bez pośrednika aplikacja łączy się z Pixabay bezpośrednio, a wyszukiwanie ma zapasową ścieżkę JSONP.
- **Paczka ZIP:** czeka na zakończenie pobierania zdjęć.

### Warianty

- **Baza danych + PHP**: skrypty połączenia z bazą korzystają z kwerend z arkusza.
- **Baza danych + JavaScript**: kwerendy są niezależne, a witryna ma skrypty po stronie klienta.
- **Baza danych + PHP i JavaScript**: na jednej stronie są skrypty PHP korzystające z bazy i skrypty po stronie klienta. W arkuszu są osobne sekcje dla obu języków i obie tabele pomocy.
- **Animacja + JavaScript**: zamiast operacji na bazie jest animacja GIF.

### Opcje wyglądu

W panelu „Wygląd i układ” wybierasz:

- **układ bloków** (10 do wyboru albo losowy),
- **technikę** (float, flexbox, grid),
- **responsywność** (włączona lub wyłączona),
- **pseudoklasy** (podstawowe lub rozszerzone),
- **szerokość strony** (100% okna, 1000 px, 1200 px).

Każda opcja może też być losowa. Wybrane ustawienia trafiają do wymagań CSS w arkuszu, do zasad oceniania i do rozwiązania wzorcowego.

Układy z dwoma banerami lub dwiema stopkami zawsze używają techniki float.

### Powtarzalność

Każdy arkusz ma **kod (seed)**. Ten sam kod z tymi samymi ustawieniami zawsze daje identyczny arkusz, bazę i klucz. Link z przycisku „Link” zapisuje wszystkie ustawienia w adresie (`#s=KOD&t=…`).

### Zestaw dla klasy

Panel „Zestaw dla klasy” tworzy ZIP z N różnymi arkuszami (kody `KOD-01`, `KOD-02`, …). Każdy arkusz ma swój klucz i swoje materiały.

## Struktura paczki ZIP

```
INF.03-07-SG_ABCD1234/
├── arkusz.html            treść zadania (do druku / PDF)
├── klucz.html             wyniki kwerend, kryteria oceniania, rozwiązanie
├── CZYTAJ_MNIE.txt        nazwa archiwum i hasło
├── dla_zdajacego/pliki7/  zawartość archiwum dla zdającego (baza .sql, obrazy)
└── rozwiazanie/           index.php|html, styl.css, skrypt.js, kwerendy.txt, obrazy
```

Archiwum 7z z hasłem trzeba utworzyć samodzielnie, np. `7z a -pHASLO pliki7.7z dla_zdajacego/pliki7/*`. Przeglądarka nie potrafi zapisać zaszyfrowanego pliku 7z.

## Architektura

```
index.html, css/app.css      interfejs
server.mjs                   serwer lokalny (pliki + pośrednik Pixabay)
js/ui/app.js                 obsługa formularza, podglądy, eksport (canvas -> PNG/JPEG)
js/core/                     rdzeń - czyste moduły ES, działają w przeglądarce i w Node.js
  rng.js                     deterministyczny PRNG (mulberry32) z niezależnymi strumieniami
  themes.js, data.js         bank 30 tematów: tabele, role kolumn, słowniki danych
  db.js                      generowanie rekordów, zrzut SQL, diagram relacji (SVG)
  sql.js                     model zapytań: SQL, opis po polsku, wykonanie na danych
  queries.js                 wzorce zapytań dobierane do schematu tematu
  widgets.js, widgets-extra.js  widżety treści (HTML/PHP/JS + opis + podgląd)
  site.js                    układy bloków, rozmieszczanie widżetów, numeracja, strony
  css.js                     wymagania CSS + styl.css (float/flex/grid, @media, pseudoklasy)
  sizing.js                  wymiary grafik dopasowane do szerokości strony i bloków
  graphics.js                zadania z grafiki i animacji
  exam.js                    orkiestrator: model arkusza, rozwiązanie
  grading.js                 zasady oceniania R.1–R.5 w formacie CKE
  sheet.js, key.js           renderowanie arkusza i klucza do HTML
  placeholders.js            obrazy zastępcze (SVG)
  images.js                  plan zdjęć (hasła Pixabay, wymiary, format) i lista autorów
  zip.js, package.js         paczka ZIP bez zewnętrznych bibliotek
js/ui/pixabay.js             klient API Pixabay: wyszukiwanie, pamięć podręczna 24 h, kadrowanie
```

Każde zapytanie jest opisane strukturą (`spec`). Z tej samej struktury powstają tekst polecenia, kod SQL, kod PHP (z parametrem w miejscu wartości z formularza) i oczekiwany wynik. Dlatego treść arkusza, rozwiązanie i klucz zawsze są ze sobą zgodne.

### Rozszerzanie

- **Nowy temat**: dodaj obiekt w `js/core/themes.js`. Wystarczy opisać tabele i role kolumn (`name`, `cat`, `price`, `num`, `date`, `file`, `fk`, …). Wzorce zapytań i widżety dopasują się same.
- **Nowy widżet**: dodaj obiekt z metodami `plan` i `render` w `js/core/widgets.js` i dopisz go do puli w `site.js`.
- **Nowy wzorzec kwerendy**: dodaj funkcję w `PATTERNS` (`js/core/queries.js`).

## Testy

```bash
npm test                                   # testy jednostkowe (Node >= 18)
node tests/integration.mjs 100 [--all-themes]  # MariaDB/MySQL + PHP: import bazy, każda kwerenda, strony PHP (GET/POST)
NODE_PATH=$(npm root -g) node tests/browser.mjs 30   # Playwright: działanie skryptów JS
NODE_PATH=$(npm root -g) node tests/pixabay.mjs      # Playwright: zdjęcia z Pixabay na atrapie API (pośrednik, brak CORS, CORS, zły klucz)
```

Test integracyjny importuje wygenerowany zrzut do prawdziwej bazy. Potem wykonuje każdą kwerendę i porównuje wynik z kluczem. Rozwiązanie PHP uruchamia przez `php -S` i wysyła formularze. Test przeglądarkowy klika, wpisuje i sprawdza efekt każdego skryptu JS.
