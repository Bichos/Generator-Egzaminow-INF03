-- Baza danych: `biblioteka` (arkusz projektowy Biblioteka szkolna)
-- Czytelnicy i wypożyczenia są wymyśleni; numery ISBN są przykładowe (z poprawną sumą kontrolną).

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE `kategorie` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nazwa` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `kategorie` (`id`, `nazwa`) VALUES
(1, 'Lektury'),
(2, 'Fantastyka'),
(3, 'Kryminał'),
(4, 'Popularnonaukowe'),
(5, 'Informatyka');

CREATE TABLE `ksiazki` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tytul` VARCHAR(80) NOT NULL,
  `autor` VARCHAR(50) NOT NULL,
  `rok_wydania` INT NOT NULL,
  `isbn` CHAR(13) NOT NULL,
  `egzemplarze` INT NOT NULL,
  `kategorie_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `kategorie_id` (`kategorie_id`),
  CONSTRAINT `ksiazki_ibfk_1` FOREIGN KEY (`kategorie_id`) REFERENCES `kategorie` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `ksiazki` (`id`, `tytul`, `autor`, `rok_wydania`, `isbn`, `egzemplarze`, `kategorie_id`) VALUES
(1, 'Pan Tadeusz', 'Adam Mickiewicz', 1834, '9788333698026', 3, 1),
(2, 'Lalka', 'Bolesław Prus', 1890, '9788370982638', 3, 1),
(3, 'Kamienie na szaniec', 'Aleksander Kamiński', 1943, '9788363032234', 4, 1),
(4, 'Quo vadis', 'Henryk Sienkiewicz', 1896, '9788397653900', 2, 1),
(5, 'Hobbit, czyli tam i z powrotem', 'J.R.R. Tolkien', 1937, '9788304881808', 2, 2),
(6, 'Wiedźmin. Ostatnie życzenie', 'Andrzej Sapkowski', 1993, '9788307985565', 2, 2),
(7, 'Morderstwo w Orient Expressie', 'Agatha Christie', 1934, '9788363043964', 1, 3),
(8, 'Krótka historia czasu', 'Stephen Hawking', 1988, '9788369820118', 1, 4),
(9, 'Czysty kod', 'Robert C. Martin', 2008, '9788328800632', 2, 5),
(10, 'Python. Wprowadzenie', 'Mark Lutz', 2013, '9788359185166', 1, 5);

CREATE TABLE `czytelnicy` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `imie` VARCHAR(30) NOT NULL,
  `nazwisko` VARCHAR(30) NOT NULL,
  `klasa` VARCHAR(5) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `czytelnicy` (`id`, `imie`, `nazwisko`, `klasa`) VALUES
(1, 'Julia', 'Nowak', '2TI'),
(2, 'Kacper', 'Wiśniewski', '3TI'),
(3, 'Amelia', 'Wójcik', '1TP'),
(4, 'Szymon', 'Kamiński', '2TI'),
(5, 'Lena', 'Zielińska', '4TI'),
(6, 'Filip', 'Szymański', '1TP');

CREATE TABLE `wypozyczenia` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ksiazki_id` INT NOT NULL,
  `czytelnicy_id` INT NOT NULL,
  `data_wypozyczenia` DATE NOT NULL,
  `data_zwrotu` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ksiazki_id` (`ksiazki_id`),
  KEY `czytelnicy_id` (`czytelnicy_id`),
  CONSTRAINT `wypozyczenia_ibfk_1` FOREIGN KEY (`ksiazki_id`) REFERENCES `ksiazki` (`id`),
  CONSTRAINT `wypozyczenia_ibfk_2` FOREIGN KEY (`czytelnicy_id`) REFERENCES `czytelnicy` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `wypozyczenia` (`id`, `ksiazki_id`, `czytelnicy_id`, `data_wypozyczenia`, `data_zwrotu`) VALUES
(1, 1, 3, '2026-09-15', '2026-09-29'),
(2, 2, 5, '2026-10-01', '2026-10-20'),
(3, 5, 2, '2026-10-20', NULL),
(4, 7, 4, '2026-10-30', NULL),
(5, 1, 1, '2026-11-10', NULL),
(6, 5, 6, '2026-11-14', NULL),
(7, 9, 2, '2026-11-12', NULL),
(8, 3, 3, '2026-10-05', '2026-10-16'),
(9, 6, 1, '2026-10-08', '2026-10-27'),
(10, 2, 4, '2026-10-26', NULL),
(11, 10, 5, '2026-11-03', '2026-11-13');
