# Przychodnia Pod Lipami – arkusz w stylu INF.03

Autorski arkusz: przychodnia z listą lekarzy (filtr specjalizacji) i rejestracją na wizytę.
Sprawdza: `DISTINCT`, `GROUP_CONCAT` z `ORDER BY` i `SEPARATOR`, `HAVING`, `BETWEEN`, `LIKE`, `UPDATE` wielu wierszy,
w PHP – warunek dokładany do zapytania, `mysqli_num_rows`, `date`/`strtotime`, INSERT z formularza POST,
w JS – walidację przed wysłaniem (`onsubmit="return …"`, `checked`, `isNaN`), w HTML/CSS – obraz z pliku,
liczniki CSS (`counter-reset`, `counter-increment`, `counter()`), `:last-child`, `@media print`.

| Plik | Zawartość |
|---|---|
| `arkusz.html` / `arkusz.pdf` | arkusz dla zdającego (8 stron, kod INF.03-PM-SG) |
| `klucz.html` / `klucz.pdf` | zasady oceniania R.1–R.5 (56 kryteriów) i rozwiązanie wzorcowe |
| `dla_zdajacego/` | `przychodnia.sql` (tabele `lekarze`, `dyzury`, `wizyty`) i `logo.png` – do spakowania w archiwum 7z `przychodnia`, hasło `L1pa+Zdrowie` |
| `rozwiazanie/` | `index.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, `logo.png`, podglądy: `podglad.html`, `podglad_zapis.html` (po wysłaniu formularza), `podglad_okulista.html` (filtr bez wyników) |
| `zbuduj.mjs` | generuje `arkusz.html` i `klucz.html` (wspólne elementy w `przyklady/wspolne.mjs`) |

Przebudowa: `node przyklady/przychodnia/zbuduj.mjs`. PDF drukować przeglądarką z polskim językiem interfejsu
(pole daty na ilustracjach ma wtedy format DD.MM.RRRR). W podglądach ekranowych blok `@media print` jest wyłączony,
a ilustracja 6 pokazuje go wymuszonego.

Pułapki w danych: okulistka nie ma dyżurów (znika przy `JOIN`, filtr pokazuje komunikat o braku lekarzy),
Kwiatkowski ma 2 wizyty, ale tylko 1 w tygodniu 23–27.11 (`BETWEEN` + `HAVING`), jedna z trzech wizyt z 23.11 jest już
potwierdzona (zapytanie 5 zmienia 2 wiersze).
