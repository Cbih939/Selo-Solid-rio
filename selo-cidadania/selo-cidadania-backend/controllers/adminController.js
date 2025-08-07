const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todos os Admins Nv.1
exports.getAllAdmins = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT id, name, email 
      FROM users 
      WHERE role_id = 2 AND (name LIKE ? OR email LIKE ?)
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE: Cadastrar um novo Admin Nv.1
exports.createAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const role_id = 2;
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
      [name, email, password_hash, role_id]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Este email já está a ser utilizado." });
    }
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Editar os dados de um Admin Nv.1
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ? AND role_id = 2",
      [name, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin não encontrado ou não é Nível 1." });
    }
    res.status(200).json({ id, name, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Excluir um Admin Nv.1
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ? AND role_id = 2", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin não encontrado ou não é Nível 1." });
    }
    res.status(200).json({ message: "Admin excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};