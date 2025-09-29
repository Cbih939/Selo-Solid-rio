const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.login = async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: "O campo de login e a senha são obrigatórios." });
  }

  try {
    // Query final e validada que une as tabelas 'users' e 'roles'
    const userQuery = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password_hash, 
        u.ong_id,
        r.name AS role
      FROM 
        users AS u
      JOIN 
        roles AS r ON u.role_id = r.id
      WHERE 
        u.email = ?
    `;
    
    const queryParams = [loginIdentifier];
    const [users] = await db.query(userQuery, queryParams);

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

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
