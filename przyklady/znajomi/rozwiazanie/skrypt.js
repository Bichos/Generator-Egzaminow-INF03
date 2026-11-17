// skrypt 4 - przycisk „Lubię to”
function polub(przycisk, numerPostu) {
    let licznik = document.getElementById('lajki' + numerPostu);
    let liczba = Number(licznik.innerHTML);
    if (przycisk.classList.contains('polubione')) {
        liczba = liczba - 1;
        przycisk.classList.remove('polubione');
    } else {
        liczba = liczba + 1;
        przycisk.classList.add('polubione');
    }
    licznik.innerHTML = liczba;
}
