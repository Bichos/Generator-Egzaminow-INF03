<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'fitpoint');

// skrypt 3 - obsługa formularza zapisu
$komunikat = '';
if (isset($_POST['zajecia'])) {
    $zajecia = $_POST['zajecia'];
    $imie = $_POST['imie'];
    $email = $_POST['email'];
    mysqli_query($polaczenie, "INSERT INTO zapisy (zajecia_id, imie, email, data_zapisu) VALUES ($zajecia, '$imie', '$email', NOW());");
    mysqli_query($polaczenie, "UPDATE zajecia SET miejsca = miejsca - 1 WHERE id = $zajecia;");
    $komunikat = "Dziękujemy, $imie! Zapis został przyjęty.";
}

// wybrany dzień grafiku
$dzien = 'Poniedziałek';
if (isset($_GET['dzien'])) {
    $dzien = $_GET['dzien'];
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FitPoint – grafik zajęć</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
    <header class="baner">
        <a href="index.php" class="logo">FIT<span>POINT</span></a>
        <p class="haslo">Siłownia osiedlowa · otwarte 6:00–23:00</p>
    </header>

    <nav class="menu">
        <a href="#grafik">Grafik</a>
        <a href="#zapis">Zapisy</a>
        <a href="#bmi">Kalkulator BMI</a>
        <a href="#trenerzy">Trenerzy</a>
    </nav>

    <main class="uklad">
        <section class="grafik" id="grafik">
            <h2>Grafik zajęć: <?php echo $dzien; ?></h2>
            <form class="filtr" action="index.php" method="get">
                <label for="dzien">Dzień tygodnia</label>
                <select name="dzien" id="dzien">
                    <option>Poniedziałek</option>
                    <option>Wtorek</option>
                    <option>Środa</option>
                    <option>Czwartek</option>
                    <option>Piątek</option>
                </select>
                <button type="submit">Pokaż</button>
            </form>
            <table>
                <thead>
                    <tr><th>Godzina</th><th>Zajęcia</th><th>Sala</th><th>Trener</th><th>Wolne miejsca</th></tr>
                </thead>
                <tbody>
<?php
// skrypt 1 - grafik wybranego dnia
$zapytanie = "SELECT TIME_FORMAT(godzina, '%H:%i') AS godz, nazwa, sala, imie, nazwisko, miejsca FROM zajecia JOIN trenerzy ON zajecia.trenerzy_id = trenerzy.id WHERE dzien = '$dzien' ORDER BY godzina;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<tr><td>$wiersz[0]</td><td>$wiersz[1]</td><td>$wiersz[2]</td><td>$wiersz[3] $wiersz[4]</td>";
    if ($wiersz[5] == 0) {
        echo "<td class='pelne'>brak miejsc</td></tr>";
    } else {
        echo "<td>$wiersz[5]</td></tr>";
    }
}
?>
                </tbody>
            </table>
        </section>

        <section class="zapis" id="zapis">
            <h2>Zapisz się</h2>
            <form action="index.php" method="post">
                <label for="zajecia">Zajęcia</label>
                <select name="zajecia" id="zajecia">
<?php
// skrypt 2 - zajęcia z wolnymi miejscami
$zapytanie = "SELECT id, nazwa, dzien, TIME_FORMAT(godzina, '%H:%i') AS godz FROM zajecia WHERE miejsca > 0;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<option value='$wiersz[0]'>$wiersz[1] – $wiersz[2] $wiersz[3]</option>";
}
?>
                </select>
                <label for="imie">Imię</label>
                <input type="text" name="imie" id="imie" required>
                <label for="email">E-mail</label>
                <input type="email" name="email" id="email" required>
                <button type="submit">Zapisz mnie</button>
            </form>
<?php
if ($komunikat != '') {
    echo "<p class='potwierdzenie'>$komunikat</p>";
}
?>
        </section>

        <section class="bmi" id="bmi">
            <h2>Kalkulator BMI</h2>
            <label for="waga">Waga [kg]</label>
            <input type="number" id="waga">
            <label for="wzrost">Wzrost [cm]</label>
            <input type="number" id="wzrost">
            <button type="button" onclick="obliczBmi()">Oblicz</button>
            <p id="wynik"></p>
        </section>

        <section class="trenerzy" id="trenerzy">
            <h2>Nasi trenerzy</h2>
            <div class="karty">
<?php
// skrypt 4 - trenerzy
$zapytanie = "SELECT imie, nazwisko, specjalizacja, COUNT(zajecia.id) AS liczba FROM trenerzy JOIN zajecia ON zajecia.trenerzy_id = trenerzy.id GROUP BY trenerzy.id ORDER BY liczba DESC, nazwisko;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<article class='trener'>";
    echo "<h3>$wiersz[0] $wiersz[1]</h3>";
    echo "<p>$wiersz[2]</p>";
    echo "<p class='liczba'>Zajęć w tygodniu: $wiersz[3]</p>";
    echo "</article>";
}
?>
            </div>
        </section>
    </main>

    <footer class="stopka">
        <p>FitPoint, ul. Sportowa 7 · tel. 500 600 700</p>
        <p>Stronę wykonał: 00</p>
    </footer>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
