-- Baza danych: `streambox` (arkusz ćwiczeniowy StreamBox)
-- Wszystkie tytuły i opisy są wymyślone.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE `kategorie` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nazwa` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `kategorie` (`id`, `nazwa`) VALUES
(1, 'Popularne teraz'),
(2, 'Seriale kryminalne'),
(3, 'Komedie na wieczór');

CREATE TABLE `produkcje` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tytul` VARCHAR(60) NOT NULL,
  `rok` INT NOT NULL,
  `typ` VARCHAR(10) NOT NULL,
  `gatunek` VARCHAR(20) NOT NULL,
  `dopasowanie` INT NOT NULL,
  `opis` TEXT,
  `kolor` VARCHAR(2) NOT NULL,
  `kategorie_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `kategorie_id` (`kategorie_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `produkcje` (`id`, `tytul`, `rok`, `typ`, `gatunek`, `dopasowanie`, `opis`, `kolor`, `kategorie_id`) VALUES
(1, 'Noc nad Biebrzą', 2026, 'serial', 'Thriller', 98, 'Gdy w mglistych mokradłach znikają kolejni mieszkańcy, młoda policjantka odkrywa, że wszystkie tropy prowadzą do jej własnej rodziny.', 'k6', 1),
(2, 'Ostatni autobus', 2024, 'film', 'Dramat', 91, 'Nocny kurs przez opustoszałe miasto zmienia życie sześciorga pasażerów.', 'k1', 1),
(3, 'Wilcze wzgórza', 2025, 'serial', 'Przygodowy', 87, 'Rodzina leśników walczy o przetrwanie schroniska w Bieszczadach.', 'k2', 1),
(4, 'Cień nad Narwią', 2023, 'film', 'Thriller', 84, 'Dziennikarka wraca do rodzinnej wsi, by wyjaśnić zaginięcie sprzed lat.', 'k3', 1),
(5, 'Kod Zero', 2026, 'serial', 'Sci-fi', 93, 'Zespół informatyków odkrywa w systemie miasta program, który przewiduje przyszłość.', 'k4', 1),
(6, 'Szkoła przetrwania', 2022, 'film', 'Komedia', 76, 'Klasa maturalna trafia na obóz survivalowy prowadzony przez byłego komandosa.', 'k5', 1),
(7, 'Zimowa baza', 2021, 'film', 'Przygodowy', 72, 'Polarnicy odcięci od świata muszą przetrwać najdłuższą noc w roku.', 'k6', 1),
(8, 'Dossier 17', 2025, 'serial', 'Kryminał', 89, 'Archiwum policyjne skrywa teczkę, której nikt nie powinien otwierać.', 'k1', 2),
(9, 'Mgła', 2020, 'serial', 'Kryminał', 81, 'Komisarz z Gdańska ściga sprawcę, który działa tylko podczas mgły.', 'k2', 2),
(10, 'Trzecia zmiana', 2024, 'serial', 'Kryminał', 79, 'Nocna zmiana na komisariacie to więcej niż rutynowe zgłoszenia.', 'k3', 2),
(11, 'Linia brzegowa', 2023, 'serial', 'Kryminał', 85, 'Na plaży w Łebie fale wyrzucają tajemnicze skrzynie.', 'k4', 2),
(12, 'Sąsiedzi', 2026, 'serial', 'Kryminał', 90, 'Na nowym osiedlu każdy coś ukrywa, a monitoring nagrywa wszystko.', 'k5', 2),
(13, 'Fałszywy trop', 2022, 'serial', 'Kryminał', 74, 'Detektyw z problemami z pamięcią prowadzi sprawę własnego włamania.', 'k6', 2),
(14, 'Weekend u cioci', 2025, 'film', 'Komedia', 83, 'Rodzinny zjazd wymyka się spod kontroli, gdy ciocia ogłasza sprzedaż domu.', 'k1', 3),
(15, 'Zepsuty GPS', 2024, 'film', 'Komedia', 78, 'Nawigacja prowadzi grupę przyjaciół wszędzie, tylko nie nad morze.', 'k2', 3),
(16, 'Wesele na dwa fronty', 2026, 'film', 'Komedia', 88, 'Dwa wesela w jednej sali i tylko jeden zespół muzyczny.', 'k3', 3),
(17, 'Biuro numer 5', 2023, 'serial', 'Komedia', 80, 'Codzienność najmniej wydajnego działu w urzędzie miasta.', 'k4', 3),
(18, 'Mistrz parkowania', 2021, 'film', 'Komedia', 69, 'Instruktor nauki jazdy przygotowuje się do mistrzostw w parkowaniu.', 'k5', 3),
(19, 'Dwa lewe kapcie', 2022, 'film', 'Komedia', 71, 'Para emerytów zamienia się mieszkaniami z wnukiem studentem.', 'k6', 3);

ALTER TABLE `kategorie` MODIFY `id` INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `produkcje` MODIFY `id` INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;
ALTER TABLE `produkcje` ADD CONSTRAINT `fk_produkcje_kategorie` FOREIGN KEY (`kategorie_id`) REFERENCES `kategorie` (`id`);
