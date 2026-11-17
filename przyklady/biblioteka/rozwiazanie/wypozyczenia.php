<?php
require_once 'polaczenie.php';
$aktywna = 'wypozyczenia';

if (isset($_POST['akcja'])) {
    if ($_POST['akcja'] == 'wypozycz') {
        $ksiazka = (int) $_POST['ksiazka'];
        $czytelnik = (int) $_POST['czytelnik'];
        mysqli_query($polaczenie, "INSERT INTO wypozyczenia (ksiazki_id, czytelnicy_id, data_wypozyczenia, data_zwrotu) VALUES ($ksiazka, $czytelnik, CURDATE(), NULL);");
        $komunikat = 'wypozyczono';
    } else {
        $wypozyczenie = (int) $_POST['wypozyczenie'];
        mysqli_query($polaczenie, "UPDATE wypozyczenia SET data_zwrotu = CURDATE() WHERE id = $wypozyczenie;");
        $komunikat = 'zwrocono';
    }
    mysqli_close($polaczenie);
    header("Location: wypozyczenia.php?komunikat=$komunikat");
    exit;
}
$komunikaty = array(
    'wypozyczono' => 'Zapisano wypożyczenie.',
    'zwrocono' => 'Zapisano zwrot książki.'
);
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteka szkolna – wypożyczenia</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
<?php include 'menu.php'; ?>
    <main class="tresc">
        <h1>Wypożyczenia</h1>
<?php
if (isset($_GET['komunikat']) && isset($komunikaty[$_GET['komunikat']])) {
    echo "<p class='komunikat sukces'>" . $komunikaty[$_GET['komunikat']] . "</p>";
}
?>
        <form class="formularz poziomy" action="wypozyczenia.php" method="post">
            <input type="hidden" name="akcja" value="wypozycz">
            <div>
                <label for="ksiazka">Książka</label>
                <select name="ksiazka" id="ksiazka">
<?php
$zapytanie = "SELECT ksiazki.id, tytul, egzemplarze - COUNT(wypozyczenia.id) AS dostepne FROM ksiazki LEFT JOIN wypozyczenia ON wypozyczenia.ksiazki_id = ksiazki.id AND wypozyczenia.data_zwrotu IS NULL GROUP BY ksiazki.id HAVING dostepne > 0 ORDER BY tytul;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($w = mysqli_fetch_row($wynik)) {
    $tytul = htmlspecialchars($w[1]);
    echo "<option value='$w[0]'>$tytul (dostępne: $w[2])</option>";
}
?>
                </select>
            </div>
            <div>
                <label for="czytelnik">Czytelnik</label>
                <select name="czytelnik" id="czytelnik">
<?php
$wynik = mysqli_query($polaczenie, "SELECT id, imie, nazwisko, klasa FROM czytelnicy ORDER BY nazwisko, imie;");
while ($w = mysqli_fetch_row($wynik)) {
    echo "<option value='$w[0]'>$w[2] $w[1] ($w[3])</option>";
}
?>
                </select>
            </div>
            <button type="submit">Wypożycz</button>
        </form>

        <h2>Książki u czytelników</h2>
        <table>
            <thead>
                <tr><th>Czytelnik</th><th>Klasa</th><th>Tytuł</th><th>Wypożyczono</th><th>Dni</th><th>Zwrot</th></tr>
            </thead>
            <tbody>
<?php
$zapytanie = "SELECT wypozyczenia.id, imie, nazwisko, klasa, tytul, DATE_FORMAT(data_wypozyczenia, '%d.%m.%Y'), DATEDIFF(CURDATE(), data_wypozyczenia) AS dni FROM wypozyczenia JOIN czytelnicy ON wypozyczenia.czytelnicy_id = czytelnicy.id JOIN ksiazki ON wypozyczenia.ksiazki_id = ksiazki.id WHERE data_zwrotu IS NULL ORDER BY data_wypozyczenia;";
$wynik = mysqli_query($polaczenie, $zapytanie);
if (mysqli_num_rows($wynik) == 0) {
    echo "<tr><td colspan='6' class='pusto'>Wszystkie książki są w bibliotece.</td></tr>";
}
while ($w = mysqli_fetch_row($wynik)) {
    $klasa = '';
    if ($w[6] > 14) {
        $klasa = " class='przetrzymana'";
    }
    $tytul = htmlspecialchars($w[4]);
    echo "<tr$klasa><td>$w[1] $w[2]</td><td>$w[3]</td><td>$tytul</td><td>$w[5]</td><td>$w[6]</td>";
    echo "<td><form action='wypozyczenia.php' method='post' onsubmit='return potwierdzZwrot()'><input type='hidden' name='akcja' value='zwrot'><input type='hidden' name='wypozyczenie' value='$w[0]'><button type='submit' class='maly'>Zwróć</button></form></td></tr>";
}
?>
            </tbody>
        </table>
        <p class="legenda">Wiersze wyróżnione na czerwono: książka przetrzymana dłużej niż 14 dni.</p>
    </main>
    <footer class="stopka">Projekt wykonał: 00</footer>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
