// Cole este código substituindo a sua função exports.login inteira

const jwt = require('jsonwebtoken'); // Certifique-se que o jsonwebtoken está importado no topo do arquivo
const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  try {
    // --- QUERY CORRIGIDA ---
    // Trocamos 'beneficiaries' por 'users' e simplificamos a busca.
    // Verifique se os nomes das colunas (password, role) estão corretos.
    const userQuery = `SELECT * FROM users WHERE email = ?`;
    const queryParams = [loginIdentifier];

    const [users] = await db.query(userQuery, queryParams);

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = users[0];

    // Compara a senha enviada com a senha no banco (user.password)
    // Se sua coluna se chamar 'password_hash', troque user.password por user.password_hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Gera o Token JWT para autenticação
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, // Garanta que JWT_SECRET está no seu arquivo .env
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
