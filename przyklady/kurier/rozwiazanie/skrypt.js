// skrypt 4 - zapis do newslettera
function zapiszNewsletter() {
    let adres = document.getElementById('email').value;
    let komunikat = document.getElementById('komunikat');
    if (adres.includes('@')) {
        komunikat.innerHTML = 'Dziękujemy! Podsumowanie wyślemy na adres ' + adres;
        komunikat.className = 'sukces';
    } else {
        komunikat.innerHTML = 'Podaj poprawny adres e-mail';
        komunikat.className = 'blad';
    }
}
