-- Baza danych: `fitpoint` (arkusz ćwiczeniowy FitPoint)
-- Nazwa klubu, trenerzy i zajęcia są wymyślone.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE `trenerzy` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `imie` VARCHAR(30) NOT NULL,
  `nazwisko` VARCHAR(30) NOT NULL,
  `specjalizacja` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `trenerzy` (`id`, `imie`, `nazwisko`, `specjalizacja`) VALUES
(1, 'Kamil', 'Wójcik', 'trening siłowy'),
(2, 'Ola', 'Mazur', 'joga i stretching'),
(3, 'Bartek', 'Krawczyk', 'crossfit'),
(4, 'Natalia', 'Kaczmarek', 'zumba i fitness'),
(5, 'Igor', 'Pawlak', 'boks');

CREATE TABLE `zajecia` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nazwa` VARCHAR(40) NOT NULL,
  `dzien` VARCHAR(15) NOT NULL,
  `godzina` TIME NOT NULL,
  `sala` VARCHAR(10) NOT NULL,
  `miejsca` INT NOT NULL,
  `trenerzy_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `trenerzy_id` (`trenerzy_id`),
  CONSTRAINT `zajecia_ibfk_1` FOREIGN KEY (`trenerzy_id`) REFERENCES `trenerzy` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `zajecia` (`id`, `nazwa`, `dzien`, `godzina`, `sala`, `miejsca`, `trenerzy_id`) VALUES
(1, 'Joga', 'Poniedziałek', '08:00:00', 'Sala A', 12, 2),
(2, 'Crossfit', 'Poniedziałek', '19:30:00', 'Sala C', 8, 3),
(3, 'Trening obwodowy', 'Poniedziałek', '17:00:00', 'Sala B', 4, 1),
(4, 'Zumba', 'Poniedziałek', '18:30:00', 'Sala A', 0, 4),
(5, 'Stretching', 'Wtorek', '07:30:00', 'Sala A', 15, 2),
(6, 'Zumba', 'Wtorek', '18:00:00', 'Sala A', 2, 4),
(7, 'Siłownia z trenerem', 'Środa', '16:00:00', 'Sala B', 6, 1),
(8, 'Crossfit', 'Środa', '19:00:00', 'Sala C', 0, 3),
(9, 'Joga', 'Czwartek', '18:00:00', 'Sala A', 10, 2),
(10, 'Trening obwodowy', 'Piątek', '17:30:00', 'Sala B', 9, 1);

CREATE TABLE `zapisy` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `zajecia_id` INT NOT NULL,
  `imie` VARCHAR(30) NOT NULL,
  `email` VARCHAR(60) NOT NULL,
  `data_zapisu` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `zajecia_id` (`zajecia_id`),
  CONSTRAINT `zapisy_ibfk_1` FOREIGN KEY (`zajecia_id`) REFERENCES `zajecia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `zapisy` (`id`, `zajecia_id`, `imie`, `email`, `data_zapisu`) VALUES
(1, 4, 'Magda', 'magda@example.com', '2026-11-14 10:12:00'),
(2, 1, 'Paweł', 'pawel@example.com', '2026-11-15 18:40:00'),
(3, 6, 'Zosia', 'zosia@example.com', '2026-11-16 07:55:00');
