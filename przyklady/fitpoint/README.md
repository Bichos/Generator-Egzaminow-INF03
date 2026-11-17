# FitPoint – arkusz w stylu INF.03

Autorski arkusz (bez karty ćwiczeń jako wzoru): siłownia z grafikiem zajęć, zapisami przez formularz
i kalkulatorem BMI. Uzupełnia poprzednie przykłady o obsługę formularzy w PHP (`$_GET`, `$_POST`, `isset`),
`INSERT`/`UPDATE` wysyłane ze strony, tabelę HTML oraz `grid-template-areas`.

| Plik | Zawartość |
|---|---|
| `arkusz.html` / `arkusz.pdf` | arkusz dla zdającego (9 stron, kod INF.03-FP-SG) |
| `klucz.html` / `klucz.pdf` | zasady oceniania R.1–R.5 (58 kryteriów) i rozwiązanie wzorcowe |
| `dla_zdajacego/fitpoint.sql` | tabele `trenerzy`, `zajecia`, `zapisy` – do spakowania w archiwum 7z `fitpoint`, hasło `F1tP0int!` |
| `rozwiazanie/` | `index.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, `podglad.html` (GET, baza po zapytaniach 4 i 5), `podglad_zapis.html` (po wysłaniu formularza) |
| `zbuduj.mjs` | generuje `arkusz.html` i `klucz.html` (wspólne elementy w `przyklady/wspolne.mjs`) |

Przebudowa: `node przyklady/fitpoint/zbuduj.mjs`, PDF – drukowanie HTML do A4 z tłem.

Skrypty: 1 – grafik wybranego dnia (formularz GET, domyślnie Poniedziałek, „brak miejsc” w klasie `pelne`),
2 – lista zajęć z wolnymi miejscami w formularzu zapisu, 3 – obsługa formularza POST (INSERT do `zapisy`,
UPDATE miejsc, komunikat; na początku pliku), 4 – karty trenerów z liczbą zajęć (GROUP BY),
5 (JS) – kalkulator BMI z progami 18,5 i 25.

Uwaga dla sprawdzającego: zapytania 4 i 5 zmieniają dane – na ilustracji 2 Trening obwodowy ma 3 wolne
miejsca (stan po ich wykonaniu); każde wysłanie formularza zmniejsza tę liczbę o kolejne 1.
