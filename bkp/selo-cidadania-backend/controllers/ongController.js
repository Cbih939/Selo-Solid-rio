const db = require('../config/db');
const bcrypt = require('bcryptjs');
// Opcional: Se você for deletar arquivos antigos, precisará dos módulos 'fs' e 'path'
// const fs = require('fs');
// const path = require('path');

// READ: Listar todas as ONGs
exports.getAllOngs = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT o.id, o.fantasy_name, o.cnpj, o.responsible_name, o.contact_email
      FROM ongs o
      WHERE o.fantasy_name LIKE ? OR o.responsible_name LIKE ? OR o.contact_email LIKE ?`;
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
        o.*,
        u.name AS coordinator_name, 
        u.email AS coordinator_email
      FROM ongs o
      LEFT JOIN users u ON o.responsible_user_id = u.id
      WHERE o.id = ?`;
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

// POST: Criar uma nova ONG
exports.createOng = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone,
      website, instagram, zip_code, address, address_number, district, city, state, country,
      president_name, president_cpf,
      responsible_name, responsible_cpf, responsible_email, responsible_phone, responsible_password
    } = req.body;

    if (!responsible_name || !responsible_cpf || !responsible_email || !responsible_password) {
      return res.status(400).json({ error: "Dados do Coordenador (Nome, CPF, E-mail, Senha) são obrigatórios." });
    }

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(responsible_password, salt);
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, responsible_cpf, responsible_phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`,
      [responsible_name, responsible_email, passwordHash, responsible_cpf, responsible_phone]
    );
    const new_user_id = userResult.insertId;

    const logo_file = req.files && req.files['logo_file'] ? req.files['logo_file'][0] : null;
    const ata_file = req.files && req.files['ata_file'] ? req.files['ata_file'][0] : null;
    const statute_file = req.files && req.files['statute_file'] ? req.files['statute_file'][0] : null;
    const logo_url = logo_file ? `/uploads/${logo_file.filename}` : null;
    const ata_url = ata_file ? `/uploads/${ata_file.filename}` : null;
    const statute_url = statute_file ? `/uploads/${statute_file.filename}` : null;

    const ongInsertQuery = `
      INSERT INTO ongs (
        fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url, 
        contact_email, phone, website, instagram, zip_code, address, address_number, 
        district, city, state, country, responsible_user_id, responsible_name, responsible_cpf
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const ongInsertValues = [
      fantasy_name, corporate_name, cnpj, foundation_date, logo_url, ata_url, statute_url,
      contact_email, phone, website, instagram, zip_code, address, address_number,
      district, city, state, country, new_user_id, president_name, president_cpf
    ];
    const [ongResult] = await connection.query(ongInsertQuery, ongInsertValues);
    const ong_id = ongResult.insertId;

    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ong_id, new_user_id]);
    await connection.commit();
    res.status(201).json({ message: "ONG e Coordenador criados com sucesso.", ongId: ong_id });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro detalhado ao criar ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor ao tentar criar a ONG.", details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// UPDATE: Editar os dados de uma ONG (COM LOG DE DEPURAÇÃO)
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [currentOngs] = await connection.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOngs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "ONG não encontrada." });
    }
    const currentOng = currentOngs[0];

    const new_logo_file = req.files && req.files['logo_file'] ? req.files['logo_file'][0] : null;
    const new_ata_file = req.files && req.files['ata_file'] ? req.files['ata_file'][0] : null;
    const new_statute_file = req.files && req.files['statute_file'] ? req.files['statute_file'][0] : null;

    const logo_url = new_logo_file ? `/uploads/${new_logo_file.filename}` : currentOng.logo_url;
    const ata_url = new_ata_file ? `/uploads/${new_ata_file.filename}` : currentOng.ata_url;
    const statute_url = new_statute_file ? `/uploads/${new_statute_file.filename}` : currentOng.statute_url;

    const {
      fantasy_name, corporate_name, cnpj, contact_email, phone,
      website, instagram, zip_code, address, address_number, district, city, state,
      responsible_name, responsible_cpf
    } = req.body;

    let { foundation_date } = req.body;
    if (foundation_date) {
      try {
        foundation_date = new Date(foundation_date).toISOString().split('T')[0];
      } catch (e) {
        console.error("Data de fundação inválida, será salva como nula:", foundation_date);
        foundation_date = null;
      }
    } else {
      foundation_date = null;
    }
    
    const updateQuery = `
      UPDATE ongs SET
        fantasy_name = ?, corporate_name = ?, cnpj = ?, foundation_date = ?,
        contact_email = ?, phone = ?, website = ?, instagram = ?,
        zip_code = ?, address = ?, address_number = ?, district = ?, city = ?, state = ?,
        responsible_name = ?, responsible_cpf = ?,
        logo_url = ?, ata_url = ?, statute_url = ?
      WHERE id = ?`;
    
    const updateValues = [
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, website, instagram,
      zip_code, address, address_number, district, city, state,
      responsible_name, responsible_cpf,
      logo_url, ata_url, statute_url,
      id
    ];

    // ===== LINHA DE LOG ESTRATÉGICO ADICIONADA AQUI =====
    console.log('--- DEBUG UPDATE ONG ---');
    console.log('ID da ONG:', id);
    console.log('Arquivos recebidos (req.files):', req.files);
    console.log('URL final da Logo:', logo_url);
    console.log('URL final da Ata:', ata_url);
    console.log('URL final do Estatuto:', statute_url);
    console.log('Valores que serão enviados para a query UPDATE:', updateValues);
    console.log('--- FIM DEBUG ---');
    // ====================================================

    await connection.query(updateQuery, updateValues);
    await connection.commit();
    res.status(200).json({ message: "ONG atualizada com sucesso." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro detalhado ao atualizar ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor ao tentar atualizar a ONG.", details: error.message });
  } finally {
    if (connection) connection.release();
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
  const ongId = req.user.ong_id;
  const { userId, amount, reason } = req.body;
  if (!userId || !amount || parseInt(amount, 10) <= 0) {
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
