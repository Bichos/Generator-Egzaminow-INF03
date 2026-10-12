# Analiza arkuszy INF.03 (sesje styczeń i czerwiec 2026)

Przeanalizowano 21 plików PDF. Trzy z nich to duplikaty zadania 01‑10, więc unikalnych arkuszy jest 18: zadania 01–12 z sesji styczniowej i 07–12 z sesji czerwcowej. Wszystkie mają wersję SG, czas 150 minut i podstawę programową 2019.

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
