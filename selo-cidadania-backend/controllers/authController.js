const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  try {
    let userQuery;
    let queryParams;

    if (loginIdentifier.includes('@')) {
      userQuery = `SELECT b.id, b.name, b.email, b.password_hash, b.ong_id, r.name as role 
                   FROM beneficiaries b JOIN roles r ON b.role_id = r.id WHERE b.email = ?`;
      queryParams = [loginIdentifier];
    } else {
      const cleanPhone = loginIdentifier.replace(/\D/g, '');
      userQuery = `SELECT b.id, b.name, b.email, b.password_hash, b.ong_id, r.name as role 
                   FROM beneficiaries b JOIN roles r ON b.role_id = r.id WHERE b.phone = ?`;
      queryParams = [cleanPhone];
    }

    const [users] = await db.query(userQuery, queryParams);

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ong_id: user.ong_id,
    });

  } catch (error) {
    console.error('Erro no processo de login:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};
