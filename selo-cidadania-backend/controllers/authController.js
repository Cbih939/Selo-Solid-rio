const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // <-- ESTA LINHA ESTAVA EM FALTA

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

exports.login = async (req, res) => {
 try {
  console.log(`[LOGIN] --- Início do Processo de Login ---`);
  const { loginIdentifier, password } = req.body;
  console.log(`[LOGIN] 1. Identificador recebido: [${loginIdentifier}]`);

  if (!loginIdentifier || !password) {
   return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  console.log('[LOGIN] 2. Preparando para buscar usuário no banco de dados...');
    // Query 100% limpa, sem espaços ou caracteres inválidos no início 
  const userQuery = `SELECT u.id, u.name, u.email, u.password_hash, u.ong_id, r.name AS role FROM users AS u JOIN roles AS r ON u.role_id = r.id WHERE u.email = ?`;
  
  const [users] = await db.query(userQuery, [loginIdentifier]);
  console.log(`[LOGIN] 3. Query executada. Número de usuários encontrados: ${users.length}`);

  if (users.length === 0) {
   // LOG DE AVISO (E-mail não encontrado)
   await registerSystemLog(null, null, loginIdentifier, "Falha de Autenticação", "Tentativa de login com e-mail não cadastrado no sistema.", "warning");
   return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const user = users[0];
  console.log(`[LOGIN] 4. Usuário encontrado: ID [${user.id}], Role [${user.role}]`);

  console.log('[LOGIN] 5. Comparando a senha fornecida com a hash do banco de dados...');
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
   // LOG DE AVISO (Senha incorreta)
   await registerSystemLog(user.id, user.ong_id, user.name, "Falha de Autenticação", "Tentativa de login com senha incorreta.", "warning");
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
  
  // LOG DE SUCESSO (Login efetuado)
  await registerSystemLog(user.id, user.ong_id, user.name, "Login Efetuado", `O utilizador (${user.role}) entrou no sistema com sucesso.`, "success");

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
  
  // LOG DE ERRO CRÍTICO (Tratamento para não quebrar caso falte dados do req.body)
  const ident = (req.body && req.body.loginIdentifier) ? req.body.loginIdentifier : 'Desconhecido';
  await registerSystemLog(null, null, ident, "Erro de Sistema no Login", `Falha técnica durante o login: ${error.message}`, "error");

  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
 }
};

// POST: Registrar novo usuário via link de convite da OSC
exports.registerViaInvite = async (req, res) => {
  try {
    const { name, email, password, phone, mothers_name, birth_date, gender, ong_id } = req.body;

    // Validações básicas
    if (!name || !email || !password || !ong_id) {
      return res.status(400).json({ error: "Nome, e-mail, senha e ONG são obrigatórios." });
    }

    // Verificar se o email já existe
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      // LOG DE AVISO (Tentativa de cadastro duplicado)
      await registerSystemLog(null, ong_id, name, "Cadastro Bloqueado", `Tentativa de registo com e-mail que já existe no banco: ${email}`, "warning");
      return res.status(400).json({ error: "Este e-mail já está cadastrado no sistema." });
    }

    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Inserir no banco de dados (role_id = 4 é o padrão para Beneficiários)
    const query = `
      INSERT INTO users 
      (name, email, password_hash, phone, mothers_name, birth_date, gender, ong_id, role_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4)
    `;

    const [result] = await db.query(query, [
      name, 
      email, 
      passwordHash, 
      phone || null, 
      mothers_name || null, 
      birth_date || null, 
      gender || null, 
      ong_id
    ]);

    // LOG DE SUCESSO (Novo beneficiário registado)
    await registerSystemLog(result.insertId, ong_id, name, "Novo Beneficiário", `Utilizador '${name}' (${email}) cadastrado com sucesso via link de convite.`, "success");

    res.status(201).json({ message: "Cadastro realizado com sucesso! Já pode fazer login." });

  } catch (error) {
    console.error("Erro no cadastro via convite:", error);
    
    // LOG DE ERRO CRÍTICO
    const attemptedName = (req.body && req.body.name) ? req.body.name : 'Anônimo';
    const attemptedOngId = (req.body && req.body.ong_id) ? req.body.ong_id : null;
    await registerSystemLog(null, attemptedOngId, attemptedName, "Erro Crítico de Cadastro", `Falha técnica ao tentar registrar via convite: ${error.message}`, "error");

    res.status(500).json({ error: "Erro interno ao realizar cadastro." });
  }
};