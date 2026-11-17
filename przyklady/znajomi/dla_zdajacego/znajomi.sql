-- Baza danych: `znajomi` (arkusz ćwiczeniowy Znajomi)
-- Nazwa serwisu, osoby i wpisy są wymyślone.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE `uzytkownicy` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `imie` VARCHAR(30) NOT NULL,
  `nazwisko` VARCHAR(30) NOT NULL,
  `kolor` INT NOT NULL,
  `online` TINYINT(1) NOT NULL,
  `status` VARCHAR(15) NOT NULL,
  `wspolni` INT NOT NULL,
  `data_urodzenia` DATE DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `uzytkownicy` (`id`, `imie`, `nazwisko`, `kolor`, `online`, `status`, `wspolni`, `data_urodzenia`) VALUES
(1, 'Anna', 'Kowalska', 1, 1, 'znajomy', 0, '1990-03-12'),
(2, 'Piotr', 'Wiśniewski', 2, 1, 'znajomy', 0, '1989-07-01'),
(3, 'Ewa', 'Lis', 3, 0, 'znajomy', 0, '1991-11-17'),
(4, 'Marek', 'Zieliński', 4, 1, 'znajomy', 0, '1990-05-23'),
(5, 'Kasia', 'Dąbrowska', 5, 0, 'zaproszenie', 3, '1992-01-30'),
(6, 'Tomek', 'Nowicki', 6, 1, 'zaproszenie', 8, '1988-08-17'),
(7, 'Jan', 'Nowak', 7, 1, 'ja', 0, '1990-11-07'),
(8, 'Klub', 'Informatyków', 8, 0, 'strona', 0, NULL);

CREATE TABLE `posty` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `uzytkownicy_id` INT NOT NULL,
  `tresc` VARCHAR(250) NOT NULL,
  `tlo` TINYINT(1) NOT NULL,
  `obraz` INT DEFAULT NULL,
  `dodano` DATETIME NOT NULL,
  `polubienia` INT NOT NULL,
  `komentarze` INT NOT NULL,
  `udostepnienia` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `uzytkownicy_id` (`uzytkownicy_id`),
  CONSTRAINT `posty_ibfk_1` FOREIGN KEY (`uzytkownicy_id`) REFERENCES `uzytkownicy` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `posty` (`id`, `uzytkownicy_id`, `tresc`, `tlo`, `obraz`, `dodano`, `polubienia`, `komentarze`, `udostepnienia`) VALUES
(1, 4, 'Udało się! Mój pierwszy własny projekt strony działa 🎉', 0, 2, '2026-11-16 19:12:00', 58, 12, 1),
(2, 1, 'Jesienny spacer po Puszczy Białowieskiej. Polecam wszystkim, którzy potrzebują chwili ciszy! 🍂', 0, 1, '2026-11-17 08:05:00', 24, 5, 2),
(3, 2, 'Ktoś chętny na planszówki w sobotę? 🎲', 0, NULL, '2026-11-15 20:30:00', 7, 3, 0),
(4, 8, 'Jutro o 17:00 warsztaty z HTML i CSS. Zapraszamy wszystkich!', 1, NULL, '2026-11-17 05:10:00', 41, 9, 6);
