/*
  FICHEIRO: controllers/authController.js (VERSÃO FINAL E CORRETA)
  Contém apenas a lógica de login, sem funções de depuração.
*/
const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Encontrar o utilizador pelo email
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.ong_id, r.name as role 
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`, 
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    const user = users[0];

    // 2. Comparar a senha fornecida com o hash guardado no banco de dados
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    // 3. Se a autenticação for bem-sucedida, retorna os dados do utilizador
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ong_id: user.ong_id,
    });

  } catch (error) {
  console.error('ERRO DETALHADO NO LOGIN:', error); // << ADICIONE ESTA LINHA
  res.status(500).json({ error: error.message });
  }
};