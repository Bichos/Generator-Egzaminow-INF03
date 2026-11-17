<?php
require_once 'polaczenie.php';
$aktywna = 'katalog';

$szukaj = '';
if (isset($_GET['szukaj'])) {
    $szukaj = $_GET['szukaj'];
}
$kategoria = 0;
if (isset($_GET['kategoria'])) {
    $kategoria = (int) $_GET['kategoria'];
}
$komunikaty = array(
    'dodano' => 'Dodano nową książkę.',
    'zmieniono' => 'Zapisano zmiany.',
    'usunieto' => 'Książka została usunięta.'
);
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteka szkolna – katalog</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
<?php include 'menu.php'; ?>
    <main class="tresc">
        <h1>Katalog książek</h1>
<?php
if (isset($_GET['komunikat']) && isset($komunikaty[$_GET['komunikat']])) {
    echo "<p class='komunikat sukces'>" . $komunikaty[$_GET['komunikat']] . "</p>";
}
?>
        <form class="wyszukiwarka" action="index.php" method="get">
            <input type="search" name="szukaj" placeholder="Tytuł lub autor" value="<?php echo htmlspecialchars($szukaj); ?>">
            <select name="kategoria">
                <option value="0">Wszystkie kategorie</option>
<?php
$wynik = mysqli_query($polaczenie, "SELECT id, nazwa FROM kategorie ORDER BY nazwa;");
while ($wiersz = mysqli_fetch_row($wynik)) {
    $zaznaczona = '';
    if ($wiersz[0] == $kategoria) {
        $zaznaczona = ' selected';
    }
    echo "<option value='$wiersz[0]'$zaznaczona>$wiersz[1]</option>";
}
?>
            </select>
            <button type="submit">Szukaj</button>
        </form>

        <table class="katalog">
            <thead>
                <tr><th>Tytuł</th><th>Autor</th><th>Rok</th><th>Kategoria</th><th>Dostępne</th><th>Akcje</th></tr>
            </thead>
            <tbody>
<?php
$fraza = mysqli_real_escape_string($polaczenie, $szukaj);
$warunek = "WHERE (tytul LIKE '%$fraza%' OR autor LIKE '%$fraza%')";
if ($kategoria > 0) {
    $warunek = $warunek . " AND kategorie_id = $kategoria";
}
$zapytanie = "SELECT ksiazki.id, tytul, autor, rok_wydania, nazwa, egzemplarze - COUNT(wypozyczenia.id) AS dostepne, egzemplarze FROM ksiazki JOIN kategorie ON ksiazki.kategorie_id = kategorie.id LEFT JOIN wypozyczenia ON wypozyczenia.ksiazki_id = ksiazki.id AND wypozyczenia.data_zwrotu IS NULL $warunek GROUP BY ksiazki.id ORDER BY tytul;";
$wynik = mysqli_query($polaczenie, $zapytanie);
$liczba = mysqli_num_rows($wynik);
if ($liczba == 0) {
    echo "<tr><td colspan='6' class='pusto'>Nie znaleziono książek.</td></tr>";
}
while ($k = mysqli_fetch_row($wynik)) {
    $tytul = htmlspecialchars($k[1]);
    $autor = htmlspecialchars($k[2]);
    $klasa = '';
    if ($k[5] == 0) {
        $klasa = " class='brak'";
    }
    echo "<tr><td>$tytul</td><td>$autor</td><td>$k[3]</td><td>$k[4]</td><td$klasa>$k[5] / $k[6]</td>";
    echo "<td class='akcje'><a href='edytuj.php?id=$k[0]' class='przycisk edytuj'>Edytuj</a><a href='usun.php?id=$k[0]' class='przycisk usun'>Usuń</a></td></tr>";
}
?>
            </tbody>
        </table>
        <p class="podsumowanie">Liczba tytułów: <?php echo $liczba; ?></p>
    </main>
    <footer class="stopka">Projekt wykonał: 00</footer>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
