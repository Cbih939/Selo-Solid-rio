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

exports.createOng = async (req, res) => {
  const {
    fantasy_name, corporate_name, cnpj, contact_email, phone,
    responsible_name, responsible_email, responsible_password, responsible_cpf, responsible_phone
  } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(responsible_password, salt);
    
    // Insere o utilizador responsável com os novos campos
    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, password_hash, role_id, cpf, phone) VALUES (?, ?, ?, 3, ?, ?)",
      [responsible_name, responsible_email, password_hash, responsible_cpf, responsible_phone]
    );
    const responsibleUserId = userResult.insertId;

    // Insere a ONG
    const [ongResult] = await connection.query(
      "INSERT INTO ongs (fantasy_name, corporate_name, cnpj, contact_email, phone, responsible_user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [fantasy_name, corporate_name, cnpj, contact_email, phone, responsibleUserId]
    );
    const ongId = ongResult.insertId;

    await connection.query("UPDATE users SET ong_id = ? WHERE id = ?", [ongId, responsibleUserId]);
    await connection.commit();
    res.status(201).json({ message: "ONG criada com sucesso." });

  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('uc_cnpj')) {
        return res.status(409).json({ message: "Este CNPJ já está registado." });
      }
      if (error.message.includes('email')) {
        return res.status(409).json({ message: "O email do responsável já está a ser utilizado." });
      }
      if (error.message.includes('uc_cpf')) {
        return res.status(409).json({ message: "O CPF do responsável já está registado." });
      }
    }
    res.status(500).json({ error: error.message });
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