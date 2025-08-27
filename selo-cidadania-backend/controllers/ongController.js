// controllers/ongController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Validação simples de e-mail
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Criar ONG com usuário responsável
const createOng = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      fantasy_name,
      corporate_name,
      cnpj,
      foundation_date,
      contact_email,
      phone,
      website,
      instagram,
      zip_code,
      address,
      address_number,
      district,
      city,
      state,
      country,
      responsible_name,
      responsible_email,
      responsible_password,
      responsible_cpf,
      responsible_rg,
      responsible_phone,
      responsible_birthdate,
    } = req.body;

    // Arquivos (logo, ata e estatuto)
    const logo_url = req.files?.logo_file ? `/uploads/${req.files.logo_file[0].filename}` : null;
    const ata_url = req.files?.ata_file ? `/uploads/${req.files.ata_file[0].filename}` : null;
    const statute_url = req.files?.statute_file ? `/uploads/${req.files.statute_file[0].filename}` : null;

    // Validações básicas
    if (!fantasy_name || !corporate_name || !cnpj || !foundation_date || !responsible_email || !responsible_password) {
      return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
    }

    if (!isValidEmail(responsible_email)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }

    if (responsible_password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    // Criação do usuário responsável
    const hashedPassword = await bcrypt.hash(responsible_password, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users 
        (name, email, password, cpf, rg, phone, birthdate, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'responsible', true)`,
      [responsible_name, responsible_email, hashedPassword, responsible_cpf, responsible_rg, responsible_phone, responsible_birthdate]
    );

    const responsible_user_id = userResult.insertId;

    // Criação da ONG
    const [ongResult] = await connection.query(
      `INSERT INTO ongs (
        fantasy_name, corporate_name, cnpj, foundation_date, 
        logo_url, ata_url, statute_url, contact_email, phone, website, instagram, 
        zip_code, address, address_number, district, city, state, country, responsible_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fantasy_name, corporate_name, cnpj, foundation_date,
        logo_url, ata_url, statute_url, contact_email, phone, website, instagram,
        zip_code, address, address_number, district, city, state, country, responsible_user_id
      ]
    );

    const ong_id = ongResult.insertId;

    // Vincula usuário responsável à ONG
    await connection.query(`UPDATE users SET ong_id = ? WHERE id = ?`, [ong_id, responsible_user_id]);

    await connection.commit();
    res.status(201).json({ message: "ONG criada com sucesso!", ong_id, responsible_user_id });
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email ou CPF já cadastrado." });
    }

    console.error("Erro ao criar ONG:", error);
    res.status(500).json({ error: "Erro ao criar ONG." });
  } finally {
    connection.release();
  }
};

// Listar ONGs
const getAllOngs = async (req, res) => {
  try {
    const [ongs] = await pool.query("SELECT * FROM ongs");
    res.json(ongs);
  } catch (error) {
    console.error("Erro ao buscar ONGs:", error);
    res.status(500).json({ error: "Erro ao buscar ONGs." });
  }
};

// Buscar ONG por ID
const getOngById = async (req, res) => {
  try {
    const [ongs] = await pool.query("SELECT * FROM ongs WHERE id = ?", [req.params.id]);
    if (ongs.length === 0) return res.status(404).json({ error: "ONG não encontrada." });
    res.json(ongs[0]);
  } catch (error) {
    console.error("Erro ao buscar ONG:", error);
    res.status(500).json({ error: "Erro ao buscar ONG." });
  }
};

// Buscar usuários de uma ONG
const getOngUsers = async (req, res) => {
  try {
    const { ongId } = req.params;
    const [users] = await pool.query(
      "SELECT id, name, email, role, balance FROM users WHERE ong_id = ?",
      [ongId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Nenhum usuário encontrado para esta ONG." });
    }

    res.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários da ONG:", error);
    res.status(500).json({ error: "Erro ao buscar usuários da ONG." });
  }
};

// Atualizar ONG
const updateOng = async (req, res) => {
  try {
    const updates = req.body;
    await pool.query("UPDATE ongs SET ? WHERE id = ?", [updates, req.params.id]);
    res.json({ message: "ONG atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar ONG:", error);
    res.status(500).json({ error: "Erro ao atualizar ONG." });
  }
};

// Excluir ONG
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
    res.status(500).json({ error: "Erro ao excluir ONG." });
  } finally {
    connection.release();
  }
};

// Debitar saldo do usuário
const debitUserBalance = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { userId, amount, reason } = req.body;
    const amountNum = Number(amount);

    if (!userId || !amountNum || !reason) {
      return res.status(400).json({ message: "ID do usuário, valor e motivo são obrigatórios." });
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "O valor a ser debitado deve ser um número positivo." });
    }

    const [user] = await connection.query("SELECT balance FROM users WHERE id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (user[0].balance < amountNum) {
      return res.status(400).json({ message: "Saldo insuficiente." });
    }

    await connection.query("UPDATE users SET balance = balance - ? WHERE id = ?", [amountNum, userId]);
    await connection.query(
      "INSERT INTO transactions (user_id, type, amount, reason) VALUES (?, 'debit', ?, ?)",
      [userId, amountNum, reason]
    );

    await connection.commit();
    res.json({ message: "Saldo debitado com sucesso!" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao debitar saldo:", error);
    res.status(500).json({ message: "Erro ao debitar saldo." });
  } finally {
    connection.release();
  }
};

// Exporta todas as funções em um único objeto
module.exports = {
  createOng,
  getAllOngs,
  getOngById,
  getOngUsers,
  updateOng,
  deleteOng,
  debitUserBalance,
};
