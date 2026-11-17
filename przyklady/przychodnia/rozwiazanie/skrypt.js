// skrypt 5 - sprawdzenie formularza rejestracji
function sprawdzFormularz() {
    let pacjent = document.getElementById('pacjent').value;
    let telefon = document.getElementById('telefon').value;
    let zgoda = document.getElementById('zgoda').checked;
    let bledy = [];

    if (pacjent.length < 5) {
        bledy.push('Podaj imię i nazwisko');
    }
    if (telefon.length != 9 || isNaN(telefon)) {
        bledy.push('Numer telefonu musi mieć 9 cyfr');
    }
    if (!zgoda) {
        bledy.push('Zaznacz zgodę na przetwarzanie danych');
    }

    document.getElementById('bledy').innerHTML = bledy.join('<br>');
    return bledy.length == 0;
}
