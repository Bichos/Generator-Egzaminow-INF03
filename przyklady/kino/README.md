# Kino Orbita – arkusz w stylu INF.03

Autorski arkusz: repertuar kina z liczbą wolnych miejsc i wyborem miejsc na planie sali.
Sprawdza: parametr w adresie (`index.php?seans=2`, `$_GET`, `isset`), zapytanie wykonywane w pętli dla każdego
filmu, `LEFT JOIN` + `COUNT` (seanse bez rezerwacji), generowanie planu sali dwiema pętlami z `in_array`,
w JS: `querySelectorAll`, `classList.toggle`, tablice i `join`, `toFixed`.

| Plik | Zawartość |
|---|---|
| `arkusz.html` / `arkusz.pdf` | arkusz dla zdającego (8 stron, kod INF.03-KI-SG) |
| `klucz.html` / `klucz.pdf` | zasady oceniania R.1–R.5 (55 kryteriów) i rozwiązanie wzorcowe |
| `dla_zdajacego/kino.sql` | tabele `filmy`, `seanse`, `rezerwacje` – do spakowania w archiwum 7z `kino`, hasło `Orb1ta#Kino` |
| `rozwiazanie/` | `index.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, `podglad.html` (`?seans=2`, baza po zapytaniu 5), `podglad_start.html` (bez parametru) |
| `zbuduj.mjs` | generuje `arkusz.html` i `klucz.html` (wspólne elementy w `przyklady/wspolne.mjs`) |

Przebudowa: `node przyklady/kino/zbuduj.mjs`, PDF – drukowanie HTML do A4 z tłem.

Dane dobrano tak, żeby wystąpiły wszystkie przypadki: seans bez rezerwacji (12:00, 40 wolnych – sprawdza LEFT JOIN),
prawie pełny (21:00, 4 wolne – klasa `ostatnie`), pełny (18:45 – `brak miejsc`, bez odnośnika).
Zapytanie 5 dodaje rezerwację E8 na seans 2 (po nim 27 wolnych, 13 zajętych miejsc na planie).
