<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'streambox');
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StreamBox – filmy i seriale</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
    <header class="pasek">
        <img src="logo.png" alt="StreamBox" class="logo">
        <nav>
            <ul>
                <li><a href="index.php">Strona główna</a></li>
                <li><a href="#">Seriale</a></li>
                <li><a href="#">Filmy</a></li>
                <li><a href="#">Nowe i popularne</a></li>
                <li><a href="#">Moja lista</a></li>
            </ul>
        </nav>
        <a href="#" class="btn btn-czerwony">Zaloguj się</a>
    </header>

    <section class="hero">
        <div class="hero-tresc">
            <?php
            // skrypt 1 - baner z najlepiej dopasowaną produkcją
            $zapytanie = "SELECT tytul, rok, typ, gatunek, dopasowanie, opis FROM produkcje ORDER BY dopasowanie DESC LIMIT 1";
            $wynik = mysqli_query($polaczenie, $zapytanie);
            $wiersz = mysqli_fetch_row($wynik);
            echo "<h1>$wiersz[0]</h1>";
            echo "<p class='meta'>$wiersz[4]% dopasowania · $wiersz[1] · $wiersz[2] · $wiersz[3]</p>";
            echo "<p class='opis' id='opis'>$wiersz[5]</p>";
            ?>
            <div class="przyciski">
                <a href="#" class="btn btn-bialy">▶ Odtwórz</a>
                <button class="btn btn-szary" id="przyciskOpis" onclick="pokazOpis()">ⓘ Więcej informacji</button>
            </div>
        </div>
    </section>

    <main>
        <?php
        // skrypt 2 - rzędy kafelków dla każdej kategorii
        $zapytanie = "SELECT id, nazwa FROM kategorie";
        $kategorie = mysqli_query($polaczenie, $zapytanie);
        while ($kategoria = mysqli_fetch_row($kategorie)) {
            echo "<section class='rzad'>";
            echo "<h2>$kategoria[1]</h2>";
            echo "<div class='kafelki'>";
            $zapytanie = "SELECT tytul, kolor FROM produkcje WHERE kategorie_id = $kategoria[0]";
            $produkcje = mysqli_query($polaczenie, $zapytanie);
            while ($produkcja = mysqli_fetch_row($produkcje)) {
                echo "<article class='kafel $produkcja[1]'><span>$produkcja[0]</span></article>";
            }
            echo "</div>";
            echo "</section>";
        }
        ?>
    </main>

    <footer class="stopka">
        <p>Masz pytania? Zadzwoń: 800 000 000</p>
        <ul>
            <li><a href="#">Często zadawane pytania</a></li>
            <li><a href="#">Centrum pomocy</a></li>
            <li><a href="#">Warunki korzystania</a></li>
            <li><a href="#">Prywatność</a></li>
            <li><a href="#">Kontakt</a></li>
        </ul>
        <p>Stronę wykonał: 00</p>
    </footer>

    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
