const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todas as ONGs com os dados do responsável
exports.getAllOngs = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT 
          o.id, o.fantasy_name, o.cnpj, u.name AS responsible_name, 
          o.contact_email, o.phone
      FROM ongs o
      JOIN users u ON o.responsible_user_id = u.id
      WHERE 
          o.fantasy_name LIKE ? OR 
          u.name LIKE ? OR 
          o.contact_email LIKE ?
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ: Buscar uma ONG por ID
exports.getOngById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
          o.id, o.fantasy_name, o.corporate_name, o.cnpj, o.foundation_date,
          o.logo_url, o.ata_url, o.statute_url, o.contact_email, o.phone, o.website, o.instagram,
          o.zip_code, o.address, o.address_number, o.district, o.city, o.state, o.country,
          u.name AS responsible_name, u.email AS responsible_email, u.cpf AS responsible_cpf, u.phone AS responsible_phone
      FROM ongs o
      JOIN users u ON o.responsible_user_id = u.id
      WHERE o.id = ?
    `;
    const [ongs] = await db.query(query, [id]);
    if (ongs.length === 0) {
      return res.status(404).json({ message: "ONG não encontrada." });
    }
    res.status(200).json(ongs[0]);
  } catch (error) {
    console.error("Erro ao buscar ONG por ID:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor ao buscar a ONG." });
  }
};

// POST: Criar uma nova ONG e o seu utilizador responsável (LÓGICA FINAL)
exports.createOng = async (req, res) => {
  const connection = await db.getConnection();
  try {
    // Lógica de arquivos
    const logo_file = req.files && req.files['logo_file'] ? req.files['logo_file'][0] : null;
    const ata_file = req.files && req.files['ata_file'] ? req.files['ata_file'][0] : null;
    const statute_file = req.files && req.files['statute_file'] ? req.files['statute_file'][0] : null;
    const logo_url = logo_file ? `/uploads/${logo_file.filename}` : null;
    const ata_url = ata_file ? `/uploads/${ata_file.filename}` : null;
    const statute_url = statute_file ? `/uploads/${statute_file.filename}` : null;

    // Leitura explícita dos campos do req.body para evitar problemas com arrays
    const {
      fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone,
      website, instagram, zip_code, address, address_number, district, city, state, country
    } = req.body;

    // Leitura explícita dos dados do usuário a ser criado (Coordenador)
    const responsible_name = req.body.responsible_name;
    const responsible_cpf = req.body.responsible_cpf;
    const responsible_email = req.body.responsible_email;
    const responsible_phone = req.body.responsible_phone;
    const responsible_password = req.body.responsible_password;

    // Validação robusta
    if (!fantasy_name || !corporate_name || !cnpj) {
      return res.status(400).json({ error: "Campos da ONG (Nome Fantasia, Razão Social, CNPJ) são obrigatórios." });
    }
    if (!responsible_name || !responsible_cpf || !responsible_email || !responsible_password) {
      console.error('Validação falhou. Dados do responsável faltando:', { responsible_name, responsible_cpf, responsible_email, responsible_password: responsible_password ? '***' : 'NULO' });
      return res.status(400).json({ error: "Dados do Coordenador (Nome, CPF, E-mail, Senha) são obrigatórios." });
    }
    if (typeof responsible_password !== 'string' || responsible_password.length < 6) {
      return res.status(400).json({ error: "A senha do Coordenador deve ter pelo menos 6 caracteres." });
    }

    await connection.beginTransaction();

    // 1. Criar o usuário (Coordenador)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(responsible_password, salt);
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`,
      [responsible_name, responsible_email, passwordHash, responsible_cpf, responsible_phone]
    );
    const responsible_user_id = userResult.insertId;

    // 2. Criar a ONG vinculada ao usuário
    const [ongResult] = await connection.query(
      `INSERT INTO ongs (fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, responsible_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, responsible_user_id]
    );
    const ong_id = ongResult.insertId;

    // 3. Atualizar o usuário com o ID da ONG
    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ong_id, responsible_user_id]);

    await connection.commit();
    res.status(201).json({ message: "ONG e Coordenador criados com sucesso.", ongId: ong_id });

  } catch (error) {
    await connection.rollback();
    console.error("Erro detalhado ao criar ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor ao tentar criar a ONG.", details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// UPDATE: Editar os dados de uma ONG
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  const { fantasy_name, contact_email, phone } = req.body;
  try {
    const [result] = await db.query("UPDATE ongs SET fantasy_name = ?, contact_email = ?, phone = ? WHERE id = ?", [fantasy_name, contact_email, phone, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ONG não encontrada." });
    }
    res.status(200).json({ message: "ONG atualizada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Excluir uma ONG
exports.deleteOng = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("UPDATE users SET ong_id = NULL WHERE ong_id = ?", [id]);
    const [ongResult] = await connection.query("DELETE FROM ongs WHERE id = ?", [id]);
    if (ongResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "ONG não encontrada." });
    }
    await connection.commit();
    res.status(200).json({ message: "ONG excluída com sucesso." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// GET: Obter os utilizadores de uma ONG específica
exports.getOngUsers = async (req, res) => {
  const { ongId } = req.params;
  const searchTerm = req.query.search || '';
  try {
    const query = `SELECT id, name, email, seal_balance FROM users WHERE ong_id = ? AND role_id = 4 AND (name LIKE ? OR email LIKE ?)`;
    const [rows] = await db.query(query, [ongId, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Debitar o saldo de um usuário
exports.debitUserBalance = async (req, res) => {
  if (!req.user || !req.user.ong_id) {
    return res.status(401).json({ message: "Acesso não autorizado." });
  }
  const { ongId } = req.user;
  const { userId, amount, reason } = req.body;
  if (!userId || !amount || !reason || parseInt(amount, 10) <= 0) {
    return res.status(400).json({ message: "ID do usuário, motivo e um valor positivo são obrigatórios." });
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT id, seal_balance FROM users WHERE id = ? AND ong_id = ? FOR UPDATE', [userId, ongId]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Usuário não pertence a esta ONG." });
    }
    const user = users[0];
    if (user.seal_balance < amount) {
      await connection.rollback();
      return res.status(400).json({ message: "Saldo insuficiente." });
    }
    await connection.query('UPDATE users SET seal_balance = seal_balance - ? WHERE id = ?', [amount, userId]);
    await connection.query('INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, ?, ?, ?)', [userId, ongId, 'debit', amount, reason]);
    await connection.commit();
    res.status(200).json({ message: "Débito realizado com sucesso." });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao debitar saldo:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    connection.release();
  }
};
