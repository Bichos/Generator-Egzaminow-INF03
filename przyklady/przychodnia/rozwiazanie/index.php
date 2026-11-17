<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'przychodnia');

// skrypt 4 - zapis wizyty
$komunikat = '';
if (isset($_POST['lekarz'])) {
    $lekarz = $_POST['lekarz'];
    $pacjent = $_POST['pacjent'];
    $telefon = $_POST['telefon'];
    $data = $_POST['data'];
    mysqli_query($polaczenie, "INSERT INTO wizyty (lekarze_id, pacjent, telefon, data, potwierdzona) VALUES ($lekarz, '$pacjent', '$telefon', '$data', 0);");
    $wynik = mysqli_query($polaczenie, "SELECT imie, nazwisko FROM lekarze WHERE id = $lekarz;");
    $dane = mysqli_fetch_row($wynik);
    $komunikat = "Zarejestrowano wizytę u lek. $dane[0] $dane[1] w dniu " . date('d.m.Y', strtotime($data)) . ". Potwierdzimy ją telefonicznie.";
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Przychodnia Pod Lipami</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
    <header class="naglowek">
        <img src="logo.png" alt="Logo przychodni Pod Lipami">
        <div>
            <h1>Przychodnia Pod Lipami</h1>
            <p>Rejestracja: 85 123 45 67 · pon.–pt. 8:00–19:00</p>
        </div>
    </header>

    <nav class="menu">
        <a href="#lekarze">Lekarze</a>
        <a href="#rejestracja">Rejestracja</a>
        <a href="#porady">Przed wizytą</a>
    </nav>

    <main class="uklad">
        <section class="lekarze" id="lekarze">
            <h2>Nasi lekarze</h2>
            <form class="filtr" action="index.php" method="get">
                <label for="specjalizacja">Specjalizacja</label>
                <select name="specjalizacja" id="specjalizacja">
                    <option value="">wszystkie</option>
<?php
// skrypt 1 - specjalizacje
$zapytanie = "SELECT DISTINCT specjalizacja FROM lekarze ORDER BY specjalizacja;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<option>$wiersz[0]</option>";
}
?>
                </select>
                <button type="submit">Filtruj</button>
            </form>
            <div class="karty">
<?php
// skrypt 2 - lekarze z dyżurami
$warunek = '';
if (isset($_GET['specjalizacja']) && $_GET['specjalizacja'] != '') {
    $specjalizacja = $_GET['specjalizacja'];
    $warunek = "WHERE specjalizacja = '$specjalizacja'";
}
$zapytanie = "SELECT imie, nazwisko, specjalizacja, gabinet, GROUP_CONCAT(CONCAT(dzien, ' ', godziny) ORDER BY dzien_nr SEPARATOR ', ') AS dyzury FROM lekarze JOIN dyzury ON dyzury.lekarze_id = lekarze.id $warunek GROUP BY lekarze.id ORDER BY nazwisko;";
$wynik = mysqli_query($polaczenie, $zapytanie);
if (mysqli_num_rows($wynik) == 0) {
    echo "<p class='brak'>Brak lekarzy przyjmujących w tej specjalizacji.</p>";
}
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<article class='lekarz'>";
    echo "<h3>lek. $wiersz[0] $wiersz[1]</h3>";
    echo "<p class='specjalizacja'>$wiersz[2]</p>";
    echo "<p>Gabinet nr $wiersz[3]</p>";
    echo "<p class='dyzury'>$wiersz[4]</p>";
    echo "</article>";
}
?>
            </div>
        </section>

        <aside class="boczna">
            <section class="rejestracja" id="rejestracja">
                <h2>Rejestracja na wizytę</h2>
<?php
if ($komunikat != '') {
    echo "<p class='potwierdzenie'>$komunikat</p>";
}
?>
                <form action="index.php" method="post" onsubmit="return sprawdzFormularz()">
                    <label for="lekarz">Lekarz</label>
                    <select name="lekarz" id="lekarz">
<?php
// skrypt 3 - lista lekarzy
$zapytanie = "SELECT id, imie, nazwisko, specjalizacja FROM lekarze ORDER BY nazwisko;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<option value='$wiersz[0]'>$wiersz[2] $wiersz[1] ($wiersz[3])</option>";
}
?>
                    </select>
                    <label for="pacjent">Imię i nazwisko</label>
                    <input type="text" name="pacjent" id="pacjent">
                    <label for="telefon">Telefon (9 cyfr)</label>
                    <input type="text" name="telefon" id="telefon">
                    <label for="data">Data wizyty</label>
                    <input type="date" name="data" id="data" required>
                    <label class="zgoda"><input type="checkbox" id="zgoda"> Wyrażam zgodę na przetwarzanie danych osobowych</label>
                    <p id="bledy"></p>
                    <button type="submit">Zarejestruj</button>
                </form>
            </section>

            <section class="porady" id="porady">
                <h2>Przed wizytą</h2>
                <ol class="kroki">
                    <li>Przyjdź 10 minut przed godziną wizyty.</li>
                    <li>Weź dokument tożsamości.</li>
                    <li>Przygotuj listę przyjmowanych leków.</li>
                    <li>Zabierz wyniki wcześniejszych badań.</li>
                </ol>
            </section>
        </aside>
    </main>

    <footer class="stopka">
        <p>Przychodnia Pod Lipami, ul. Lipowa 4 · W nagłych przypadkach dzwoń pod numer 112</p>
        <p>Stronę wykonał: 00</p>
    </footer>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
