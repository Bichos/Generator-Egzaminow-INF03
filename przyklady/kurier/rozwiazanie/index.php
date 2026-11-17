<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'kurier');
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kurier24 – wiadomości z kraju i ze świata</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
    <div class="gorny-pasek">
        <span>wtorek, 17 listopada 2026</span>
        <div class="gorny-prawa">
            <span class="pogoda-mala">Białystok 4°C</span>
            <a href="#">Newsletter</a>
            <a href="#">Zaloguj się</a>
        </div>
    </div>

    <header class="glowa">
        <a href="index.php" class="logo">KURIER<span>24</span></a>
        <nav class="glowne">
            <ul>
                <li><a href="#">Wiadomości</a></li>
                <li><a href="#">Polska</a></li>
                <li><a href="#">Świat</a></li>
                <li><a href="#">Biznes</a></li>
                <li><a href="#">Sport</a></li>
                <li><a href="#">Kultura</a></li>
                <li><a href="#">Technologia</a></li>
                <li><a href="#">Lifestyle</a></li>
            </ul>
        </nav>
    </header>

    <div class="pilne">
        <strong>Pilne</strong>
        <a href="#">Zmiany w rozkładach pociągów od grudnia. Sprawdź, które połączenia znikną</a>
    </div>

    <div class="strona">
        <section class="hero">
            <article class="glowny t1">
                <a href="#" class="podpis">
                    <span class="etykieta">Polska</span>
                    <h2>Pierwszy śnieg paraliżuje drogi na wschodzie kraju</h2>
                    <p class="meta">12 min temu · 4 komentarze</p>
                </a>
            </article>
            <article class="t2">
                <a href="#" class="podpis">
                    <span class="etykieta">Świat</span>
                    <h2>Szczyt klimatyczny zakończony kompromisem</h2>
                </a>
            </article>
            <article class="t3">
                <a href="#" class="podpis">
                    <span class="etykieta">Sport</span>
                    <h2>Biało-czerwoni wygrywają po dramatycznej końcówce</h2>
                </a>
            </article>
        </section>

        <div class="tresc">
            <main>
                <h2 class="naglowek-sekcji">Najnowsze</h2>
                <ul class="najnowsze">
<?php
// skrypt 1 - najnowsze wiadomości
$zapytanie = "SELECT DATE_FORMAT(opublikowano, '%H:%i') AS godzina, tytul FROM artykuly ORDER BY opublikowano DESC LIMIT 6;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<li><time>$wiersz[0]</time><a href='#'>$wiersz[1]</a></li>";
}
?>
                </ul>

                <h2 class="naglowek-sekcji">Biznes</h2>
                <section class="karty">
<?php
// skrypt 2 - karty działu Biznes
$zapytanie = "SELECT tytul, zajawka, DATE_FORMAT(opublikowano, '%d.%m.%Y %H:%i') AS data FROM artykuly JOIN kategorie ON artykuly.kategorie_id = kategorie.id WHERE kategorie.nazwa = 'Biznes' ORDER BY opublikowano DESC LIMIT 3;";
$wynik = mysqli_query($polaczenie, $zapytanie);
$numer = 1;
while ($wiersz = mysqli_fetch_row($wynik)) {
    echo "<article class='karta'>";
    echo "<div class='obraz o$numer'></div>";
    echo "<div class='tekst'>";
    echo "<span class='kat'>Biznes</span>";
    echo "<h3><a href='#'>$wiersz[0]</a></h3>";
    echo "<p>$wiersz[1]</p>";
    echo "<p class='meta'>$wiersz[2]</p>";
    echo "</div></article>";
    $numer++;
}
?>
                </section>

                <h2 class="naglowek-sekcji">Sport</h2>
                <section class="karty">
                    <article class="karta">
                        <div class="obraz o1"></div>
                        <div class="tekst">
                            <span class="kat">Sport</span>
                            <h3><a href="#">Siatkarze awansują do półfinału turnieju</a></h3>
                            <p>Po zaciętym meczu rozstrzygnął dopiero piąty set.</p>
                            <p class="meta">1 godz. temu</p>
                        </div>
                    </article>
                    <article class="karta">
                        <div class="obraz o2"></div>
                        <div class="tekst">
                            <span class="kat">Sport</span>
                            <h3><a href="#">Rekord życiowy młodej lekkoatletki</a></h3>
                            <p>Zawodniczka poprawiła swój wynik o prawie sekundę.</p>
                            <p class="meta">4 godz. temu</p>
                        </div>
                    </article>
                    <article class="karta">
                        <div class="obraz o3"></div>
                        <div class="tekst">
                            <span class="kat">Sport</span>
                            <h3><a href="#">Szachowy turniej przyciągnął ponad 300 uczestników</a></h3>
                            <p>Najmłodszy z zawodników miał dopiero siedem lat.</p>
                            <p class="meta">6 godz. temu</p>
                        </div>
                    </article>
                </section>
            </main>

            <aside class="boczna">
                <section class="box">
                    <h2>Najczęściej czytane</h2>
                    <ol class="popularne">
<?php
// skrypt 3 - najczęściej czytane
$zapytanie = "SELECT tytul FROM artykuly ORDER BY wyswietlenia DESC LIMIT 5;";
$wynik = mysqli_query($polaczenie, $zapytanie);
$numer = 1;
while ($wiersz = mysqli_fetch_row($wynik)) {
    if ($numer <= 3) {
        echo "<li><span class='nr top'>$numer</span><a href='#'>$wiersz[0]</a></li>";
    } else {
        echo "<li><span class='nr'>$numer</span><a href='#'>$wiersz[0]</a></li>";
    }
    $numer++;
}
?>
                    </ol>
                </section>

                <section class="box">
                    <h2>Pogoda</h2>
                    <div class="pogoda">
                        <span class="temp">4°C</span>
                        <div>
                            <strong>Białystok</strong>
                            <p>Pochmurno, wiatr 12 km/h</p>
                        </div>
                    </div>
                </section>

                <section class="box">
                    <h2>Newsletter</h2>
                    <form action="#">
                        <label for="email">Codzienne podsumowanie na e-mail</label>
                        <input type="email" id="email" placeholder="Twój adres e-mail">
                        <button type="button" onclick="zapiszNewsletter()">Zapisz się</button>
                    </form>
                    <p id="komunikat"></p>
                </section>
            </aside>
        </div>
    </div>

    <footer class="stopka">
        <div class="stopka-kolumny">
            <div>
                <h4>Serwisy</h4>
                <ul>
                    <li><a href="#">Wiadomości</a></li>
                    <li><a href="#">Sport</a></li>
                    <li><a href="#">Biznes</a></li>
                </ul>
            </div>
            <div>
                <h4>Redakcja</h4>
                <ul>
                    <li><a href="#">O nas</a></li>
                    <li><a href="#">Zespół</a></li>
                    <li><a href="#">Kontakt</a></li>
                </ul>
            </div>
            <div>
                <h4>Reklama</h4>
                <ul>
                    <li><a href="#">Oferta</a></li>
                    <li><a href="#">Cennik</a></li>
                    <li><a href="#">Media kit</a></li>
                </ul>
            </div>
            <div>
                <h4>Pomoc</h4>
                <ul>
                    <li><a href="#">Regulamin</a></li>
                    <li><a href="#">Prywatność</a></li>
                    <li><a href="#">Ustawienia cookies</a></li>
                </ul>
            </div>
        </div>
        <p class="prawa">Stronę wykonał: 00</p>
    </footer>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
