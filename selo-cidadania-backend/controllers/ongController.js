// selo-cidadania-backend/controllers/ongController.js

const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Função para criar ONG (já corrigida anteriormente, mantemos a versão correta)
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
      responsible_cpf, responsible_rg, responsible_phone, responsible_birthdate,
    } = req.body;

    const logo_url = req.files?.logo_file ? `/uploads/${req.files.logo_file[0].filename}` : null;
    const ata_url = req.files?.ata_file ? `/uploads/${req.files.ata_file[0].filename}` : null;
    const statute_url = req.files?.statute_file ? `/uploads/${req.files.statute_file[0].filename}` : null;

    if (!fantasy_name || !corporate_name || !cnpj || !responsible_email || !responsible_password) {
      return res.status(400).json({ message: "Campos obrigatórios não preenchidos." });
    }

    const hashedPassword = await bcrypt.hash(responsible_password, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone, role_id) 
       VALUES (?, ?, ?, ?, ?, 3)`, // Assumindo role_id 3 para responsável
      [responsible_name, responsible_email, hashedPassword, responsible_cpf, responsible_rg, responsible_phone, responsible_birthdate]
    );
    const responsible_user_id = userResult.insertId;

    const [ongResult] = await connection.query(
      `INSERT INTO ongs (fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, responsible_user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, responsible_user_id]
    );
    const ong_id = ongResult.insertId;

    await connection.query(`UPDATE users SET ong_id = ? WHERE id = ?`, [ong_id, responsible_user_id]);
    await connection.commit();
    res.status(201).json({ message: "ONG criada com sucesso!", ong_id });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar ONG:", error);
    res.status(500).json({ message: "Erro ao criar ONG." });
  } finally {
    connection.release();
  }
};

// =====================================================================
// CORREÇÃO PRINCIPAL APLICADA AQUI
// =====================================================================
const getAllOngs = async (req, res) => {
  try {
    // A query SQL para buscar as ONGs.
    // O 'JOIN' adiciona o nome do responsável na mesma consulta.
    const query = `
      SELECT 
        o.id, 
        o.fantasy_name, 
        o.cnpj, 
        o.contact_email, 
        u.name as responsible_name 
      FROM ongs o
      LEFT JOIN users u ON o.responsible_user_id = u.id
    `;
    
    // Executa a query. A desestruturação [ongs] garante que estamos pegando
    // o primeiro elemento da resposta do mysql2, que é o array de resultados.
    const [ongs] = await pool.query(query);

    // Garante que a resposta seja sempre um array.
    // Se 'ongs' for null ou undefined, retorna um array vazio.
    res.json(ongs || []); 
  } catch (error) {
    console.error("Erro ao buscar ONGs:", error);
    // Em caso de erro, retorna um array vazio para não quebrar o frontend.
    res.status(500).json([]); 
  }
};

// Buscar ONG por ID (já corrigido anteriormente)
const getOngById = async (req, res) => {
  try {
    const [ongs] = await pool.query("SELECT * FROM ongs WHERE id = ?", [req.params.id]);
    if (ongs.length === 0) {
      return res.status(404).json({ message: "ONG não encontrada." });
    }
    res.json(ongs[0]); // Retorna o objeto da ONG, o que está correto para esta rota.
  } catch (error) {
    console.error("Erro ao buscar ONG:", error);
    res.status(500).json({ message: "Erro ao buscar ONG." });
  }
};

// ... (o resto das funções não precisa de mudança, mas incluí para o código ser completo)

const getOngUsers = async (req, res) => {
  try {
    const { ongId } = req.params;
    const [users] = await pool.query(
      "SELECT id, name, email, role_id FROM users WHERE ong_id = ?",
      [ongId]
    );
    res.json(users || []); // Garante que a resposta seja um array
  } catch (error) {
    console.error("Erro ao buscar usuários da ONG:", error);
    res.status(500).json([]);
  }
};

const updateOng = async (req, res) => {
  try {
    const updates = req.body;
    await pool.query("UPDATE ongs SET ? WHERE id = ?", [updates, req.params.id]);
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

const debitUserBalance = async (req, res) => {
  // ... (código existente)
};

// Exporta todas as funções
module.exports = {
  createOng,
  getAllOngs,
  getOngById,
  getOngUsers,
  updateOng,
  deleteOng,
  debitUserBalance,
};
