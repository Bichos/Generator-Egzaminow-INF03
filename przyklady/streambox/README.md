# StreamBox – arkusz w stylu INF.03

Karta ćwiczeń „StreamBox” (przepisywanie kodu HTML/CSS strony w stylu serwisu VOD) przerobiona na arkusz w formie zadania egzaminacyjnego INF.03.

| Plik | Zawartość |
|---|---|
| `arkusz.html`, `arkusz.pdf` | arkusz dla ucznia: strona tytułowa, baza danych i 5 kwerend, grafika logo, witryna (podgląd desktop i mobile, układ bloków), wymagania CSS, skrypty PHP i JS, tabele pomocy |
| `klucz.html`, `klucz.pdf` | zasady oceniania R.1–R.5 (46 kryteriów po 1 pkt) i rozwiązanie wzorcowe |
| `dla_zdajacego/streambox.sql` | baza do spakowania w archiwum 7z (hasło w arkuszu) |
| `rozwiazanie/` | `index.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, `logo.png`; `podglad.html` to wynik działania `index.php` z bazą |
| `zbuduj.mjs` | odtwarza `arkusz.html` i `klucz.html` (`node przyklady/streambox/zbuduj.mjs`) |

## Co zmieniło się względem karty ćwiczeń

- **Wymagania zamiast kodu:** uczeń nie przepisuje kodu, tylko realizuje wymagania opisane słowami: treść bloków i reguły CSS z wartościami.
- **Baza danych:** dane strony (baner i rzędy kafelków) pochodzą z bazy `streambox`, a do wykonania jest 5 kwerend (`ORDER BY` + `LIMIT`, `WHERE`, `JOIN` + `GROUP BY`, `CREATE USER` + `GRANT`).
- **Skrypty PHP:**
  - skrypt 1 buduje baner;
  - skrypt 2 buduje rzędy: pętla po kategoriach, w środku zapytanie o produkcje danej kategorii.
- **Skrypt JS:** przycisk „ⓘ Więcej informacji” pokazuje i ukrywa opis.
- **Grafika:** logo `logo.png` z napisem STREAMBOX, przezroczyste tło, wysokość 40 px.
- **Pytania kontrolne i własne przeróbki:** zastępują je zasady oceniania. Pytania z karty można zadać ustnie przy omawianiu.
