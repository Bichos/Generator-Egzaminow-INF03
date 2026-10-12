# Analiza arkuszy INF.03 i kwalifikacji poprzedzających

Generator opiera się na dwóch źródłach:

1. **18 arkuszy INF.03 z 2026 roku** (archiwum przesłane przez użytkownika); szczegóły w sekcji „Sesja 2026”.
2. **152 egzaminy z lat 2018–2026** z repozytorium [Chr1skyy/Egzamin-Zawodowy-E14-EE09-INF03](https://github.com/Chr1skyy/Egzamin-Zawodowy-E14-EE09-INF03): E.14 (32), EE.09 (40) i INF.03 (80). Każdy egzamin ma arkusz i **zasady oceniania**; szczegóły w sekcji „Korpus 2018–2026”.

E.14 i EE.09 to poprzednie wersje tej samej kwalifikacji, więc mają te same rezultaty i ten sam typ zadań.

## Korpus 2018–2026 (152 egzaminy)

### Rodzaj skryptów

| Kwalifikacja / rok | PHP | JS | PHP + JS | z bazą danych |
|---|---|---|---|---|
| E.14 2018–2020 | 19 | 12 | 1 | 15 z 32 |
| EE.09 2019–2023 | 26 | 12 | 2 | 40 z 40 |
| INF.03 2021–2023 | 12 | 2 | – | 14 z 14 |
| INF.03 2024–2026 | 39 | 26 | 1 | 63 z 66 |

W INF.03 baza danych jest prawie zawsze. Zadanie bez bazy (np. z animacją) to rzadkość.

### Kwerendy (550 przykładowych instrukcji SQL z zasad oceniania)

| Instrukcja | Liczba | | Element SELECT | Liczba |
|---|---|---|---|---|
| SELECT | 405 | | WHERE | 308 |
| ALTER TABLE (ADD, DROP COLUMN, ADD … AFTER, PRIMARY/FOREIGN KEY) | 32 | | JOIN (w tym przez WHERE i USING) | 133 |
| UPDATE (SET stała, SET kolumna ± wartość) | 30 | | ORDER BY | 50 |
| INSERT INTO | 29 | | AND / OR | 46 / 13 |
| CREATE USER | 23 | | COUNT / GROUP BY | 39 / 35 |
| GRANT (tabela lub baza.*) | 11 | | LIKE | 29 |
| CREATE TABLE | 9 | | alias AS | 26 |
| DELETE FROM | 8 | | AVG / MAX / MIN / SUM | 22 / 10 / 8 / 7 |
| DROP TABLE | 3 | | LIMIT | 21 |
| | | | DISTINCT, RAND(), ROUND, BETWEEN, podzapytanie, LEFT JOIN, HAVING | 9, 6, 5, 3, 3, 3, 1 |

Na tej podstawie ustalono wagi wzorców kwerend (`WEIGHTS` w `js/core/queries.js`). Dodano też brakujące wzorce: warunki OR i AND, `UPDATE … SET kolumna = stała`, `ALTER TABLE … ADD … AFTER`, `ALTER TABLE … DROP COLUMN`, `CREATE TABLE`, `DROP TABLE` oraz osobne `CREATE USER` i `GRANT`.

### Zasady oceniania (80 egzaminów INF.03)

- Każde kryterium oznacza się R.x.y i ocenia zero-jedynkowo.
- Średnio jest 38,8 kryterium (od 33 do 45). Na rezultaty przypada średnio: R.1 6,2, R.2 9,2, R.3 5,0, R.4 10,2, R.5 8,2.
- Kryterium kwerendy brzmi: „Wykonane zapytanie N … W pliku z kwerendami lub na zrzucie istnieje zapis np. `SQL` oraz wynik działania udokumentowany zrzutem, na którym widoczne są dokładnie K wierszy …”.
- Rezultaty zaczynają się od stałych uwag: o kompletnych zrzutach ekranu, o tolerancji drobnych literówek, o sprawdzaniu CSS w inspektorze i o selektorach znaczników.

Generator tworzy klucz w tym samym formacie (`js/core/grading.js`).

### Elementy witryny i skrypty

- **HTML** (liczba arkuszy): tabela 148, obraz z tekstem alternatywnym 143, formularz 111, pole liczbowe 92, lista numerowana 83, lista punktowana 54, checkbox 51, radio 51, textarea 48, etykiety 25, suwak 24, odnośnik w nowej karcie 20, lista rozwijana 17, audio/wideo 9, scalone komórki 8.
- **CSS**: szerokość 150, kolor tła 148, wysokość 143, kolor czcionki, krój i wyrównanie po 137, padding 125, margin 101, obramowanie 93, rozmiar czcionki 70, `:hover` 55, paski przewijania 38, zaokrąglenie 31, cień 26.
- **Grafika**: kadrowanie 137, skalowanie 101, przezroczystość 57, obrót lub odbicie 17, animacja GIF 11, skala szarości 8.
- **Typowe skrypty JS, dodane do generatora**: zakładki (pokaż jedną, ukryj resztę), pokaz zdjęć z przyciskami poprzednie/następne i zawijaniem, lista zadań (dodawanie i przekreślanie), licznik odwiedzin w localStorage, podsumowanie formularza (wielkie i małe litery, wartość z listy), zmiana koloru i rozmiaru tekstu przyciskami.
- **Typowe skrypty PHP, dodane do generatora**: wyszukiwanie po początku nazwy (`LIKE 'x%'` z formularza), aktualizacja rekordu z formularza (`UPDATE`), lista według wzoru zdania, blok `section` dla każdego rekordu z warunkiem (np. wyróżnienie, gdy wartość przekracza próg).
- **Tematy**: od restauracji, hurtowni, biur podróży i wędkarzy (E.14/EE.09) po sklepy, salony usługowe, kalendarze, galerie i portale tematyczne (INF.03). Do generatora dodano 6 tematów z tej puli: wędkarstwo, prognoza pogody, salon fryzjerski, piekarnia, sklep z oponami, koło szachowe.

### „Smaczki” – rzadsze elementy z arkuszy INF.03 i EE.09

Liczba arkuszy, w których występuje dany element. Elementy oznaczone ✓ są w generatorze.

| Element | Liczba | | Element | Liczba |
|---|---|---|---|---|
| zaokrąglanie wyników (`toFixed`) ✓ | 38 | | lista definicji `dl/dt/dd` ✓ | 6 |
| zdarzenia myszy (`onmouseover`) ✓ | 31 | | losowanie (`Math.random`) ✓ | 6 |
| tworzenie elementów DOM ✓ | 21 | | data i dzień tygodnia w PHP ✓ | 6 |
| przezroczystość (`opacity`) ✓ | 20 | | filtry CSS (`filter`) ✓ | 5 |
| podpowiedź `title` / `placeholder` ✓ | 13 | | `::first-letter` / `::first-line` ✓ | 5 |
| `transform` (skalowanie elementu) ✓ | 10 | | gradient ✓ | 5 |
| mapa / `iframe` | 9 | | cień tekstu ✓ | 4 |
| linia pozioma `hr` ✓ | 8 | | `:active`, `:visited`, `:focus` ✓ | 3, 3, 2 |
| scalone komórki tabeli ✓ | 6 | | `nth-child` (parzyste wiersze) ✓ | 2 |
| | | | `@media` (ekrany do 800 px) ✓ | 1 |

Flexbox i grid nie występują w treści arkuszy: układ wynika z ilustracji i zwykle realizuje się go przez float. W generatorze są dostępne jako opcja i wtedy pojawiają się w wymaganiach CSS jawnie (`display: flex` / `display: grid` z kolumnami).

## Sesja 2026 (18 arkuszy z archiwum)

Archiwum zawierało 21 plików PDF. Trzy z nich to duplikaty zadania 01‑10, więc unikalnych arkuszy jest 18: zadania 01–12 z sesji styczniowej i 07–12 z sesji czerwcowej. Wszystkie mają wersję SG, czas 150 minut i podstawę programową 2019.

## Wspólna struktura arkusza

1. **Strona tytułowa**: nazwa i symbol kwalifikacji, numer zadania, wersja, pola na PESEL, kod `INF.03-NN-RR.MM-SG`, instrukcja dla zdającego.
2. **Wstęp**: „Wykonaj aplikację internetową …, wykorzystując …”, archiwum 7z z hasłem, folder nazwany numerem zdającego.
3. **Operacje na bazie danych**: utworzenie bazy (utf8_polish_ci), import pliku `.sql`, zrzut `import`, 4–5 kwerend zapisanych w `kwerendy.txt` ze zrzutami `kw1…kwN`.
4. *(opcjonalnie)* **Grafika / Animacja**: skalowanie, kadrowanie, przezroczystość, obrót; animacja GIF z klatek.
5. **Witryna internetowa**: ilustracja wyglądu, ilustracja układu bloków, cechy (HTML5, `lang`, kodowanie, tytuł, `styl.css`, bloki semantyczne) i zawartość każdego bloku.
6. **Styl CSS**: lista reguł z adnotacją „styl … należy zdefiniować wyłącznie przy pomocy selektora tego znacznika”.
7. **Skrypty**: wymagania wspólne (PHP i połączenie `localhost/root`, albo JS), potem opis Skryptu 1…N.
8. **Tabele pomocy**: funkcje `mysqli`, model DOM, znaczniki semantyczne, czasem właściwości CSS.
9. **Zakończenie**: `przeglądarka.txt`, lista plików na płycie i **5 ocenianych rezultatów**.

## Arkusze (temat, wariant, kwerendy)

| Zadanie | Temat | Wariant | Typy kwerend |
|---|---|---|---|
| 01‑01 | konfigurator samochodów | PHP | LIMIT + WHERE + ORDER; AVG/MAX z aliasami; JOIN; ORDER BY RAND() |
| 01‑02 | bazar warzywny | PHP + grafika | LIMIT; SELECT id, nazwa; WHERE id; INSERT |
| 01‑03 | pola figur | animacja + JS | (brak bazy) |
| 01‑04 | matura | PHP, 2 strony (GET) | WHERE + ORDER; DISTINCT; MIN/MAX; GROUP BY + AVG + LIMIT 1; JOIN |
| 01‑05 | zgłoszenia wypadków | PHP | WHERE; GROUP BY + COUNT; NOT IN; INSERT z CURDATE() |
| 01‑06 | diagnostyka chorób | PHP + grafika | WHERE + ORDER; SELECT id, nazwa; JOIN; JOIN + COUNT + GROUP BY |
| 01‑07 | stacja meteo | PHP + grafika | AVG; INSERT; JOIN; JOIN + GROUP BY |
| 01‑08 | korona gór | PHP, 2 strony | ORDER DESC; LIMIT; JOIN; LIKE |
| 01‑09 | stylizacja paznokci | PHP + grafika | WHERE; WHERE data; JOIN; ALTER TABLE ADD |
| 01‑10 | blog kulinarny | PHP + grafika | WHERE id; JOIN; JOIN; WHERE id |
| 01‑11 | kino | PHP, 2 strony | WHERE + ORDER; WHERE id; ORDER BY 2 pola; JOIN; GROUP BY + COUNT |
| 01‑12 | studio tatuażu | PHP + grafika | WHERE; GROUP BY + COUNT; JOIN; UPDATE +10% |
| 06‑07 | kółko i krzyżyk | JS | WHERE; AVG; podzapytanie MAX; LIKE |
| 06‑08 | wypożyczalnia gier | JS, 2 strony | BETWEEN; GROUP BY + COUNT; JOIN; ALTER TABLE ADD NOT NULL |
| 06‑09 | restauracja | JS | ORDER; COUNT; JOIN + data; CREATE USER; ALTER MODIFY |
| 06‑10 | laboratorium | PHP + sesje | ORDER; GROUP BY data; JOIN; LEFT JOIN |
| 06‑11 | atlas drzew | JS | WHERE + AVG; JOIN; GROUP BY + COUNT; JOIN |
| 06‑12 | salon rowerowy | JS | WHERE; MIN/AVG/MAX + GROUP BY; LIKE; UPDATE −25% |

## Wnioski zastosowane w generatorze

- **Zestaw kwerend** prawie zawsze łączy selekcję z warunkiem i sortowaniem, funkcję agregującą (często z aliasem i `GROUP BY`), relację (`JOIN`) i jedną modyfikację danych lub struktury (`INSERT`, `UPDATE`, `ALTER`, `CREATE USER`). Generator dobiera kwerendy według tych grup (`pickStandalone` w `queries.js`).
- **Sesja styczniowa**: skrypty PHP używają kwerend z arkusza, czasem „zmodyfikowanych” (wartość z formularza lub `GET` zamiast stałej). Generator trzyma parametr w strukturze zapytania, więc ta sama struktura daje opis, kod PHP i wynik.
- **Sesja czerwcowa**: kwerendy są niezależne od witryny, a skrypty działają w JS (kalkulatory, suwak, data, wyszukiwanie w tablicy obiektów).
- **Układy bloków**: nagłówek, opcjonalna nawigacja, blok główny z 2–3 blokami obok siebie, stopka; szerokości w %, wspólna wysokość w px.
- **CSS**: nazwy kolorów CSS (DarkGreen, Maroon, Navy…) lub kody hex, krój czcionki z zapasowym, wspólne reguły nagłówka i stopki, reguły dla znaczników z adnotacją „wyłącznie selektor znacznika”, jedna pseudoklasa `:hover`, czasem klasa z cieniem i zaokrągleniem.
- **Zawsze 5 rezultatów**: baza (albo animacja), zawartość, działanie, styl CSS, skrypt(y).
