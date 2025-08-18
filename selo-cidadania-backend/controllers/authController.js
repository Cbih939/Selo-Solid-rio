exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.ong_id, r.name as role 
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`, 
      [email]
    );

    if (users.length === 0) {
      console.log(`DEBUG: Nenhum usuário encontrado para o email: ${email}`);
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    const user = users[0];

    // --- LOGS DE DEPURAÇÃO CRUCIAIS ---
    console.log(`DEBUG: Senha recebida do formulário: "${password}"`);
    console.log(`DEBUG: Hash recebido do banco de dados: "${user.password_hash}"`);
    // ------------------------------------

    const isMatch = await bcrypt.compare(password, user.password_hash);

    console.log(`DEBUG: Resultado da comparação bcrypt: ${isMatch}`); // Deve ser true

    if (!isMatch) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    // Se a autenticação for bem-sucedida, retorna os dados do utilizador
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ong_id: user.ong_id,
    });

  } catch (error) {
    console.error('ERRO DETALHADO NO LOGIN:', error);
    res.status(500).json({ error: error.message });
  }
};