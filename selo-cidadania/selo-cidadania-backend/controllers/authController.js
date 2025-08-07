const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query(
      // Adiciona u.ong_id à query
      `SELECT u.id, u.name, u.email, u.password_hash, u.ong_id, r.name as role 
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`, 
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    // Adiciona o ong_id à resposta do login
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ong_id: user.ong_id, // Importante para o frontend saber qual ONG está logada
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};