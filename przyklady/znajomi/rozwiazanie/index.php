<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'znajomi');
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Znajomi – strona główna</title>
    <link rel="stylesheet" href="styl.css">
</head>
<body>
    <header class="pasek">
        <div class="pasek-lewa">
            <a href="index.php" class="logo">Z</a>
            <input type="text" class="szukaj" placeholder="Szukaj wśród znajomych">
        </div>
        <nav class="pasek-srodek">
            <ul>
                <li><a href="#" class="aktywny" title="Start">🏠</a></li>
                <li><a href="#" title="Znajomi">👥</a></li>
                <li><a href="#" title="Wideo">🎬</a></li>
                <li><a href="#" title="Sklep">🛍</a></li>
                <li><a href="#" title="Grupy">👪</a></li>
            </ul>
        </nav>
        <div class="pasek-prawa">
            <button type="button" class="okragly" title="Wiadomości">💬</button>
            <button type="button" class="okragly" title="Powiadomienia">🔔</button>
            <span class="avatar a7">JN</span>
        </div>
    </header>

    <div class="strona">
        <aside class="lewa">
            <ul class="menu">
                <li><a href="#"><span class="avatar a7">JN</span><span>Jan Nowak</span></a></li>
                <li><a href="#"><span class="ikona">👥</span><span>Znajomi</span></a></li>
                <li><a href="#"><span class="ikona">👪</span><span>Grupy</span></a></li>
                <li><a href="#"><span class="ikona">📅</span><span>Wydarzenia</span></a></li>
                <li><a href="#"><span class="ikona">🔖</span><span>Zapisane</span></a></li>
                <li><a href="#"><span class="ikona">🕘</span><span>Wspomnienia</span></a></li>
            </ul>
        </aside>

        <main class="feed">
            <section class="relacje">
                <article class="relacja dodaj">
                    <span class="plus">+</span>
                    <span class="imie">Dodaj relację</span>
                </article>
                <article class="relacja r1">
                    <span class="avatar a1">AK</span>
                    <span class="imie">Anna Kowalska</span>
                </article>
                <article class="relacja r2">
                    <span class="avatar a2">PW</span>
                    <span class="imie">Piotr Wiśniewski</span>
                </article>
                <article class="relacja r3">
                    <span class="avatar a4">MZ</span>
                    <span class="imie">Marek Zieliński</span>
                </article>
            </section>

            <section class="karta nowy-post">
                <div class="nowy-gora">
                    <span class="avatar a7">JN</span>
                    <input type="text" placeholder="Co słychać, Janie?">
                </div>
                <div class="nowy-dol">
                    <button type="button">🎥 Wideo</button>
                    <button type="button">🖼 Zdjęcie</button>
                    <button type="button">😊 Nastrój</button>
                </div>
            </section>
<?php
// skrypt 1 - posty
$zapytanie = "SELECT posty.id, CONCAT(LEFT(imie, 1), LEFT(nazwisko, 1)) AS inicjaly, imie, nazwisko, kolor, DATE_FORMAT(dodano, '%d.%m.%Y %H:%i') AS data, tresc, tlo, obraz, polubienia, komentarze, udostepnienia FROM posty JOIN uzytkownicy ON posty.uzytkownicy_id = uzytkownicy.id ORDER BY dodano DESC;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($post = mysqli_fetch_array($wynik)) {
    echo "<article class='karta post'>";
    echo "<div class='post-naglowek'>";
    echo "<span class='avatar a$post[kolor]'>$post[inicjaly]</span>";
    echo "<div class='autor'><strong>$post[imie] $post[nazwisko]</strong><span>$post[data]</span></div>";
    echo "<button type='button' class='okragly'>…</button>";
    echo "</div>";
    if ($post['tlo'] == 1) {
        echo "<div class='post-tlo'>$post[tresc]</div>";
    } else {
        echo "<p class='post-tekst'>$post[tresc]</p>";
        if ($post['obraz'] != NULL) {
            echo "<div class='post-obraz g$post[obraz]'></div>";
        }
    }
    echo "<div class='statystyki'>";
    echo "<span>👍 <span id='lajki$post[id]'>$post[polubienia]</span></span>";
    echo "<span>Komentarze: $post[komentarze] · Udostępnienia: $post[udostepnienia]</span>";
    echo "</div>";
    echo "<div class='akcje'>";
    echo "<button type='button' onclick='polub(this, $post[id])'>👍 Lubię to</button>";
    echo "<button type='button'>💬 Komentarz</button>";
    echo "<button type='button'>↗ Udostępnij</button>";
    echo "</div>";
    echo "</article>";
}
?>
            <footer class="autor-strony">Stronę wykonał: 00</footer>
        </main>

        <aside class="prawa">
            <section>
                <h2>Zaproszenia do znajomych</h2>
<?php
// skrypt 2 - zaproszenia
$zapytanie = "SELECT CONCAT(LEFT(imie, 1), LEFT(nazwisko, 1)) AS inicjaly, imie, nazwisko, kolor, wspolni FROM uzytkownicy WHERE status = 'zaproszenie' ORDER BY wspolni DESC;";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($osoba = mysqli_fetch_array($wynik)) {
    echo "<div class='zaproszenie'>";
    echo "<span class='avatar a$osoba[kolor]'>$osoba[inicjaly]</span>";
    echo "<div><strong>$osoba[imie] $osoba[nazwisko]</strong>";
    echo "<p>Wspólni znajomi: $osoba[wspolni]</p>";
    echo "<div class='przyciski'><button type='button' class='btn-glowny'>Potwierdź</button><button type='button' class='btn-szary'>Usuń</button></div>";
    echo "</div></div>";
}
?>
            </section>
            <section>
                <h2>Urodziny</h2>
                <p class="urodziny">🎂 Dziś urodziny ma <strong>Ewa Lis</strong>.</p>
            </section>
            <section>
                <h2>Kontakty</h2>
                <ul class="kontakty">
<?php
// skrypt 3 - kontakty
$zapytanie = "SELECT CONCAT(LEFT(imie, 1), LEFT(nazwisko, 1)) AS inicjaly, imie, nazwisko, kolor, online FROM uzytkownicy WHERE status = 'znajomy';";
$wynik = mysqli_query($polaczenie, $zapytanie);
while ($osoba = mysqli_fetch_array($wynik)) {
    $klasy = "avatar a$osoba[kolor]";
    if ($osoba['online'] == 1) {
        $klasy = $klasy . " online";
    }
    echo "<li><a href='#'><span class='$klasy'>$osoba[inicjaly]</span><span>$osoba[imie] $osoba[nazwisko]</span></a></li>";
}
?>
                </ul>
            </section>
        </aside>
    </div>
    <script src="skrypt.js"></script>
</body>
</html>
<?php
mysqli_close($polaczenie);
?>
