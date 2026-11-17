<?php
require_once 'polaczenie.php';
$aktywna = 'katalog';

$id = 0;
if (isset($_GET['id'])) {
    $id = (int) $_GET['id'];
}
if (isset($_POST['id'])) {
    $id = (int) $_POST['id'];
}

// dane książki i liczba jej aktywnych wypożyczeń
$wynik = mysqli_query($polaczenie, "SELECT tytul, autor FROM ksiazki WHERE id = $id;");
$znaleziona = mysqli_num_rows($wynik) == 1;
$aktywne = 0;
if ($znaleziona) {
    $k = mysqli_fetch_row($wynik);
    $wynik = mysqli_query($polaczenie, "SELECT COUNT(*) FROM wypozyczenia WHERE ksiazki_id = $id AND data_zwrotu IS NULL;");
    $aktywne = mysqli_fetch_row($wynik)[0];
}

if ($znaleziona && $aktywne == 0 && isset($_POST['potwierdz'])) {
    // najpierw historia wypożyczeń (klucz obcy), potem książka
    mysqli_query($polaczenie, "DELETE FROM wypozyczenia WHERE ksiazki_id = $id;");
    mysqli_query($polaczenie, "DELETE FROM ksiazki WHERE id = $id;");
    mysqli_close($polaczenie);
    header('Location: index.php?komunikat=usunieto');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteka szkolna – usuwanie książki</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
<?php include 'menu.php'; ?>
    <main class="tresc">
        <h1>Usuwanie książki</h1>
<?php
if (!$znaleziona) {
    echo "<p class='komunikat bledy'>Nie ma książki o podanym identyfikatorze. <a href='index.php'>Wróć do katalogu</a></p>";
} elseif ($aktywne > 0) {
    $tytul = htmlspecialchars($k[0]);
    echo "<p class='komunikat bledy'>Nie można usunąć książki „{$tytul}”, ponieważ jest wypożyczona (liczba egzemplarzy u czytelników: $aktywne). <a href='index.php'>Wróć do katalogu</a></p>";
} else {
    $tytul = htmlspecialchars($k[0]);
    $autor = htmlspecialchars($k[1]);
    echo "<div class='potwierdzenie'>";
    echo "<p>Czy na pewno usunąć książkę <strong>„{$tytul}”</strong> ($autor)?</p>";
    echo "<p class='uwaga'>Zostanie usunięta także historia wypożyczeń tej książki.</p>";
    echo "<form action='usun.php' method='post' class='przyciski'>";
    echo "<input type='hidden' name='id' value='$id'>";
    echo "<button type='submit' name='potwierdz' class='usun'>Tak, usuń</button>";
    echo "<a href='index.php' class='przycisk anuluj'>Anuluj</a>";
    echo "</form></div>";
}
?>
    </main>
    <footer class="stopka">Projekt wykonał: 00</footer>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
