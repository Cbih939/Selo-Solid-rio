-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 08/08/2025 às 01:22
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `selo_cidadania_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `ongs`
--

CREATE TABLE `ongs` (
  `id` int(11) NOT NULL,
  `fantasy_name` varchar(255) NOT NULL,
  `corporate_name` varchar(255) NOT NULL,
  `cnpj` varchar(18) NOT NULL,
  `foundation_date` date DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `instagram` varchar(100) DEFAULT NULL,
  `zip_code` varchar(9) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL COMMENT 'Nome da Rua, Avenida, etc.',
  `address_number` varchar(20) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Brasil',
  `main_area` varchar(100) DEFAULT NULL,
  `target_audience` text DEFAULT NULL,
  `mission` text DEFAULT NULL,
  `responsible_user_id` int(11) NOT NULL COMMENT 'ID do utilizador responsável legal pela ONG',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `ongs`
--

INSERT INTO `ongs` (`id`, `fantasy_name`, `corporate_name`, `cnpj`, `foundation_date`, `logo_url`, `contact_email`, `phone`, `website`, `instagram`, `zip_code`, `address`, `address_number`, `district`, `city`, `state`, `country`, `main_area`, `target_audience`, `mission`, `responsible_user_id`, `created_at`) VALUES
(6, 'ONG Fantasia', 'ong fantasia de teste', '12345678912154', NULL, NULL, 'contato@ongteste.com.br', '11111144884', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', NULL, NULL, NULL, 39, '2025-08-07 14:21:01');

-- --------------------------------------------------------

--
-- Estrutura para tabela `prizes`
--

CREATE TABLE `prizes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cost` int(11) NOT NULL COMMENT 'Custo do prémio em selos',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `prizes`
--

INSERT INTO `prizes` (`id`, `name`, `cost`, `created_at`) VALUES
(6, 'Ingressos de Cinema', 50, '2025-08-07 16:30:58'),
(7, 'Caneta da ONG', 3, '2025-08-07 16:31:05'),
(8, 'Cesta básica', 400, '2025-08-07 16:31:14');

-- --------------------------------------------------------

--
-- Estrutura para tabela `proof_activities`
--

CREATE TABLE `proof_activities` (
  `id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `seal_value` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `proof_activities`
--

INSERT INTO `proof_activities` (`id`, `description`, `seal_value`) VALUES
(1, 'Participar da capacitação inicial do Programa Selo - Cidadania', 10),
(2, 'Matrícula ativa na escola (por aluno)', 5),
(3, 'Participar da reunião escolar de cada filho', 2),
(4, 'Manter carteira de vacinação ou pré-natal atualizada', 3),
(5, 'Participar em curso ou capacitação', 5),
(6, 'Participar de mutirão comunitário', 4),
(7, 'Manter os documentos regularizados da família', 2),
(8, 'Participar de Projeto de Reciclagem ou horta comunitária', 3),
(9, 'Participar de Grupo de escuta na ONG PARCEIRA', 5),
(10, 'Acompanhar familiar ou vizinho idoso em visita médica', 3),
(11, 'Cuidar de familiar idoso', 3),
(12, 'Levar filhos para passeios e lazer', 2),
(13, 'Participar das ações de voluntariado na escola dos filhos', 5),
(14, 'Acompanhar filhos em terapia com psicólogo', 2),
(15, 'Realizar comemoração de aniversários dos filhos', 5),
(16, 'Realizar ações voluntarias na comunidade', 5),
(17, 'Se inscrever e participar de ações voluntárias na ONG PARCEIRA', 5);

-- --------------------------------------------------------

--
-- Estrutura para tabela `redemptions`
--

CREATE TABLE `redemptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `prize_id` int(11) NOT NULL,
  `redemption_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL COMMENT 'Nome do perfil (ex: admin5, ong, user)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(2, 'admin1'),
(1, 'admin5'),
(3, 'ong'),
(4, 'user');

-- --------------------------------------------------------

--
-- Estrutura para tabela `social_proofs`
--

