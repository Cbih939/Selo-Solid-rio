-- Cadastro e Perfil Sociofamiliar + Triagem Socioeconômica (Programa Selo Cidadania)
-- Estas estruturas também são criadas automaticamente pelo backend na primeira utilização
-- (controllers/familyProfileController.js -> ensureTables). Este arquivo serve para
-- execução manual/documentação, se preferir aplicar antes do deploy.

CREATE TABLE IF NOT EXISTS family_profiles (
  user_id INT NOT NULL PRIMARY KEY,
  data LONGTEXT NOT NULL,
  declaration_accepted TINYINT(1) NOT NULL DEFAULT 0,
  photo_consent TINYINT(1) NOT NULL DEFAULT 0,
  reforma_interest TINYINT(1) NOT NULL DEFAULT 0,
  submitted_at DATETIME NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS family_profile_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(30) NOT NULL,          -- 'housing_photo' | 'document'
  subtype VARCHAR(80) NULL,
  file_name VARCHAR(255) NOT NULL,        -- salvo em private_uploads/family (fora da pasta pública)
  original_name VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  uploaded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fpf_user (user_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS socioeconomic_triages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  data LONGTEXT NOT NULL,
  total_score INT NOT NULL DEFAULT 0,
  classification VARCHAR(60) NULL,
  analyst_name VARCHAR(255) NULL,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_st_user (user_id)
) DEFAULT CHARSET=utf8mb4;

-- Composição familiar (executar apenas se as colunas ainda não existirem)
ALTER TABLE dependents ADD COLUMN works VARCHAR(10) NULL;
ALTER TABLE dependents ADD COLUMN studies VARCHAR(10) NULL;
ALTER TABLE dependents ADD COLUMN monthly_income DECIMAL(10,2) NULL;
