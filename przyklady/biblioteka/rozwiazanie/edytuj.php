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
$bledy = array();

if (isset($_POST['tytul'])) {
    // zapis zmian
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
        mysqli_query($polaczenie, "UPDATE ksiazki SET tytul = '$t', autor = '$a', rok_wydania = $rok, isbn = '$i', egzemplarze = $egzemplarze, kategorie_id = $kategoria WHERE id = $id;");
        mysqli_close($polaczenie);
        header('Location: index.php?komunikat=zmieniono');
        exit;
    }
    $znaleziona = true;
} else {
    // odczyt danych książki do formularza
    $wynik = mysqli_query($polaczenie, "SELECT tytul, autor, rok_wydania, isbn, egzemplarze, kategorie_id FROM ksiazki WHERE id = $id;");
    $znaleziona = mysqli_num_rows($wynik) == 1;
    if ($znaleziona) {
        $k = mysqli_fetch_row($wynik);
        $tytul = $k[0];
        $autor = $k[1];
        $rok = $k[2];
        $isbn = $k[3];
        $egzemplarze = $k[4];
        $kategoria = $k[5];
    }
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteka szkolna – edycja książki</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
<?php include 'menu.php'; ?>
    <main class="tresc">
        <h1>Edycja książki</h1>
<?php
if (!$znaleziona) {
    echo "<p class='komunikat bledy'>Nie ma książki o podanym identyfikatorze. <a href='index.php'>Wróć do katalogu</a></p>";
} else {
    if (count($bledy) > 0) {
        echo "<ul class='komunikat bledy'>";
        foreach ($bledy as $blad) {
            echo "<li>$blad</li>";
        }
        echo "</ul>";
    }
?>
        <form class="formularz" action="edytuj.php" method="post" onsubmit="return sprawdzIsbn()">
            <input type="hidden" name="id" value="<?php echo $id; ?>">
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
                <button type="submit">Zapisz zmiany</button>
                <a href="index.php" class="przycisk anuluj">Anuluj</a>
            </div>
        </form>
<?php
}
?>
    </main>
    <footer class="stopka">Projekt wykonał: 00</footer>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
