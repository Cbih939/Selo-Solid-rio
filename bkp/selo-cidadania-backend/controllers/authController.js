const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`\n--- [${new Date().toISOString()}] Tentativa de login para: ${email} ---`);

  try {
    // 1. Encontrar o utilizador pelo email
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.ong_id, r.name as role 
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`, 
      [email]
    );

    if (users.length === 0) {
      console.log(`DEBUG: Nenhum Beneficiário encontrado para o email: ${email}`);
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    const user = users[0];
    console.log(`DEBUG: Beneficiário encontrado no banco: ID=${user.id}, Nome=${user.name}`);

    // --- LOGS DE DEPURAÇÃO CRUCIAIS ---
    console.log(`DEBUG: Senha recebida do formulário: "${password}"`);
    console.log(`DEBUG: Hash recebido do banco de dados: "${user.password_hash}"`);
    // ------------------------------------

    const isMatch = await bcrypt.compare(password, user.password_hash);

    console.log(`DEBUG: Resultado da comparação bcrypt: ${isMatch}`); // Deve ser true

    if (!isMatch) {
      console.log(`DEBUG: A senha NÃO BATEU para o Beneficiário: ${email}`);
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    // 3. Se a autenticação for bem-sucedida, retorna os dados do utilizador
    console.log(`SUCESSO: Autenticação bem-sucedida para: ${email}`);
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ong_id: user.ong_id,
    });

  } catch (error) {
    console.error('ERRO FATAL NO LOGIN:', error);
    res.status(500).json({ error: error.message });
  }
};