// skrypt 4 - dodawanie do koszyka
let liczbaWKoszyku = 2;

function dodajDoKoszyka(przycisk) {
    liczbaWKoszyku++;
    document.getElementById('koszyk').innerHTML = 'Koszyk (' + liczbaWKoszyku + ')';
    przycisk.innerHTML = 'W koszyku ✓';
    przycisk.disabled = true;
}
