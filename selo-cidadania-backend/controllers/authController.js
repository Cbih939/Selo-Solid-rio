const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Importa a conexão com o banco

exports.login = async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  try {
    // Query corrigida para usar a tabela 'users'
    const userQuery = `SELECT * FROM users WHERE email = ?`;
    const queryParams = [loginIdentifier];

    const [users] = await db.query(userQuery, queryParams);

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = users[0];

    // Compara a senha. Verifique se a coluna no seu banco é 'password' ou 'password_hash'
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Gera o Token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Resposta de sucesso
    res.status(200).json({
      message: "Login bem-sucedido!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ong_id: user.ong_id,
      }
    });

  } catch (error) {
    console.error('Erro no processo de login:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};
