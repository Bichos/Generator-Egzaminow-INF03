# Znajomi – arkusz w stylu INF.03

Karta ćwiczeń „Serwis społecznościowy” (HTML + CSS) przerobiona na arkusz egzaminacyjny:
baza danych z dwiema tabelami połączonymi relacją, pięć zapytań (CONCAT + LEFT na inicjały, DATE_FORMAT,
DAY/MONTH, COUNT), trzy skrypty PHP i jeden skrypt JavaScript („Lubię to”).

| Plik | Zawartość |
|---|---|
| `arkusz.html` / `arkusz.pdf` | arkusz dla zdającego (10 stron, kod INF.03-ZN-SG) |
| `klucz.html` / `klucz.pdf` | zasady oceniania R.1–R.5 (66 kryteriów) i rozwiązanie wzorcowe |
| `dla_zdajacego/znajomi.sql` | tabele `uzytkownicy` i `posty` – do spakowania w archiwum 7z `znajomi`, hasło `Zn@jomi!2026` |
| `rozwiazanie/` | `index.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, `podglad.html` (wynik działania `index.php`) |
| `zbuduj.mjs` | generuje `arkusz.html` i `klucz.html` (wspólne elementy w `przyklady/wspolne.mjs`) |

Przebudowa: `node przyklady/znajomi/zbuduj.mjs`, PDF – drukowanie HTML do A4 z tłem.

Zmiany względem karty ćwiczeń: gradienty relacji i obrazów postów ustawiane klasami (`r1`–`r3`, `g1`–`g2`)
zamiast atrybutu `style` (na egzaminie style w atrybutach są niedozwolone); posty, zaproszenia i kontakty
pochodzą z bazy; sekcja komentarzy pod pierwszym postem została pominięta; na końcu bloku `main` dodano
stopkę „Stronę wykonał: ”.
