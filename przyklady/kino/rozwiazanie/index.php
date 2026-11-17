<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'kino');
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kino Orbita – repertuar i rezerwacje</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
    <header class="naglowek">
        <a href="index.php" class="logo">KINO <span>ORBITA</span></a>
        <nav>
            <ul>
                <li><a href="index.php">Repertuar</a></li>
                <li><a href="#">Cennik</a></li>
                <li><a href="#">Kontakt</a></li>
            </ul>
        </nav>
    </header>

    <main class="uklad">
        <section class="repertuar">
            <h1>Repertuar – piątek 20.11.2026</h1>
            <div class="filmy">
<?php
// skrypt 1 - filmy
$zapytanie = "SELECT id, tytul, gatunek, czas_trwania, wiek FROM filmy ORDER BY tytul;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($film = mysqli_fetch_row($wynik)) {
    if ($film[4] == 0) {
        $wiek = 'b.o.';
    } else {
        $wiek = $film[4] . '+';
    }
    echo "<article class='film'>";
    echo "<div class='plakat p$film[0]'><span class='wiek'>$wiek</span></div>";
    echo "<h2>$film[1]</h2>";
    echo "<p class='info'>$film[2] · $film[3] min</p>";
    echo "<div class='godziny'>";
    // skrypt 2 - seanse filmu
    $zapytanie2 = "SELECT seanse.id, TIME_FORMAT(godzina, '%H:%i') AS godz, 40 - COUNT(rezerwacje.id) AS wolne FROM seanse LEFT JOIN rezerwacje ON rezerwacje.seanse_id = seanse.id WHERE seanse.filmy_id = $film[0] GROUP BY seanse.id ORDER BY godzina;";
    $wynik2 = mysqli_query($polaczenie, $zapytanie2);
    while ($seans = mysqli_fetch_row($wynik2)) {
        if ($seans[2] == 0) {
            echo "<span class='godzina pelny'>$seans[1] <small>brak miejsc</small></span>";
        } elseif ($seans[2] <= 5) {
            echo "<a href='index.php?seans=$seans[0]' class='godzina ostatnie'>$seans[1] <small>wolne: $seans[2]</small></a>";
        } else {
            echo "<a href='index.php?seans=$seans[0]' class='godzina'>$seans[1] <small>wolne: $seans[2]</small></a>";
        }
    }
    echo "</div>";
    echo "</article>";
}
?>
            </div>
        </section>

        <aside class="rezerwacja">
<?php
// skrypt 3 - plan sali wybranego seansu
if (isset($_GET['seans'])) {
    $seans = $_GET['seans'];
    $zapytanie = "SELECT tytul, DATE_FORMAT(data, '%d.%m.%Y') AS dzien, TIME_FORMAT(godzina, '%H:%i') AS godz, sala, cena FROM seanse JOIN filmy ON seanse.filmy_id = filmy.id WHERE seanse.id = $seans;";
    $wynik = mysqli_query($polaczenie, $zapytanie);
    $dane = mysqli_fetch_row($wynik);
    echo "<h2>$dane[0]</h2>";
    echo "<p>$dane[1], godz. $dane[2] · Sala $dane[3]</p>";
    echo "<p>Cena biletu: <span id='cena'>$dane[4]</span> zł</p>";

    $zajete = array();
    $zapytanie = "SELECT rzad, miejsce FROM rezerwacje WHERE seanse_id = $seans;";
    $wynik = mysqli_query($polaczenie, $zapytanie);
    while ($miejsce = mysqli_fetch_row($wynik)) {
        $zajete[] = $miejsce[0] . $miejsce[1];
    }

    echo "<div class='ekran'>EKRAN</div>";
    echo "<div class='sala'>";
    $rzedy = array('A', 'B', 'C', 'D', 'E');
    foreach ($rzedy as $rzad) {
        for ($nr = 1; $nr <= 8; $nr++) {
            $oznaczenie = $rzad . $nr;
            if (in_array($oznaczenie, $zajete)) {
                echo "<button type='button' class='miejsce zajete' disabled>$oznaczenie</button>";
            } else {
                echo "<button type='button' class='miejsce' onclick='wybierz(this)'>$oznaczenie</button>";
            }
        }
    }
    echo "</div>";
    echo "<p id='podsumowanie'>Nie wybrano miejsc</p>";
} else {
    echo "<p class='wskazowka'>Wybierz godzinę seansu z repertuaru, aby zobaczyć plan sali.</p>";
}
?>
        </aside>
    </main>

    <footer class="stopka">
        <p>Kino Orbita · ul. Filmowa 12 · bilety: 500 100 200</p>
        <p>Stronę wykonał: 00</p>
    </footer>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
