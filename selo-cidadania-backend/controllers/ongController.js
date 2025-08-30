// selo-cidadania-backend/controllers/ongController.js

const pool = require("../config/db");
const bcrypt = require("bcrypt");

// =====================================================================
// CORREÇÃO 1: Ajuste na Query de Criação de Usuário
// A query SQL estava esperando mais valores do que os que foram fornecidos.
// Removi os campos extras (rg, birthdate) para alinhar com os parâmetros.
// =====================================================================
const createOng = async (req, res) => {
  console.log('DEBUG: Corpo da requisição em createOng:', req.body);
  console.log('DEBUG: Arquivos recebidos em createOng:', req.files);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, website, instagram, zip_code,
      address, address_number, district, city, state, country,
      responsible_name, responsible_email, responsible_password,
      responsible_cpf, responsible_phone,
    } = req.body;

    // Extrai os caminhos dos arquivos de forma segura
    const logo_url = req.files?.logo_file ? `/uploads/${req.files.logo_file[0].filename}` : null;
    const ata_url = req.files?.ata_file ? `/uploads/${req.files.ata_file[0].filename}` : null;
    const statute_url = req.files?.statute_file ? `/uploads/${req.files.statute_file[0].filename}` : null;

    if (!fantasy_name || !corporate_name || !cnpj || !responsible_email || !responsible_password) {
      await connection.rollback();
      return res.status(400).json({ message: "Campos obrigatórios não preenchidos." });
    }

    const hashedPassword = await bcrypt.hash(responsible_password, 10);
    
    // Query corrigida: Apenas os campos que realmente estamos passando
    const userInsertSql = `
      INSERT INTO users (name, email, password_hash, cpf, phone, role_id) 
      VALUES (?, ?, ?, ?, ?, 3)
    `;
    const [userResult] = await connection.query(userInsertSql, 
      [responsible_name, responsible_email, hashedPassword, responsible_cpf, responsible_phone]
    );
    const responsible_user_id = userResult.insertId;

    const ongInsertSql = `
      INSERT INTO ongs (fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, responsible_user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [ongResult] = await connection.query(ongInsertSql,
      [fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, responsible_user_id]
    );
    const ong_id = ongResult.insertId;

    await connection.query(`UPDATE users SET ong_id = ? WHERE id = ?`, [ong_id, responsible_user_id]);
    await connection.commit();
    res.status(201).json({ message: "ONG criada com sucesso!", ong_id });

  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar ONG:", error);
    // Retorna uma mensagem de erro mais específica se for um erro de duplicidade
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Erro de duplicidade: CNPJ, email ou CPF do responsável já cadastrado.' });
    }
    res.status(500).json({ message: "Erro interno ao criar a ONG." });
  } finally {
    connection.release();
  }
};

// =====================================================================
// CORREÇÃO 2: Função de Débito Robusta (debitUserBalance)
// Esta função foi criada para lidar com a operação de débito de forma segura,
// usando transações para evitar o travamento do servidor (erro 504).
// =====================================================================
const debitUserBalance = async (req, res) => {
  console.log('--- [debitUserBalance] Requisição Recebida ---');
  console.log('Corpo da Requisição:', req.body);
  
  const connection = await pool.getConnection();
  try {
    const { userId, amount, reason } = req.body;
    const numericUserId = parseInt(userId, 10);
    const debitAmount = parseInt(amount, 10);

    if (isNaN(numericUserId) || isNaN(debitAmount) || debitAmount <= 0) {
      return res.status(400).json({ message: "ID do usuário e valor do débito devem ser números positivos." });
    }
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: "O motivo do débito é obrigatório." });
    }

    await connection.beginTransaction();

    const [users] = await connection.query('SELECT seal_balance FROM users WHERE id = ? FOR UPDATE', [numericUserId]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Beneficiário não encontrado." });
    }

    const currentBalance = users[0].seal_balance;
    if (currentBalance < debitAmount) {
      await connection.rollback();
      return res.status(400).json({ message: "Saldo insuficiente para realizar o débito." });
    }

    await connection.query('UPDATE users SET seal_balance = seal_balance - ? WHERE id = ?', [debitAmount, numericUserId]);
    await connection.query('INSERT INTO seal_transactions (user_id, type, amount, reason) VALUES (?, ?, ?, ?)', [numericUserId, 'debit', debitAmount, reason]);
    
    await connection.commit();
    res.status(200).json({ message: 'Débito realizado com sucesso!' });

  } catch (error) {
    await connection.rollback();
    console.error("ERRO CRÍTICO AO DEBITAR SALDO:", error);
    res.status(500).json({ message: "Erro interno ao processar o débito.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};


// --- Funções existentes (sem necessidade de grandes mudanças) ---

const getAllOngs = async (req, res) => {
  try {
    const query = `
      SELECT o.id, o.fantasy_name, o.cnpj, o.contact_email, u.name as responsible_name 
      FROM ongs o LEFT JOIN users u ON o.responsible_user_id = u.id
    `;
    const [ongs] = await pool.query(query);
    res.json(ongs || []);
  } catch (error) {
    console.error("Erro ao buscar ONGs:", error);
    res.status(500).json([]);
  }
};

const getOngById = async (req, res) => {
  try {
    const [ongs] = await pool.query("SELECT * FROM ongs WHERE id = ?", [req.params.id]);
    if (ongs.length === 0) return res.status(404).json({ message: "ONG não encontrada." });
    res.json(ongs[0]);
  } catch (error) {
    console.error("Erro ao buscar ONG:", error);
    res.status(500).json({ message: "Erro ao buscar ONG." });
  }
};

const getOngUsers = async (req, res) => {
  try {
    const { ongId } = req.params;
    const [users] = await pool.query("SELECT id, name, email, seal_balance FROM users WHERE ong_id = ?", [ongId]);
    res.json(users || []);
  } catch (error) {
    console.error("Erro ao buscar usuários da ONG:", error);
    res.status(500).json([]);
  }
};

const updateOng = async (req, res) => {
  try {
    await pool.query("UPDATE ongs SET ? WHERE id = ?", [req.body, req.params.id]);
    res.json({ message: "ONG atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar ONG:", error);
    res.status(500).json({ message: "Erro ao atualizar ONG." });
  }
};

const deleteOng = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("UPDATE users SET ong_id = NULL WHERE ong_id = ?", [req.params.id]);
    await connection.query("DELETE FROM ongs WHERE id = ?", [req.params.id]);
    await connection.commit();
    res.json({ message: "ONG excluída com sucesso!" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao excluir ONG:", error);
    res.status(500).json({ message: "Erro ao excluir ONG." });
  } finally {
    connection.release();
  }
};

// Exporta todas as funções
module.exports = {
  createOng,
  getAllOngs,
  getOngById,
  getOngUsers,
  updateOng,
  deleteOng,
  debitUserBalance, // Garante que a nova função seja exportada
};
