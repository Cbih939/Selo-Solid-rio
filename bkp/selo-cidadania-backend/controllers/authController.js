const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.login = async (req, res) => {
  try {
    // Log 1: Início do processo e dados recebidos
    console.log(`[LOGIN] --- Início do Processo de Login ---`);
    const { loginIdentifier, password } = req.body;
    console.log(`[LOGIN] 1. Identificador recebido: [${loginIdentifier}]`);

    // Validação de entrada
    if (!loginIdentifier || !password) {
      console.log('[LOGIN] ERRO: Identificador de login ou senha não fornecidos.');
      return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
    }

    // Log 2: Preparação da query
    console.log('[LOGIN] 2. Preparando para buscar usuário no banco de dados...');
    const userQuery = `
      SELECT 
        u.id, u.name, u.email, u.password_hash, u.ong_id,
        r.name AS role
      FROM users AS u
      JOIN roles AS r ON u.role_id = r.id
      WHERE u.email = ?
    `;
    const queryParams = [loginIdentifier];

    // Execução da query
    const [users] = await db.query(userQuery, queryParams);
    console.log(`[LOGIN] 3. Query executada. Número de usuários encontrados: ${users.length}`);

    // Validação se o usuário existe
    if (users.length === 0) {
      console.log(`[LOGIN] ERRO: Usuário com identificador [${loginIdentifier}] não encontrado.`);
      // Nota: A mensagem de erro para o cliente é genérica por segurança.
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = users[0];
    console.log(`[LOGIN] 4. Usuário encontrado: ID [${user.id}], Role [${user.role}]`);

    // Log 3: Comparação de senha
    console.log('[LOGIN] 5. Comparando a senha fornecida com a hash do banco de dados...');
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // Validação da senha
    if (!isMatch) {
      console.log(`[LOGIN] ERRO: Senha incorreta para o usuário ID [${user.id}].`);
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    console.log('[LOGIN] 6. Senha correta. Preparando para gerar o token JWT.');

    // Log 4: Verificação da chave secreta do JWT
    if (!process.env.JWT_SECRET) {
        console.error('[LOGIN] ERRO FATAL: A variável de ambiente JWT_SECRET não está definida!');
        // Este é um erro crítico que precisa ser logado, mas não enviado ao cliente.
        throw new Error('A configuração do servidor está incompleta (JWT_SECRET ausente).');
    }
    console.log('[LOGIN] 7. Chave secreta JWT encontrada. Gerando token...');

    // Geração do Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('[LOGIN] 8. Token gerado com sucesso.');

    // Resposta final de sucesso
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
    // Este bloco 'catch' é a nossa ferramenta de diagnóstico mais importante.
    // Ele capturará qualquer erro que acontecer no bloco 'try'.
    console.error('!!!!!! [LOGIN] ERRO FATAL NO PROCESSO DE LOGIN !!!!!!');
    console.error(error); // Loga o objeto de erro completo para análise.
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};
