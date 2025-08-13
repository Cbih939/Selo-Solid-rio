const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.ong_id, r.name as role 
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`, 
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    const responseData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ong_id: user.ong_id,
    };

    //Se o utilizador for de uma ONG, busca o nome e o logotipo da ONG.
    if (user.role === 'ong' && user.ong_id) {
      const [ongs] = await db.query("SELECT fantasy_name, logo_url FROM ongs WHERE id = ?", [user.ong_id]);
      if (ongs.length > 0) {
        responseData.ong_name = ongs[0].fantasy_name;
        responseData.ong_logo_url = ongs[0].logo_url;
      }
    }

    res.status(200).json(responseData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};