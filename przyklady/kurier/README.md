# Kurier24 – arkusz w stylu INF.03

Karta ćwiczeń „Portal informacyjny” (HTML + CSS) przerobiona na arkusz egzaminacyjny:
baza danych z dwiema tabelami połączonymi relacją, pięć zapytań (w tym DATE_FORMAT, LIMIT, GROUP BY i UPDATE),
trzy skrypty PHP i jeden skrypt JavaScript (newsletter).

| Plik | Zawartość |
|---|---|
| `arkusz.html` / `arkusz.pdf` | arkusz dla zdającego (11 stron, kod INF.03-KU-SG) |
| `klucz.html` / `klucz.pdf` | zasady oceniania R.1–R.5 (70 kryteriów) i rozwiązanie wzorcowe |
| `dla_zdajacego/kurier.sql` | tabele `kategorie` i `artykuly` – do spakowania w archiwum 7z `kurier`, hasło `Kur!er24#News` |
| `rozwiazanie/` | `index.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, `podglad.html` (wynik działania `index.php`) |
| `zbuduj.mjs` | generuje `arkusz.html` i `klucz.html` (wspólne elementy w `przyklady/wspolne.mjs`) |

Przebudowa: `node przyklady/kurier/zbuduj.mjs`, PDF – drukowanie HTML do A4 z tłem.

Co generuje PHP: lista „Najnowsze” (6 pozycji, skrypt 1), karty działu Biznes z klasami o1–o3 (skrypt 2),
„Najczęściej czytane” z klasą `top` dla trzech pierwszych (skrypt 3). Sekcja Sport i sekcja główna są statyczne.
JavaScript: „Zapisz się” sprawdza znak @ i wyświetla komunikat z klasą `sukces` lub `blad`.
Zapytanie 5 (UPDATE wyświetleń artykułu 3) nie zmienia kolejności „Najczęściej czytanych”.
