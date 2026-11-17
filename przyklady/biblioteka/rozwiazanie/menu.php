<?php
// menu.php - wspólny nagłówek z menu; zmienna $aktywna wskazuje bieżącą stronę
?>
<header class="naglowek">
    <a href="index.php" class="logo">📚 Biblioteka <span>szkolna</span></a>
    <nav>
        <a href="index.php"<?php if ($aktywna == 'katalog') echo " class='aktywna'"; ?>>Katalog</a>
        <a href="dodaj.php"<?php if ($aktywna == 'dodaj') echo " class='aktywna'"; ?>>Dodaj książkę</a>
        <a href="wypozyczenia.php"<?php if ($aktywna == 'wypozyczenia') echo " class='aktywna'"; ?>>Wypożyczenia</a>
    </nav>
</header>
