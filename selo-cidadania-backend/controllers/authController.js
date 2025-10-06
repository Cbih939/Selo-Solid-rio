exports.login = async (req, res) => {
 try {
  console.log(`[LOGIN] --- Início do Processo de Login ---`);
  const { loginIdentifier, password } = req.body;
  console.log(`[LOGIN] 1. Identificador recebido: [${loginIdentifier}]`);

  if (!loginIdentifier || !password) {
   return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  console.log('[LOGIN] 2. Preparando para buscar usuário no banco de dados...');
    // Query 100% limpa, sem espaços ou caracteres inválidos no início .
  const userQuery = `SELECT u.id, u.name, u.email, u.password_hash, u.ong_id, r.name AS role FROM users AS u JOIN roles AS r ON u.role_id = r.id WHERE u.email = ?`;
  
  const [users] = await db.query(userQuery, [loginIdentifier]);
  console.log(`[LOGIN] 3. Query executada. Número de usuários encontrados: ${users.length}`);

  if (users.length === 0) {
   return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const user = users[0];
  console.log(`[LOGIN] 4. Usuário encontrado: ID [${user.id}], Role [${user.role}]`);

  console.log('[LOGIN] 5. Comparando a senha fornecida com a hash do banco de dados...');
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
   return res.status(401).json({ message: "Credenciais inválidas." });
  }

  console.log('[LOGIN] 6. Senha correta. Preparando para gerar o token JWT.');
  
  if (!process.env.JWT_SECRET) {
    console.error('[LOGIN] ERRO FATAL: A variável de ambiente JWT_SECRET não está definida!');
    throw new Error('A configuração do servidor está incompleta (JWT_SECRET ausente).');
  }
  console.log('[LOGIN] 7. Chave secreta JWT encontrada. Gerando token...');

  const token = jwt.sign(
   { id: user.id, role: user.role, ong_id: user.ong_id },
   process.env.JWT_SECRET,
   { expiresIn: '8h' }
  );

  console.log('[LOGIN] 8. Token gerado com sucesso.');
  console.log('[LOGIN] --- Fim do Processo de Login (SUCESSO) ---');
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
  console.error('!!!!!! [LOGIN] ERRO FATAL NO PROCESSO DE LOGIN !!!!!!');
  console.error(error);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
 }
};