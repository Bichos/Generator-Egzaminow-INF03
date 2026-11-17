// skrypt 3 - pokazywanie i ukrywanie opisu w banerze
function pokazOpis() {
    const opis = document.getElementById('opis');
    const przycisk = document.getElementById('przyciskOpis');
    if (opis.style.display === 'block') {
        opis.style.display = 'none';
        przycisk.innerHTML = 'ⓘ Więcej informacji';
    } else {
        opis.style.display = 'block';
        przycisk.innerHTML = 'ⓘ Mniej informacji';
    }
}
