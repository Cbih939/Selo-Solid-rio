-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS E TABELAS PARA O PROJETO SELO CIDADANIA
-- Autor: Gemini
-- Versão: 1.0

-- -----------------------------------------------------
-- Criação do Banco de Dados (Database)
-- -----------------------------------------------------
CREATE DATABASE IF NOT EXISTS `selo_cidadania` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `selo_cidadania`;

-- -----------------------------------------------------
-- Tabela: `admins`
-- Armazena os dados dos administradores (Nível 1 e 5).
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `senha_hash` VARCHAR(255) NOT NULL,
  `nivel` INT NOT NULL COMMENT 'Nível de permissão do admin (1 ou 5)',
  `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Tabela: `ongs`
-- Armazena os dados completos das ONGs cadastradas.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ongs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome_fantasia` VARCHAR(255) NOT NULL,
  `razao_social` VARCHAR(255) NULL,
  `cnpj` VARCHAR(18) NOT NULL,
  `data_fundacao` DATE NULL,
  `logotipo_url` VARCHAR(255) NULL,
  `email` VARCHAR(255) NOT NULL,
  `telefone` VARCHAR(20) NULL,
  `website` VARCHAR(255) NULL,
  `cep` VARCHAR(9) NULL,
  `endereco` VARCHAR(255) NULL,
  `area_atuacao` VARCHAR(100) NULL,
  `publico_alvo` VARCHAR(255) NULL,
  `missao` TEXT NULL,
  `responsavel_nome` VARCHAR(255) NOT NULL,
  `responsavel_cpf` VARCHAR(14) NULL,
  `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `cnpj_UNIQUE` (`cnpj` ASC)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Tabela: `usuarios`
-- Armazena os dados dos usuários finais (voluntários).
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `senha_hash` VARCHAR(255) NOT NULL,
  `cpf` VARCHAR(14) NULL,
  `saldo_selos` INT NOT NULL DEFAULT 0,
  `ong_id` INT NOT NULL,
  `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  INDEX `fk_usuarios_ongs_idx` (`ong_id` ASC),
  CONSTRAINT `fk_usuarios_ongs`
    FOREIGN KEY (`ong_id`)
    REFERENCES `selo_cidadania`.`ongs` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Tabela: `provas_sociais`
-- Armazena as provas sociais enviadas pelos usuários para validação.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `provas_sociais` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `tipo_acao` VARCHAR(255) NOT NULL,
  `caminho_arquivo` VARCHAR(255) NULL COMMENT 'Caminho para o arquivo de comprovante no servidor',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pendente' COMMENT 'Pendente, Aprovada, Rejeitada',
  `selos_atribuidos` INT NULL DEFAULT 0,
  `data_envio` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `data_aprovacao` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_provas_sociais_usuarios_idx` (`usuario_id` ASC),
  CONSTRAINT `fk_provas_sociais_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `selo_cidadania`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Tabela: `premios`
-- Armazena os prêmios disponíveis para resgate.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `premios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `custo_selos` INT NOT NULL,
  `instrucoes` TEXT NULL,
  `imagem_url` VARCHAR(255) NULL,
  `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Tabela: `resgates`
-- Registra o histórico de resgates de prêmios pelos usuários.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `resgates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `premio_id` INT NOT NULL,
  `custo_no_resgate` INT NOT NULL COMMENT 'Armazena o custo do prêmio no momento do resgate',
  `data_resgate` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_resgates_usuarios_idx` (`usuario_id` ASC),
  INDEX `fk_resgates_premios_idx` (`premio_id` ASC),
  CONSTRAINT `fk_resgates_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `selo_cidadania`.`usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_resgates_premios`
    FOREIGN KEY (`premio_id`)
    REFERENCES `selo_cidadania`.`premios` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

