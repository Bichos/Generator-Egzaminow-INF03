-- Baza danych: `przychodnia` (arkusz ćwiczeniowy Przychodnia Pod Lipami)
-- Nazwa przychodni, lekarze i pacjenci są wymyśleni.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE `lekarze` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `imie` VARCHAR(30) NOT NULL,
  `nazwisko` VARCHAR(30) NOT NULL,
  `specjalizacja` VARCHAR(30) NOT NULL,
  `gabinet` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `lekarze` (`id`, `imie`, `nazwisko`, `specjalizacja`, `gabinet`) VALUES
(1, 'Anna', 'Kowalczyk', 'pediatra', 12),
(2, 'Tomasz', 'Lis', 'internista', 5),
(3, 'Marta', 'Zając', 'pediatra', 14),
(4, 'Piotr', 'Kwiatkowski', 'kardiolog', 21),
(5, 'Ewa', 'Nowicka', 'dermatolog', 8),
(6, 'Jan', 'Wrona', 'internista', 6),
(7, 'Karolina', 'Bąk', 'okulista', 18);

CREATE TABLE `dyzury` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lekarze_id` INT NOT NULL,
  `dzien_nr` INT NOT NULL,
  `dzien` VARCHAR(3) NOT NULL,
  `godziny` VARCHAR(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `lekarze_id` (`lekarze_id`),
  CONSTRAINT `dyzury_ibfk_1` FOREIGN KEY (`lekarze_id`) REFERENCES `lekarze` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `dyzury` (`id`, `lekarze_id`, `dzien_nr`, `dzien`, `godziny`) VALUES
(1, 1, 3, 'Śr', '8–14'),
(2, 1, 1, 'Pn', '8–14'),
(3, 1, 5, 'Pt', '12–18'),
(4, 2, 1, 'Pn', '12–18'),
(5, 2, 2, 'Wt', '8–14'),
(6, 2, 4, 'Cz', '8–14'),
(7, 3, 4, 'Cz', '12–18'),
(8, 3, 2, 'Wt', '12–18'),
(9, 4, 3, 'Śr', '14–19'),
(10, 5, 5, 'Pt', '8–13'),
(11, 6, 3, 'Śr', '12–18'),
(12, 6, 5, 'Pt', '8–14');

CREATE TABLE `wizyty` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lekarze_id` INT NOT NULL,
  `pacjent` VARCHAR(50) NOT NULL,
  `telefon` VARCHAR(9) NOT NULL,
  `data` DATE NOT NULL,
  `potwierdzona` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `lekarze_id` (`lekarze_id`),
  CONSTRAINT `wizyty_ibfk_1` FOREIGN KEY (`lekarze_id`) REFERENCES `lekarze` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `wizyty` (`id`, `lekarze_id`, `pacjent`, `telefon`, `data`, `potwierdzona`) VALUES
(1, 1, 'Zofia Malinowska', '501234567', '2026-11-23', 0),
(2, 2, 'Adam Górski', '602345678', '2026-11-23', 1),
(3, 1, 'Leon Wieczorek', '503456789', '2026-11-25', 0),
(4, 4, 'Halina Sikora', '604567890', '2026-11-25', 0),
(5, 2, 'Bartosz Michalak', '505678901', '2026-11-24', 0),
(6, 2, 'Irena Szulc', '606789012', '2026-11-26', 1),
(7, 5, 'Nina Adamska', '507890123', '2026-11-27', 0),
(8, 3, 'Oskar Pietrzak', '608901234', '2026-11-24', 0),
(9, 6, 'Robert Jasiński', '509012345', '2026-11-30', 0),
(10, 1, 'Maja Kubiak', '600123456', '2026-11-23', 0),
(11, 4, 'Stefan Wróbel', '601234567', '2026-12-02', 0);
