# Biblioteka szkolna – arkusz projektowy (pełny CRUD)

Rozszerzone zadanie projektowe na **2 × 150 minut**: wielostronicowa aplikacja PHP + MySQL z pełną obsługą danych
(Create, Read, Update, Delete) i rejestrem wypożyczeń. Arkusz podzielony na 8 etapów, klucz na 8 rezultatów.

| Plik | Zawartość |
|---|---|
| `arkusz.html` / `arkusz.pdf` | arkusz projektowy (9 stron, kod INF.03-BS-PR) |
| `klucz.html` / `klucz.pdf` | zasady oceniania R.1–R.8 (61 kryteriów) i pełny kod rozwiązania |
| `dla_zdajacego/biblioteka.sql` | tabele `kategorie`, `ksiazki`, `czytelnicy`, `wypozyczenia` – archiwum 7z `biblioteka`, hasło `Ks1azki!CRUD` |
| `rozwiazanie/` | `polaczenie.php`, `menu.php`, `index.php`, `dodaj.php`, `edytuj.php`, `usun.php`, `wypozyczenia.php`, `styl.css`, `skrypt.js`, `kwerendy.txt`, podglądy `podglad*.html` |
| `zbuduj.mjs` | generuje `arkusz.html` i `klucz.html` |

Przebudowa: `node przyklady/biblioteka/zbuduj.mjs`. PDF drukować przeglądarką z polskim językiem interfejsu.

## Zakres

- **Etap 1 – SQL:** JOIN, `LEFT JOIN` z warunkiem w `ON` (dostępność egzemplarzy), `DATEDIFF` na trzech tabelach,
  oraz `INSERT` → `UPDATE` → `DELETE` na tym samym rekordzie (baza wraca do stanu wyjściowego).
- **Etap 2 – struktura:** `require_once 'polaczenie.php'`, `include 'menu.php'` z wyróżnieniem bieżącej strony,
  `htmlspecialchars`, `(int)`, `mysqli_real_escape_string`.
- **Etap 3 – Read:** wyszukiwarka (LIKE po tytule lub autorze) + filtr kategorii, zachowanie wartości formularza,
  komunikaty po przekierowaniu.
- **Etap 4 – Create/Update:** walidacja w PHP z listą błędów i ponownym wypełnieniem formularza,
  wzorzec POST → przekierowanie → GET (`header('Location: …')`), formularz edycji wypełniony z bazy.
- **Etap 5 – Delete:** strona potwierdzenia, usuwanie tylko metodą POST, blokada przy niezwróconych egzemplarzach,
  usuwanie historii przed rekordem (klucz obcy).
- **Etap 6 – wypożyczenia:** INSERT z `CURDATE()`, zwrot przez UPDATE, `HAVING` w liście dostępnych książek,
  wyróżnienie przetrzymanych (ponad 14 dni).
- **Etap 7 – JS:** walidacja sumy kontrolnej ISBN-13 (`onsubmit="return …"`), `confirm` przy zwrocie.
- **Etap 8 – CSS:** wspólny arkusz dla wszystkich stron, stopka przyklejona do dołu (flex + `min-height: 100vh`),
  układ mobilny (ukrywanie kolumn przez `:nth-child`).

Sprawdzone automatycznie (Playwright na MariaDB + PHP): wyszukiwanie i filtr, XSS i apostrof w wyszukiwarce,
błędy walidacji PHP, odrzucenie złej cyfry kontrolnej ISBN, dodanie → edycja → usunięcie, brak usunięcia przez GET,
blokada usuwania wypożyczonej książki, wypożyczenie, anulowany i potwierdzony zwrot, usunięcie książki z historią.
