-- Baza danych: `bazarek` (arkusz ćwiczeniowy Bazarek)
-- Nazwa serwisu, produkty i ceny są wymyślone.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE `producenci` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nazwa` VARCHAR(30) NOT NULL,
  `kraj` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `producenci` (`id`, `nazwa`, `kraj`) VALUES
(1, 'Nova', 'Polska'),
(2, 'Lumia', 'Finlandia'),
(3, 'Aero', 'Niemcy'),
(4, 'Titan', 'Korea'),
(5, 'Vega', 'Chiny'),
(6, 'Orion', 'Tajwan');

CREATE TABLE `oferty` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tytul` VARCHAR(60) NOT NULL,
  `cena` DECIMAL(7,2) NOT NULL,
  `stara_cena` DECIMAL(7,2) DEFAULT NULL,
  `gwiazdki` INT NOT NULL,
  `opinie` INT NOT NULL,
  `dostawa` VARCHAR(30) NOT NULL,
  `smart` TINYINT(1) NOT NULL,
  `okazja` TINYINT(1) NOT NULL,
  `producenci_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `producenci_id` (`producenci_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

INSERT INTO `oferty` (`id`, `tytul`, `cena`, `stara_cena`, `gwiazdki`, `opinie`, `dostawa`, `smart`, `okazja`, `producenci_id`) VALUES
(1, 'Smartfon Nova X12 128 GB czarny', 1299.00, 1499.00, 4, 128, 'Darmowa dostawa', 0, 1, 1),
(2, 'Smartfon Lumia Pro 256 GB niebieski', 2149.00, NULL, 5, 342, 'Darmowa dostawa', 1, 0, 2),
(3, 'Smartfon Aero S5 64 GB zielony', 599.00, 749.00, 4, 87, 'Darmowa dostawa', 0, 1, 3),
(4, 'Smartfon Titan 5G 512 GB grafit', 3499.00, NULL, 5, 51, 'Darmowa dostawa', 1, 0, 4),
(5, 'Smartfon Flip Mini 128 GB różowy', 1799.00, NULL, 4, 64, 'Dostawa od 12,99 zł', 0, 0, 1),
(6, 'Smartfon Basic 4 32 GB szary', 349.00, 399.00, 4, 212, 'Darmowa dostawa', 0, 1, 3),
(7, 'Smartfon Vega 8 256 GB fioletowy', 1549.00, NULL, 4, 176, 'Darmowa dostawa', 1, 0, 5),
(8, 'Smartfon Orion Lite 128 GB biały', 899.00, NULL, 4, 93, 'Dostawa od 9,99 zł', 0, 0, 6);

ALTER TABLE `producenci` MODIFY `id` INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
ALTER TABLE `oferty` MODIFY `id` INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
ALTER TABLE `oferty` ADD CONSTRAINT `fk_oferty_producenci` FOREIGN KEY (`producenci_id`) REFERENCES `producenci` (`id`);
