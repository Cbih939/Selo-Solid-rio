const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todos os utilizadores comuns (role_id = 4)
exports.getAllUsers = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT id, name, email, seal_balance 
      FROM users 
      WHERE role_id = 4 AND (name LIKE ? OR email LIKE ?)
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, cpf, phone, password, ong_id } = req.body;
  
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || 'senha_padrao', salt);
    const role_id = 4;

    await db.query(
      "INSERT INTO users (name, email, cpf, phone, password_hash, role_id, ong_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, cpf, phone, password_hash, role_id, ong_id || null]
    );
    res.status(201).json({ message: "Utilizador criado com sucesso." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('uc_cpf')) {
        return res.status(409).json({ message: "Este CPF já está registado." });
      }
      if (error.message.includes('email')) {
        return res.status(409).json({ message: "Este email já está a ser utilizado." });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter o perfil detalhado de um utilizador
exports.getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await db.query(
      "SELECT u.id, u.name, u.email, u.cpf, u.phone, r.name as role, u.ong_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    const userProfile = users[0];

    if (userProfile.role === 'ong' && userProfile.ong_id) {
      const [ongs] = await db.query("SELECT * FROM ongs WHERE id = ?", [userProfile.ong_id]);
      if (ongs.length > 0) {
        userProfile.ong_details = ongs[0];
      }
    }
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Atualizar o perfil de um utilizador (usado pela página de perfil)
exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, ong_details } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
      [name, email, phone, id]
    );

    if (ong_details) {
      await connection.query(
        `UPDATE ongs SET 
          fantasy_name = ?, corporate_name = ?, contact_email = ?, phone = ?, website = ?, instagram = ?,
          address = ?, address_number = ?, district = ?, city = ?, state = ?, country = ?,
          main_area = ?, target_audience = ?, mission = ?
         WHERE id = ?`,
        [
          ong_details.fantasy_name, ong_details.corporate_name, ong_details.contact_email, ong_details.phone, ong_details.website, ong_details.instagram,
          ong_details.address, ong_details.address_number, ong_details.district, ong_details.city, ong_details.state, ong_details.country,
          ong_details.main_area, ong_details.target_audience, ong_details.mission,
          ong_details.id
        ]
      );
    }
    await connection.commit();
    res.status(200).json({ message: "Perfil atualizado com sucesso." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// UPDATE: Atualizar dados básicos de um utilizador (usado pela lista de admins)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json({ message: "Utilizador atualizado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter o saldo de selos de um utilizador específico (NOVO)
exports.getUserBalance = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT seal_balance FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json(rows[0]); // Retorna o objeto { seal_balance: valor }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Excluir um utilizador comum
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      "DELETE FROM users WHERE id = ? AND role_id = 4", 
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Utilizador não encontrado ou não é um utilizador comum." });
    }
    await connection.commit();
    res.status(200).json({ message: "Utilizador excluído com sucesso." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};