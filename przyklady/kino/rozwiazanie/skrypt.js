// skrypt 4 - wybór miejsc na sali
const LIMIT_MIEJSC = 4;

function wybierz(przycisk) {
    let wybrane = document.querySelectorAll('.wybrane');
    let podsumowanie = document.getElementById('podsumowanie');
    if (!przycisk.classList.contains('wybrane') && wybrane.length >= LIMIT_MIEJSC) {
        podsumowanie.innerHTML = 'Można wybrać najwyżej ' + LIMIT_MIEJSC + ' miejsca';
        return;
    }
    przycisk.classList.toggle('wybrane');

    wybrane = document.querySelectorAll('.wybrane');
    if (wybrane.length == 0) {
        podsumowanie.innerHTML = 'Nie wybrano miejsc';
        return;
    }
    let lista = [];
    for (let i = 0; i < wybrane.length; i++) {
        lista.push(wybrane[i].innerHTML);
    }
    let cena = Number(document.getElementById('cena').innerHTML);
    let suma = cena * wybrane.length;
    podsumowanie.innerHTML = 'Wybrane miejsca: ' + lista.join(', ') + '<br>Do zapłaty: ' + suma.toFixed(2) + ' zł';
}