CREATE TABLE `social_proofs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ong_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `file_url` varchar(255) NOT NULL COMMENT 'URL do ficheiro de comprovativo',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `feedback_message` text DEFAULT NULL COMMENT 'Feedback da ONG sobre a prova social',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `activity_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `responsible_cpf` varchar(14) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `responsible_phone` varchar(20) DEFAULT NULL,
  `seal_balance` int(11) NOT NULL DEFAULT 0,
  `role_id` int(11) NOT NULL,
  `ong_id` int(11) DEFAULT NULL COMMENT 'ID da ONG à qual o utilizador está associado (se aplicável)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `cpf`, `responsible_cpf`, `phone`, `responsible_phone`, `seal_balance`, `role_id`, `ong_id`, `created_at`) VALUES
(14, 'Super Administrador', 'admin@selo.com', '$2b$10$L6XUaNXAceX6TVdnc1AG7ekRUALyUBGKfumaq2CdiIz6hyaeIqq5S', NULL, NULL, NULL, NULL, 0, 1, NULL, '2025-08-05 20:21:21'),
(39, 'jose do carmo', 'contato@josewalter.com', '$2b$10$WIu5maC20JSs7oKxE1NROuOiLtU59HJ9WTO0HufEjbHk72rGh7dK2', NULL, NULL, NULL, NULL, 0, 3, 6, '2025-08-07 14:21:01'),
(40, 'fulano de tal da silva santos', 'fulano@gmail.com', '$2b$10$qdmZfm7u2nngkIGiQk6DRO01e2jSkEFTpEEWZlF.7nrb/vp6XkeCG', '12345678900', NULL, '11111144884', NULL, 0, 4, 6, '2025-08-07 14:21:27'),
(42, 'seimonitai', 'itai.seimon@gmail.com', '$2b$10$YkdFmucW.3J2HpRJAJPjG.h4GH7fIlqprfa3h4G29l25yzmEinJ.S', '12345678901', NULL, '1199999999', NULL, 0, 4, 6, '2025-08-07 14:22:09'),
(43, 'admin1', 'admin1@selo.com', '$2b$10$ObXumhPxhNr1Y/DCQgpa9e9euaEdu.NW5HEzw0pZ0KocNikNuVY2u', NULL, NULL, NULL, NULL, 0, 2, NULL, '2025-08-07 16:30:06');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `ongs`
--
ALTER TABLE `ongs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cnpj` (`cnpj`),
  ADD UNIQUE KEY `uc_cnpj` (`cnpj`),
  ADD KEY `responsible_user_id` (`responsible_user_id`);

--
-- Índices de tabela `prizes`
--
ALTER TABLE `prizes`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `proof_activities`
--
ALTER TABLE `proof_activities`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `redemptions`
--
ALTER TABLE `redemptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `prize_id` (`prize_id`);

--
-- Índices de tabela `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Índices de tabela `social_proofs`
--
ALTER TABLE `social_proofs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ong_id` (`ong_id`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `cpf` (`cpf`),
  ADD UNIQUE KEY `responsible_cpf` (`responsible_cpf`),
  ADD UNIQUE KEY `uc_cpf` (`cpf`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `ong_id` (`ong_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `ongs`
--
ALTER TABLE `ongs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `prizes`
--
ALTER TABLE `prizes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `proof_activities`
--
ALTER TABLE `proof_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de tabela `redemptions`
--
ALTER TABLE `redemptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `social_proofs`
--
ALTER TABLE `social_proofs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `ongs`
--
ALTER TABLE `ongs`
  ADD CONSTRAINT `ongs_ibfk_1` FOREIGN KEY (`responsible_user_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `redemptions`
--
ALTER TABLE `redemptions`
  ADD CONSTRAINT `redemptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `redemptions_ibfk_2` FOREIGN KEY (`prize_id`) REFERENCES `prizes` (`id`);

--
-- Restrições para tabelas `social_proofs`
--
ALTER TABLE `social_proofs`
  ADD CONSTRAINT `social_proofs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `social_proofs_ibfk_2` FOREIGN KEY (`ong_id`) REFERENCES `ongs` (`id`);

--
-- Restrições para tabelas `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`ong_id`) REFERENCES `ongs` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
