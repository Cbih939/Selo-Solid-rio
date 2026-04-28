// Arquivo: selo-cidadania-backend/controllers/ongController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Função para salvar arquivo Base64
const saveBase64File = (base64String, fileType) => {
    if (!base64String) return null;
    try {
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const fileExtension = matches[1].split('/')[1];
        const fileBuffer = Buffer.from(matches[2], 'base64');
        const filename = `${fileType}-${Date.now()}.${fileExtension}`;
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, fileBuffer);

        return `/uploads/${filename}`;
    } catch (error) {
        console.error('Erro ao salvar arquivo Base64:', error);
        return null;
    }
};

// Função utilitária para formatar a data
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// READ: Listar todas as ONGs (Agora inclui a coluna parent_ong_id)
exports.getAllOngs = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT o.id, o.fantasy_name, o.cnpj, o.responsible_name, o.contact_email, o.phone, o.parent_ong_id 
      FROM ongs o 
      WHERE o.fantasy_name LIKE ? OR o.responsible_name LIKE ? OR o.contact_email LIKE ?
      ORDER BY o.fantasy_name ASC
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar ONGs:', error);
    res.status(500).json({ error: error.message });
  }
};

// READ: Buscar uma ONG por ID
exports.getOngById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ongs WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'ONG não encontrada.' });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE: Criar uma nova ONG
exports.createOng = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, whatsapp, website, instagram, facebook, drive_link,
      zip_code, address, address_number, district, city, state, country,
      president_name, president_cpf,
      responsible_name, responsible_cpf, responsible_email, responsible_phone, responsible_password,
      parent_ong_id // NOVO CAMPO: Recebe do body
    } = req.body;

    if (!responsible_name || !responsible_cpf || !responsible_email || !responsible_password) {
      return res.status(400).json({ error: "Dados do Coordenador são obrigatórios." });
    }

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(responsible_password, salt);
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`,
      [responsible_name, responsible_email, passwordHash, responsible_cpf, responsible_phone]
    );
    const responsible_user_id = userResult.insertId;

    const logo_url = req.body.logo_base64 ? saveBase64File(req.body.logo_base64, 'logo') : null;
    const ata_url = req.body.ata_base64 ? saveBase64File(req.body.ata_base64, 'ata') : null;
    const statute_url = req.body.statute_base64 ? saveBase64File(req.body.statute_base64, 'statute') : null;
    const formattedDate = formatDate(foundation_date);

    // Ajusta o parent_ong_id para null se vier vazio
    const finalParentId = parent_ong_id ? parent_ong_id : null;

    const [ongResult] = await connection.query(
      `INSERT INTO ongs 
      (fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone, whatsapp, website, instagram, facebook, drive_link, zip_code, address, address_number, district, city, state, country, responsible_name, responsible_cpf, responsible_user_id, logo_url, ata_url, statute_url, parent_ong_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fantasy_name, corporate_name, cnpj, formattedDate, contact_email, phone, whatsapp || null, website || null, instagram || null, facebook || null, drive_link || null, zip_code, address, address_number, district, city, state, country, president_name, president_cpf, responsible_user_id, logo_url, ata_url, statute_url, finalParentId]
    );
    const ong_id = ongResult.insertId;

    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ong_id, responsible_user_id]);

    await connection.commit();
    res.status(201).json({ message: "ONG e usuário responsável criados com sucesso." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro detalhado ao criar ONG:", error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Já existe uma instituição cadastrada com este CNPJ ou E-mail.' });
    }
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    if (connection) connection.release();
  }
};

