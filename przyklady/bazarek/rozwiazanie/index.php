<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'bazarek');
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bazarek – telefony i smartfony</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
    <header class="gora">
        <a href="index.php" class="logo">BAZAREK</a>
        <form class="szukaj" action="#">
            <input type="text" placeholder="Czego szukasz?">
            <select>
                <option>Wszystkie kategorie</option>
                <option>Elektronika</option>
                <option>Moda</option>
                <option>Dom i ogród</option>
            </select>
            <button type="submit">Szukaj</button>
        </form>
        <div class="konto">
            <a href="#">Moje konto</a>
            <a href="#">Obserwowane ♡</a>
            <a href="#" id="koszyk">Koszyk (2)</a>
        </div>
    </header>

    <nav class="kategorie">
        <ul>
            <li><a href="#">Elektronika</a></li>
            <li><a href="#">Moda</a></li>
            <li><a href="#">Dom i ogród</a></li>
            <li><a href="#">Supermarket</a></li>
            <li><a href="#">Dziecko</a></li>
            <li><a href="#">Uroda</a></li>
            <li><a href="#">Zdrowie</a></li>
            <li><a href="#">Kultura i rozrywka</a></li>
            <li><a href="#">Sport i turystyka</a></li>
            <li><a href="#">Motoryzacja</a></li>
        </ul>
    </nav>

    <p class="okruszki"><a href="index.php">Strona główna</a> › <a href="#">Elektronika</a> › <strong>Telefony i smartfony</strong></p>

    <div class="uklad">
        <aside class="filtry">
            <h2>Filtry</h2>
            <form action="#">
                <fieldset>
                    <legend>Stan</legend>
                    <label><input type="checkbox" checked> Nowy</label>
                    <label><input type="checkbox"> Używany</label>
                </fieldset>
                <fieldset>
                    <legend>Cena</legend>
                    <div class="cena-pola">
                        <input type="number" placeholder="od">
                        <input type="number" placeholder="do">
                    </div>
                    <button type="button">Zastosuj</button>
                </fieldset>
                <fieldset>
                    <legend>Dostawa</legend>
                    <label><input type="checkbox"> Darmowa dostawa</label>
                    <label><input type="checkbox"> Smart!</label>
                </fieldset>
                <fieldset>
                    <legend>Producent</legend>
                    <?php
                    // skrypt 1 - producenci w filtrach
                    $zapytanie = "SELECT nazwa FROM producenci ORDER BY nazwa";
                    $wynik = mysqli_query($polaczenie, $zapytanie);
                    while ($wiersz = mysqli_fetch_row($wynik)) {
                        echo "<label><input type='checkbox'> $wiersz[0]</label>";
                    }
                    ?>
                </fieldset>
            </form>
        </aside>

        <main>
            <div class="pasek-wynikow">
                <div>
                    <h1>Telefony i smartfony</h1>
                    <?php
                    // skrypt 2 - liczba ofert
                    $zapytanie = "SELECT COUNT(*) AS liczba FROM oferty";
                    $wynik = mysqli_query($polaczenie, $zapytanie);
                    $wiersz = mysqli_fetch_row($wynik);
                    echo "<p>Znaleziono $wiersz[0] ofert</p>";
                    ?>
                </div>
                <select>
                    <option>Trafność: największa</option>
                    <option>Cena: od najniższej</option>
                    <option>Cena: od najwyższej</option>
                    <option>Najnowsze</option>
                </select>
            </div>

            <section class="oferty">
                <?php
                // skrypt 3 - karty ofert
                $zapytanie = "SELECT tytul, cena, stara_cena, gwiazdki, opinie, dostawa, smart, okazja FROM oferty";
                $wynik = mysqli_query($polaczenie, $zapytanie);
                while ($wiersz = mysqli_fetch_row($wynik)) {
                    $cena = number_format($wiersz[1], 2, ',', ' ');
                    $gwiazdki = str_repeat('★', $wiersz[3]) . str_repeat('☆', 5 - $wiersz[3]);
                    echo "<article class='oferta'>";
                    if ($wiersz[7] == 1) {
                        echo "<span class='badge'>Okazja</span>";
                    }
                    echo "<div class='zdjecie'>📱</div>";
                    echo "<h3>$wiersz[0]</h3>";
                    echo "<p class='ocena'>$gwiazdki <span>($wiersz[4])</span></p>";
                    echo "<p class='cena'>$cena zł</p>";
                    if ($wiersz[2] != null) {
                        $stara = number_format($wiersz[2], 2, ',', ' ');
                        echo "<p class='stara'>$stara zł</p>";
                    }
                    if ($wiersz[6] == 1) {
                        echo "<p class='dostawa'><span class='smart'>Smart!</span> $wiersz[5]</p>";
                    } else {
                        echo "<p class='dostawa'>$wiersz[5]</p>";
                    }
                    echo "<button type='button' onclick='dodajDoKoszyka(this)'>Dodaj do koszyka</button>";
                    echo "</article>";
                }
                ?>
            </section>

            <nav class="strony">
                <a href="#">‹</a>
                <a href="#" class="aktualna">1</a>
                <a href="#">2</a>
                <a href="#">3</a>
                <a href="#">…</a>
                <a href="#">12</a>
                <a href="#">›</a>
            </nav>
        </main>
    </div>

    <footer class="stopka">
        <div class="stopka-kolumny">
            <div>
                <h4>Pomoc</h4>
                <ul>
                    <li><a href="#">Jak kupować</a></li>
                    <li><a href="#">Płatności i dostawa</a></li>
                    <li><a href="#">Zwroty i reklamacje</a></li>
                </ul>
            </div>
            <div>
                <h4>O nas</h4>
                <ul>
                    <li><a href="#">O Bazarku</a></li>
                    <li><a href="#">Kariera</a></li>
                    <li><a href="#">Regulamin</a></li>
                </ul>
            </div>
            <div>
                <h4>Dla sprzedających</h4>
                <ul>
                    <li><a href="#">Załóż sklep</a></li>
                    <li><a href="#">Opłaty i prowizje</a></li>
                    <li><a href="#">Poradnik sprzedawcy</a></li>
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
