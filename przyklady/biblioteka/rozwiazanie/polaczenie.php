<?php
// polaczenie.php - wspólne połączenie z bazą, dołączane na początku każdej strony
$polaczenie = mysqli_connect('localhost', 'root', '', 'biblioteka');
mysqli_set_charset($polaczenie, 'utf8mb4');
