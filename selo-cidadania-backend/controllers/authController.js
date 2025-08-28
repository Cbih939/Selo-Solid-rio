const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Garante que a conexão com o banco de dados seja importada

exports.login = async (req, res) => {
  const { loginIdentifier, password } = req.body;

  // 1. Validação de entrada
  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  try {
    // 2. Query corrigida para usar a tabela 'users' e selecionar as colunas corretas
    const userQuery = `SELECT id, name, email, password_hash, ong_id, role FROM users WHERE email = ?`;
    const queryParams = [loginIdentifier];

    const [users] = await db.query(userQuery, queryParams);

    // 3. Verifica se o usuário existe
    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = users[0];

    // 4. Compara a senha usando a coluna correta 'password_hash'
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // 5. Gera o Token JWT para autenticação
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, // Garanta que a variável JWT_SECRET existe no seu arquivo .env
      { expiresIn: '8h' }
    );

    // 6. Resposta de sucesso com a estrutura correta (incluindo o objeto 'user' com 'role')
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
    // Loga o erro real no servidor para facilitar futuras depurações
    console.error('Erro no processo de login:', error); 
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};
