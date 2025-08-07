-- SQL Script para limpar e popular o banco de dados com dados fictícios.
-- Base de dados: MySQL / MariaDB

-- Seleciona o banco de dados para uso.
USE selo_cidadania_db;

-- --- LIMPEZA DAS TABELAS ---
-- Desativa a verificação de chaves estrangeiras para permitir a exclusão em qualquer ordem.
SET FOREIGN_KEY_CHECKS = 0;

-- Limpa todas as tabelas para garantir um começo limpo.
TRUNCATE TABLE redemptions;
TRUNCATE TABLE social_proofs;
TRUNCATE TABLE users;
TRUNCATE TABLE ongs;
TRUNCATE TABLE roles;
TRUNCATE TABLE proof_activities;

-- Reativa a verificação de chaves estrangeiras.
SET FOREIGN_KEY_CHECKS = 1;


-- --- INSERÇÃO DE DADOS ---

-- 1. Insere os Perfis (Roles)
INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'admin5'),
(2, 'admin1'),
(3, 'ong'),
(4, 'user');

-- 2. Insere os Utilizadores
-- As senhas são 'admin123', 'ong123', 'user123' etc., encriptadas com bcrypt.
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `cpf`, `phone`, `seal_balance`, `role_id`, `ong_id`) VALUES
-- Admins
(1, 'Super Administrador', 'admin@selo.com', '$2a$10$fJ7E2b.JM1g8S.T4Vz5.U.Sj5J8i.g3q5e8Y6K/9i.z7K2o4b.g7O', NULL, NULL, 0, 1, NULL),
(2, 'Ana Costa (Admin)', 'admin1@selo.com', '$2a$10$gL3gS.l2gS.l2gS.l2gS.uG5j.gSg1.gSg1.gSg1.gSg1.gSg1', NULL, NULL, 0, 2, NULL),
-- Responsáveis pelas ONGs
(3, 'Mariana Silva', 'mariana.silva@ong.com', '$2a$10$hK4hK.hK4hK.hK4hK.hK4u.hK4hK.hK4hK.hK4hK.hK4hK.hK4', '111.111.111-11', '11911111111', 0, 3, 1),
(4, 'Carlos Pereira', 'carlos.pereira@ong.com', '$2a$10$iJ5iJ.iJ5iJ.iJ5iJ.iJ5u.iJ5iJ.iJ5iJ.iJ5iJ.iJ5iJ.iJ5', '222.222.222-22', '21922222222', 0, 3, 2),
-- Utilizadores Comuns
(5, 'João Silva', 'joao.silva@email.com', '$2a$10$jK6jK.jK6jK.jK6jK.jK6u.jK6jK.jK6jK.jK6jK.jK6jK.jK6', '333.333.333-33', '11933333333', 150, 4, 1),
(6, 'Beatriz Lima', 'beatriz.lima@email.com', '$2a$10$kL7kL.kL7kL.kL7kL.kL7u.kL7kL.kL7kL.kL7kL.kL7kL.kL7', '444.444.444-44', '21944444444', 75, 4, 2),
(7, 'Lucas Almeida', 'lucas.almeida@email.com', '$2a$10$lL8lL.lL8lL.lL8lL.lL8u.lL8lL.lL8lL.lL8lL.lL8lL.lL8', '555.555.555-55', '11955555555', 25, 4, 1);

-- 3. Insere as ONGs
INSERT INTO `ongs` (`id`, `fantasy_name`, `corporate_name`, `cnpj`, `foundation_date`, `contact_email`, `phone`, `responsible_user_id`) VALUES
(1, 'Criança Feliz', 'Associação Criança Feliz do Brasil', '11.222.333/0001-44', '2010-05-20', 'contato@criancafeliz.org', '1133334444', 3),
(2, 'Planeta Verde', 'Instituto Planeta Verde Sustentável', '44.555.666/0001-77', '2015-02-12', 'contato@planetaverde.org', '2155556666', 4);

-- 4. Insere as Atividades (proof_activities)
-- (O seu script de criação da tabela já faz isto, mas incluímos aqui para garantir)
INSERT INTO `proof_activities` (`description`, `seal_value`) VALUES
('Participar da capacitação inicial do Programa Selo - Cidadania', 10),
('Matrícula ativa na escola (por aluno)', 5),
('Participar da reunião escolar de cada filho', 2),
('Manter carteira de vacinação ou pré-natal atualizada', 3),
('Participar em curso ou capacitação', 5),
('Participar de mutirão comunitário', 4),
('Manter os documentos regularizados da família', 2),
('Participar de Projeto de Reciclagem ou horta comunitária', 3),
('Participar de Grupo de escuta na ONG PARCEIRA', 5),
('Acompanhar familiar ou vizinho idoso em visita médica', 3),
('Cuidar de familiar idoso', 3),
('Levar filhos para passeios e lazer', 2),
('Participar das ações de voluntariado na escola dos filhos', 5),
('Acompanhar filhos em terapia com psicólogo', 2),
('Realizar comemoração de aniversários dos filhos', 5),
('Realizar ações voluntarias na comunidade', 5),
('Se inscrever e participar de ações voluntárias na ONG PARCEIRA', 5);

-- 5. Insere as Provas Sociais (social_proofs)
INSERT INTO `social_proofs` (`user_id`, `ong_id`, `description`, `file_url`, `status`, `feedback_message`, `activity_id`) VALUES
-- Pendentes
(5, 1, 'Participei no mutirão de limpeza da praia no último fim de semana.', '/uploads/placeholder.jpg', 'pending', NULL, 6),
(6, 2, 'Levei o meu filho ao parque no domingo.', '/uploads/placeholder.jpg', 'pending', NULL, 12),
-- Aprovadas
(7, 1, 'Fiz a matrícula do meu filho na escola para o novo semestre.', '/uploads/placeholder.jpg', 'approved', 'Ótima iniciativa!', 2),
-- Rejeitadas
(5, 1, 'Fui à reunião da escola.', '/uploads/placeholder.jpg', 'rejected', 'Por favor, envie o comprovativo de presença da próxima vez.', 3);

-- 6. Insere os Prémios (prizes)
INSERT INTO `prizes` (`name`, `cost`) VALUES
('Ingresso de Cinema', 50),
('Vale-presente R$20', 100),
('Cesta Básica', 200),
('Kit de Material Escolar', 75);

-- 7. Insere os Resgates (redemptions)
-- (Simula que o utilizador João Silva já resgatou um prémio)
INSERT INTO `redemptions` (`user_id`, `prize_id`) VALUES
(5, 1);
