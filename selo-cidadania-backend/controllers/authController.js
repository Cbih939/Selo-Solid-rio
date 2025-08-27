exports.login = async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  try {
    // --- CORREÇÃO PRINCIPAL AQUI ---
    // Assumindo que a tabela principal é 'users' e a de papéis é 'roles'.
    // Verifique se a sua tabela de usuários realmente tem a coluna 'role_id'.
    // Se a sua coluna de senha se chamar 'password', troque 'u.password' por 'u.password_hash'.
    const userQuery = `
      SELECT u.id, u.name, u.email, u.password, u.ong_id, u.role 
      FROM users u 
      WHERE u.email = ? OR u.phone = ?
    `;
    
    const cleanIdentifier = loginIdentifier.replace(/\D/g, '');
    const queryParams = [loginIdentifier, cleanIdentifier];

    const [users] = await db.query(userQuery, queryParams);

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = users[0];
    // Verifique se o nome da coluna da senha está correto (password ou password_hash)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // --- GERAÇÃO DO TOKEN JWT (ADICIONADO) ---
    // Você precisa do JWT para manter o usuário logado.
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET, // Garanta que JWT_SECRET está no seu .env
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: "Login bem-sucedido!",
      token, // Envia o token para o frontend
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ong_id: user.ong_id,
      }
    });

  } catch (error) {
    console.error('Erro no processo de login:', error); // Este log é crucial
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};
