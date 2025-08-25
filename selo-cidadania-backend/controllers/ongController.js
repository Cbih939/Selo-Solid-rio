const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todas as ONGs com os dados do responsável
exports.getAllOngs = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT 
          o.id, o.fantasy_name, o.cnpj, u.name AS responsible_name, 
          o.contact_email, o.phone
      FROM ongs o
      JOIN users u ON o.responsible_user_id = u.id
      WHERE 
          o.fantasy_name LIKE ? OR 
          u.name LIKE ? OR 
          o.contact_email LIKE ?
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Criar uma nova ONG e o seu utilizador responsável
exports.createOng = async (req, res) => {
  const {
    fantasy_name, corporate_name, cnpj, foundation_date,
    contact_email, phone, website, instagram, zip_code, address,
    address_number, district, city, state, country, main_area,
    target_audience, mission,
    // Dados do utilizador responsável
    responsible_name, responsible_cpf, responsible_email,
    responsible_phone, responsible_password
  } = req.body;

  // O multer coloca a informação do ficheiro em req.file. 
  const logo_url = req.file ? `/uploads/${req.file.filename}` : null;

  // 🔍 Validação de campos obrigatórios
  if (!fantasy_name || !corporate_name || !cnpj || !foundation_date || !contact_email) {
    return res.status(400).json({ error: "Campos da ONG obrigatórios estão faltando." });
  }

  if (!responsible_name || !responsible_cpf || !responsible_email || !responsible_phone || !responsible_password) {
    return res.status(400).json({ error: "Dados do responsável são obrigatórios." });
  }

  if (typeof responsible_password !== "string" || responsible_password.length < 6) {
    return res.status(400).json({ error: "A senha do responsável deve ter pelo menos 6 caracteres." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Criar o utilizador responsável primeiro
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(responsible_password, salt);

    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`,
      [responsible_name, responsible_email, passwordHash, responsible_cpf, responsible_phone]
    );

    const responsible_user_id = userResult.insertId;

    // 2. Criar a ONG vinculada ao utilizador
    const [ongResult] = await connection.query(
      `INSERT INTO ongs (fantasy_name, corporate_name, cnpj, foundation_date, logo_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, main_area, target_audience, mission, responsible_user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fantasy_name, corporate_name, cnpj, foundation_date, logo_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, main_area, target_audience, mission, responsible_user_id]
    );

    // 3. Atualiza o usuário com o ong_id criado
    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ongResult.insertId, responsible_user_id]);

    await connection.commit();
    res.status(201).json({ message: "ONG e utilizador responsável criados com sucesso." });

  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor ao tentar criar a ONG." });
  } finally {
    connection.release();
  }
};

// UPDATE: Editar os dados de uma ONG
exports.updateOng = async (req, res) => {
    const { id } = req.params;
    const { fantasy_name, contact_email, phone } = req.body;
    try {
        const [result] = await db.query(
            "UPDATE ongs SET fantasy_name = ?, contact_email = ?, phone = ? WHERE id = ?",
            [fantasy_name, contact_email, phone, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ONG não encontrada." });
        }
        res.status(200).json({ message: "ONG atualizada com sucesso." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE: Excluir uma ONG
exports.deleteOng = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("UPDATE users SET ong_id = NULL WHERE ong_id = ?", [id]);
        const [ongResult] = await connection.query("DELETE FROM ongs WHERE id = ?", [id]);
        if (ongResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "ONG não encontrada." });
        }
        await connection.commit();
        res.status(200).json({ message: "ONG excluída com sucesso." });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// GET: Obter os utilizadores de uma ONG específica
exports.getOngUsers = async (req, res) => {
  const { ongId } = req.params;
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT id, name, email, seal_balance 
      FROM users 
      WHERE ong_id = ? AND role_id = 4 AND (name LIKE ? OR email LIKE ?)
    `;
    const [rows] = await db.query(query, [ongId, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};