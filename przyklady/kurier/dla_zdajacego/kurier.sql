-- Baza danych: `kurier` (arkusz ćwiczeniowy Kurier24)
-- Nazwa serwisu, artykuły i dane są wymyślone.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE `kategorie` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nazwa` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `kategorie` (`id`, `nazwa`) VALUES
(1, 'Polska'),
(2, 'Świat'),
(3, 'Biznes'),
(4, 'Sport'),
(5, 'Kultura'),
(6, 'Technologia'),
(7, 'Lifestyle');

CREATE TABLE `artykuly` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tytul` VARCHAR(100) NOT NULL,
  `zajawka` VARCHAR(200) NOT NULL,
  `opublikowano` DATETIME NOT NULL,
  `wyswietlenia` INT NOT NULL,
  `kategorie_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `kategorie_id` (`kategorie_id`),
  CONSTRAINT `artykuly_ibfk_1` FOREIGN KEY (`kategorie_id`) REFERENCES `kategorie` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `artykuly` (`id`, `tytul`, `zajawka`, `opublikowano`, `wyswietlenia`, `kategorie_id`) VALUES
(1, 'Jak przygotować dom na pierwsze mrozy', 'Uszczelnienie okien i przegląd pieca to podstawa.', '2026-11-15 07:30:00', 15840, 7),
(2, 'Inflacja w listopadzie niższa od prognoz', 'Analitycy zwracają uwagę na spadek cen żywności i energii.', '2026-11-17 08:40:00', 3120, 3),
(3, 'Wojewoda ostrzega przed gołoledzią na drogach regionu', 'Służby drogowe pracują od wczesnego rana.', '2026-11-17 10:42:00', 410, 1),
(4, 'Pięć błędów przy zakupie używanego auta', 'Na co zwrócić uwagę przed podpisaniem umowy.', '2026-11-14 12:15:00', 12210, 7),
(5, 'Ceny paliw spadły po raz trzeci z rzędu', 'Najtańszy olej napędowy kupimy na wschodzie kraju.', '2026-11-17 10:31:00', 980, 1),
(6, 'Polskie startupy z rekordowym finansowaniem', 'Inwestorzy coraz chętniej wspierają firmy z sektora zielonych technologii.', '2026-11-17 07:35:00', 2870, 3),
(7, 'Nowy rekord wypożyczeń w bibliotekach miejskich', 'Najczęściej wypożyczane są kryminały i reportaże.', '2026-11-17 10:15:00', 650, 5),
(8, 'Prognoza pogody na weekend: wraca słońce', 'Po pochmurnym tygodniu czeka nas pogodny weekend.', '2026-11-16 16:00:00', 9875, 1),
(9, 'Remont głównego dworca zakończy się wcześniej niż planowano', 'Nowa hala dworcowa zostanie otwarta w grudniu.', '2026-11-17 09:58:00', 1240, 1),
(10, 'Złoty umacnia się wobec euro', 'Kurs wspólnej waluty spadł do najniższego poziomu od wiosny.', '2026-11-16 18:10:00', 4100, 3),
(11, 'Naukowcy opisali nowy gatunek motyla w Puszczy Białowieskiej', 'Odkrycia dokonano podczas letnich badań terenowych.', '2026-11-17 09:40:00', 2350, 1),
(12, 'Test: który smartfon wybrać do 1500 zł', 'Porównaliśmy osiem modeli ze średniej półki.', '2026-11-13 09:00:00', 7430, 6),
(13, 'Eksport rolno-spożywczy rośnie drugi rok z rzędu', 'Największy wzrost odnotowano w produktach mlecznych i przetworach.', '2026-11-17 05:30:00', 1950, 3),
(14, 'Szkoły wprowadzają zajęcia z cyberbezpieczeństwa', 'Lekcje poprowadzą nauczyciele informatyki.', '2026-11-17 09:22:00', 1530, 6),
(15, 'Przepis na rozgrzewającą zupę dyniową', 'Wystarczy dynia, imbir i mleczko kokosowe.', '2026-11-12 11:45:00', 6120, 7);
