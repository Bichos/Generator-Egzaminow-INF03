// skrypt JS 1 - sprawdzenie numeru ISBN-13 przed wysłaniem formularza (dodaj.php, edytuj.php)
function sprawdzIsbn() {
    let isbn = document.getElementById('isbn').value;
    let komunikat = document.getElementById('blad-isbn');

    if (isbn.length != 13 || isNaN(isbn)) {
        komunikat.innerHTML = 'ISBN musi składać się z 13 cyfr';
        return false;
    }
    // cyfry na pozycjach parzystych (licząc od 1) mają wagę 3, pozostałe wagę 1
    let suma = 0;
    for (let i = 0; i < 12; i++) {
        let cyfra = Number(isbn[i]);
        if (i % 2 == 0) {
            suma = suma + cyfra;
        } else {
            suma = suma + 3 * cyfra;
        }
    }
    let kontrolna = (10 - suma % 10) % 10;
    if (kontrolna != Number(isbn[12])) {
        komunikat.innerHTML = 'Niepoprawna cyfra kontrolna ISBN (powinna być ' + kontrolna + ')';
        return false;
    }
    komunikat.innerHTML = '';
    return true;
}

// skrypt JS 2 - potwierdzenie zwrotu książki (wypozyczenia.php)
function potwierdzZwrot() {
    return confirm('Czy potwierdzasz zwrot książki?');
}
