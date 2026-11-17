// skrypt 5 - kalkulator BMI
function obliczBmi() {
    let waga = Number(document.getElementById('waga').value);
    let wzrost = Number(document.getElementById('wzrost').value) / 100;
    let wynik = document.getElementById('wynik');
    if (waga <= 0 || wzrost <= 0) {
        wynik.innerHTML = 'Podaj wagę i wzrost';
        return;
    }
    let bmi = waga / (wzrost * wzrost);
    let opis;
    if (bmi < 18.5) {
        opis = 'niedowaga';
    } else if (bmi < 25) {
        opis = 'waga prawidłowa';
    } else {
        opis = 'nadwaga';
    }
    wynik.innerHTML = 'Twoje BMI: ' + bmi.toFixed(1) + ' – ' + opis;
}
