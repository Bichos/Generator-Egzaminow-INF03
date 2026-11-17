# Bazarek – arkusz w stylu INF.03

Karta ćwiczeń „Bazarek” (HTML + CSS, sklep z telefonami) przerobiona na arkusz egzaminacyjny:
baza danych z dwiema tabelami połączonymi relacją, pięć zapytań, trzy skrypty PHP i jeden skrypt JavaScript (koszyk).

| Plik | Zawartość |
|---|---|
| `arkusz.html` / `arkusz.pdf` | arkusz dla zdającego (9 stron, kod INF.03-BZ-SG) |
| `klucz.html` / `klucz.pdf` | zasady oceniania R.1–R.5 (60 kryteriów) i rozwiązanie wzorcowe |
| `dla_zdajacego/bazarek.sql` | tabele `producenci` i `oferty` – do spakowania w archiwum 7z `bazarek`, hasło `B@zarek#26` |
| `rozwiazanie/` | `index.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, `podglad.html` (wynik działania `index.php`) |
| `zbuduj.mjs` | generuje `arkusz.html` i `klucz.html` (wspólne elementy w `przyklady/wspolne.mjs`) |

Przebudowa: `node przyklady/bazarek/zbuduj.mjs`, PDF – drukowanie HTML do A4 z tłem.

Sprawdzenie rozwiązania (XAMPP lub MariaDB + PHP): utworzyć bazę `bazarek` (utf8mb4_polish_ci), zaimportować
`bazarek.sql`, uruchomić `index.php`. Oczekiwane: 6 producentów w filtrach, „Znaleziono 8 ofert”, 8 kart (4 kolumny
przy 1280 px), plakietka „Okazja” na 3 kartach, „Smart!” na 3 kartach; kliknięcie „Dodaj do koszyka” zmienia
„Koszyk (2)” na „Koszyk (3)” i wyłącza przycisk.
