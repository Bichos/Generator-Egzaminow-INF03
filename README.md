# Generator arkuszy INF.03

Aplikacja webowa generująca **nowe arkusze egzaminacyjne** do kwalifikacji INF.03 *(Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych – część praktyczna)*. Do każdego arkusza dostajesz też **klucz oceniania**, **rozwiązanie wzorcowe** i **materiały dla zdającego** (zrzut bazy `.sql`, obrazy).

Generator powstał na podstawie analizy 18 arkuszy z sesji styczeń i czerwiec 2026 (wnioski: [`docs/analiza-arkuszy.md`](docs/analiza-arkuszy.md)). Odtwarza ich strukturę, styl poleceń i zakres umiejętności, ale treść każdego arkusza jest nowa.

> Arkusze są materiałem ćwiczeniowym i są tak oznaczone. Nie są oficjalnymi arkuszami CKE.

## Uruchomienie

Aplikacja jest statyczna (HTML + moduły ES), nie ma backendu ani zależności.

```bash
npm start            # serwer na http://localhost:8080
# albo dowolny serwer plików, np.:
python3 -m http.server 8080
```

Plik `index.html` trzeba otworzyć przez serwer HTTP, bo moduły ES nie działają z `file://`. Aplikację można też wrzucić bez zmian na GitHub Pages.

## Co generuje

| Element | Opis |
|---|---|
| **Arkusz** (`arkusz.html`) | Strona tytułowa, treść zadania, schemat bazy, podgląd witryny, układ bloków, wymagania CSS, opis skryptów, tabele pomocy i lista plików. Format A4, numeracja „Strona X z Y”; drukuje się do PDF przez Ctrl+P. |
| **Baza danych** | Od 2 do 3 tabel z relacjami i realistycznymi polskimi danymi; zrzut SQL w stylu phpMyAdmin (`CREATE TABLE`, `INSERT`, klucze obce). |
| **Kwerendy** | 4–6 zapytań: selekcja z warunkami (`=`, `<`, `BETWEEN`, `LIKE`), sortowanie, `LIMIT`, `DISTINCT`, `RAND()`, funkcje agregujące z aliasami, `GROUP BY`, `JOIN`, `LEFT JOIN`, podzapytania `NOT IN`, `INSERT`, `UPDATE`, `DELETE`, `ALTER TABLE`, `CREATE USER` + `GRANT`. |
| **Witryna** | 5 układów bloków semantycznych (`header`, `nav`, `main`, `section`, `aside`, `footer`) i widżety treści (listy, tabele, formularze, obrazy, kontakt). |
| **Skrypty PHP** | Tabela z wynikami zapytania (opcjonalnie z kolumną wyliczaną), lista, galeria, statystyki, karty z losowymi rekordami, filtr przez przyciski opcji, lista rozwijana ze szczegółami i obliczeniem wartości, formularz `INSERT`, dwie strony połączone parametrem `GET`. |
| **Skrypty JS** | Kalkulator kosztu (radio/select, checkbox, rabat), suwak, bieżąca data, galeria miniatur, pokaż/ukryj, zmiana rozmiaru czcionki, walidacja formularza kontaktowego, wyszukiwarka w tablicy obiektów. |
| **CSS** | 10 palet (nazwy kolorów CSS i hex), 10 krojów pisma, reguły dla bloków, znaczników, klas i `:hover`, z adnotacją „wyłącznie selektor znacznika”. |
| **Grafika / animacja** | Przezroczyste tło, skalowanie z zachowaniem proporcji, kadrowanie, odbicie, obrót, odcienie szarości; animacja GIF z paska klatek. |
| **Klucz** (`klucz.html`) | Każda kwerenda z oczekiwanym wynikiem wyliczonym na danych z arkusza, kryteria oceniania (lista kontrolna dla 5 rezultatów) i pełne rozwiązanie wzorcowe. |

### Warianty

- **Baza danych + PHP** (styl styczniowy): skrypty połączenia z bazą korzystają z kwerend z arkusza.
- **Baza danych + JavaScript** (styl czerwcowy): kwerendy są niezależne, a witryna ma skrypty po stronie klienta.
- **Animacja + JavaScript**: zamiast operacji na bazie jest animacja GIF.

### Powtarzalność

Każdy arkusz ma **kod (seed)**. Ten sam kod z tymi samymi ustawieniami zawsze daje identyczny arkusz, bazę i klucz. Link z przycisku „Link” zapisuje wszystkie ustawienia w adresie (`#s=KOD&t=…`).

### Zestaw dla klasy

Panel „Zestaw dla klasy” tworzy ZIP z N różnymi arkuszami (kody `KOD-01`, `KOD-02`, …). Każdy arkusz ma swój klucz i swoje materiały.

## Struktura paczki ZIP

```
INF.03-07-26.06-SG_ABCD1234/
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
js/ui/app.js                 obsługa formularza, podglądy, eksport (canvas -> PNG/JPEG)
js/core/                     rdzeń - czyste moduły ES, działają w przeglądarce i w Node.js
  rng.js                     deterministyczny PRNG (mulberry32) z niezależnymi strumieniami
  themes.js, data.js         bank 12 tematów: tabele, role kolumn, słowniki danych
  db.js                      generowanie rekordów, zrzut SQL, diagram relacji (SVG)
  sql.js                     model zapytań: SQL, opis po polsku, wykonanie na danych
  queries.js                 wzorce zapytań dobierane do schematu tematu
  widgets.js                 widżety treści (HTML/PHP/JS + opis + podgląd)
  site.js                    układy bloków, rozmieszczanie widżetów, numeracja, strony
  css.js                     wymagania CSS + styl.css
  graphics.js                zadania z grafiki i animacji
  exam.js                    orkiestrator: model arkusza, rozwiązanie, kryteria
  sheet.js, key.js           renderowanie arkusza i klucza do HTML
  placeholders.js            obrazy zastępcze (SVG)
  zip.js, package.js         paczka ZIP bez zewnętrznych bibliotek
```

Każde zapytanie jest opisane strukturą (`spec`). Z tej samej struktury powstają tekst polecenia, kod SQL, kod PHP (z parametrem w miejscu wartości z formularza) i oczekiwany wynik. Dlatego treść arkusza, rozwiązanie i klucz zawsze są ze sobą zgodne.

### Rozszerzanie

- **Nowy temat**: dodaj obiekt w `js/core/themes.js`. Wystarczy opisać tabele i role kolumn (`name`, `cat`, `price`, `num`, `date`, `file`, `fk`, …). Wzorce zapytań i widżety dopasują się same.
- **Nowy widżet**: dodaj obiekt z metodami `plan` i `render` w `js/core/widgets.js` i dopisz go do puli w `site.js`.
- **Nowy wzorzec kwerendy**: dodaj funkcję w `PATTERNS` (`js/core/queries.js`).

## Testy

```bash
npm test                                   # testy jednostkowe (Node >= 18)
node tests/integration.mjs 100             # MariaDB/MySQL + PHP: import bazy, każda kwerenda, strony PHP (GET/POST)
NODE_PATH=$(npm root -g) node tests/browser.mjs 30   # Playwright: działanie skryptów JS
```

Test integracyjny importuje wygenerowany zrzut do prawdziwej bazy. Potem wykonuje każdą kwerendę i porównuje wynik z kluczem. Rozwiązanie PHP uruchamia przez `php -S` i wysyła formularze. Test przeglądarkowy klika, wpisuje i sprawdza efekt każdego skryptu JS.