// UPDATE: Atualização Blindada
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  try {
    const [currentOngRows] = await db.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOngRows.length === 0) return res.status(404).json({ message: "ONG não encontrada." });
    const currentOng = currentOngRows[0];

    const dataToUpdate = { ...req.body };

    const forbiddenFields = [
        'id', 'created_at', 'updated_at', 'responsible_user_id',
        'logo_base64', 'ata_base64', 'statute_base64', 'logo_file', 'ata_file', 'statute_file',
        'responsible_email', 'responsible_phone', 'main_area', 'target_audience', 'mission'
    ];

    forbiddenFields.forEach(field => delete dataToUpdate[field]);

    dataToUpdate.logo_url = req.body.logo_base64 ? saveBase64File(req.body.logo_base64, 'logo') : currentOng.logo_url;
    dataToUpdate.ata_url = req.body.ata_base64 ? saveBase64File(req.body.ata_base64, 'ata') : currentOng.ata_url;
    dataToUpdate.statute_url = req.body.statute_base64 ? saveBase64File(req.body.statute_base64, 'statute') : currentOng.statute_url;
    
    if (dataToUpdate.foundation_date) {
        dataToUpdate.foundation_date = formatDate(dataToUpdate.foundation_date);
    }

    // Tratamento seguro do parent_ong_id para o update
    if (dataToUpdate.parent_ong_id !== undefined) {
        dataToUpdate.parent_ong_id = dataToUpdate.parent_ong_id === '' || dataToUpdate.parent_ong_id === null ? null : dataToUpdate.parent_ong_id;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "Nenhum dado válido para atualização." });
    }

    const [result] = await db.query('UPDATE ongs SET ? WHERE id = ?', [dataToUpdate, id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ message: "Nenhuma ONG atualizada." });

    res.status(200).json({ message: "ONG atualizada com sucesso." });
  } catch (error) {
    console.error(`[UPDATE ONG ID: ${id}] Erro:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'CNPJ ou E-mail já em uso por outra instituição.' });
    }
    res.status(500).json({ error: 'Erro interno ao atualizar ONG.' });
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
    if (connection) await connection.rollback();
    // Proteção caso tenha filiais
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'Não é possível excluir esta OSC pois existem filiais ou utilizadores associados a ela.' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Demais funções inalteradas...
exports.getOngUsers = async (req, res) => {
  const { ongId } = req.params;
  const searchTerm = req.query.search || '';
  try {
    const query = `SELECT id, name, email, cpf, seal_balance FROM users WHERE ong_id = ? AND role_id = 4 AND (name LIKE ? OR email LIKE ? OR cpf LIKE ?)`;
    const [rows] = await db.query(query, [ongId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Ocorreu um erro no servidor ao buscar os usuários." });
  }
};

exports.debitUserBalance = async (req, res) => {
  const ongId = req.user?.ong_id; 
  const { userId, amount, reason } = req.body;

  if (!userId || !amount || !reason || amount <= 0) {
    return res.status(400).json({ message: "ID do usuário, valor positivo e motivo são obrigatórios." });
  }
  if (!ongId) {
    return res.status(403).json({ message: "Apenas um coordenador de ONG pode realizar esta operação." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT id, seal_balance FROM users WHERE id = ? AND ong_id = ? FOR UPDATE', [userId, ongId]);
    
    if (users.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Operação não permitida. O usuário não pertence a esta ONG." });
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
    if (connection) await connection.rollback();
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    if (connection) connection.release();
  }
};

exports.getOngAdmins = async (req, res) => {
  const { id } = req.params; 
  try {
    const [admins] = await db.query("SELECT id, name, email, cpf, phone, created_at FROM users WHERE ong_id = ? AND role_id = 3", [id]);
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar administradores." });
  }
};

exports.addOngAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, cpf, phone, password } = req.body;

  if (!name || !email || !password || !cpf) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existingAdmins] = await connection.query("SELECT COUNT(id) as count FROM users WHERE ong_id = ? AND role_id = 3", [id]);

    if (existingAdmins[0].count >= 5) {
      await connection.rollback();
      return res.status(400).json({ message: "Limite máximo de 5 administradores atingido." });
    }

    const [userExists] = await connection.query("SELECT id FROM users WHERE email = ? OR cpf = ?", [email, cpf]);
    if (userExists.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "E-mail ou CPF já cadastrados." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await connection.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone, role_id, ong_id) VALUES (?, ?, ?, ?, ?, 3, ?)`,
      [name, email, passwordHash, cpf, phone, id]
    );

    await connection.commit();
    res.status(201).json({ message: "Novo administrador adicionado com sucesso!" });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: "Erro interno ao adicionar administrador." });
  } finally {
    if (connection) connection.release();
  }
};

exports.removeOngAdmin = async (req, res) => {
  const { id, userId } = req.params;
  const requestingUserId = req.user.id;

  if (parseInt(userId) === requestingUserId) {
    return res.status(400).json({ message: "Você não pode excluir a si mesmo." });
  }

  try {
    const [user] = await db.query("SELECT id FROM users WHERE id = ? AND ong_id = ?", [userId, id]);
    if (user.length === 0) return res.status(404).json({ message: "Administrador não encontrado." });

    const [countResult] = await db.query("SELECT COUNT(id) as count FROM users WHERE ong_id = ? AND role_id = 3", [id]);
    if (countResult[0].count <= 1) return res.status(400).json({ message: "A ONG precisa ter pelo menos um administrador." });

    await db.query("DELETE FROM users WHERE id = ?", [userId]);
    res.status(200).json({ message: "Administrador removido." });
  } catch (error) {
    res.status(500).json({ error: "Erro interno." });
  }
};