<?php
require_once 'polaczenie.php';
$aktywna = 'dodaj';

// wartości pól formularza (puste lub wpisane przez użytkownika)
$tytul = '';
$autor = '';
$rok = '';
$isbn = '';
$egzemplarze = 1;
$kategoria = 0;
$bledy = array();

if (isset($_POST['tytul'])) {
    $tytul = trim($_POST['tytul']);
    $autor = trim($_POST['autor']);
    $rok = (int) $_POST['rok'];
    $isbn = trim($_POST['isbn']);
    $egzemplarze = (int) $_POST['egzemplarze'];
    $kategoria = (int) $_POST['kategoria'];

    if ($tytul == '') {
        $bledy[] = 'Podaj tytuł.';
    }
    if ($autor == '') {
        $bledy[] = 'Podaj autora.';
    }
    if ($rok < 1400 || $rok > 2026) {
        $bledy[] = 'Rok wydania musi być z przedziału 1400–2026.';
    }
    if (strlen($isbn) != 13) {
        $bledy[] = 'ISBN musi mieć 13 cyfr.';
    }
    if ($egzemplarze < 1) {
        $bledy[] = 'Liczba egzemplarzy musi być co najmniej 1.';
    }

    if (count($bledy) == 0) {
        $t = mysqli_real_escape_string($polaczenie, $tytul);
        $a = mysqli_real_escape_string($polaczenie, $autor);
        $i = mysqli_real_escape_string($polaczenie, $isbn);
        mysqli_query($polaczenie, "INSERT INTO ksiazki (tytul, autor, rok_wydania, isbn, egzemplarze, kategorie_id) VALUES ('$t', '$a', $rok, '$i', $egzemplarze, $kategoria);");
        mysqli_close($polaczenie);
        header('Location: index.php?komunikat=dodano');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteka szkolna – dodaj książkę</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
<?php include 'menu.php'; ?>
    <main class="tresc">
        <h1>Dodaj książkę</h1>
<?php
if (count($bledy) > 0) {
    echo "<ul class='komunikat bledy'>";
    foreach ($bledy as $blad) {
        echo "<li>$blad</li>";
    }
    echo "</ul>";
}
?>
        <form class="formularz" action="dodaj.php" method="post" onsubmit="return sprawdzIsbn()">
            <label for="tytul">Tytuł</label>
            <input type="text" name="tytul" id="tytul" value="<?php echo htmlspecialchars($tytul); ?>">
            <label for="autor">Autor</label>
            <input type="text" name="autor" id="autor" value="<?php echo htmlspecialchars($autor); ?>">
            <div class="wiersz">
                <div>
                    <label for="rok">Rok wydania</label>
                    <input type="number" name="rok" id="rok" value="<?php echo $rok; ?>">
                </div>
                <div>
                    <label for="egzemplarze">Liczba egzemplarzy</label>
                    <input type="number" name="egzemplarze" id="egzemplarze" min="1" value="<?php echo $egzemplarze; ?>">
                </div>
            </div>
            <label for="isbn">ISBN (13 cyfr)</label>
            <input type="text" name="isbn" id="isbn" maxlength="13" value="<?php echo htmlspecialchars($isbn); ?>">
            <p id="blad-isbn"></p>
            <label for="kategoria">Kategoria</label>
            <select name="kategoria" id="kategoria">
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
            <div class="przyciski">
                <button type="submit">Dodaj książkę</button>
                <a href="index.php" class="przycisk anuluj">Anuluj</a>
            </div>
        </form>
    </main>
    <footer class="stopka">Projekt wykonał: 00</footer>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
