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

// READ: Listar todas as ONGs
exports.getAllOngs = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `SELECT o.id, o.fantasy_name, o.cnpj, o.responsible_name, o.contact_email, o.phone FROM ongs o WHERE o.fantasy_name LIKE ? OR o.responsible_name LIKE ? OR o.contact_email LIKE ?`;
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
      contact_email, phone, website, instagram, zip_code, address,
      address_number, district, city, state, country,
      president_name, president_cpf,
      responsible_name, responsible_cpf, responsible_email, responsible_phone, responsible_password
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

    const [ongResult] = await connection.query(
      `INSERT INTO ongs (fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, responsible_name, responsible_cpf, responsible_user_id, logo_url, ata_url, statute_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fantasy_name, corporate_name, cnpj, formattedDate, contact_email, phone, website, instagram, zip_code, address, address_number, district, city, state, country, president_name, president_cpf, responsible_user_id, logo_url, ata_url, statute_url]
    );
    const ong_id = ongResult.insertId;

    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ong_id, responsible_user_id]);

    await connection.commit();
    res.status(201).json({ message: "ONG e usuário responsável criados com sucesso." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro detalhado ao criar ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    if (connection) connection.release();
  }
};

// UPDATE: Editar os dados de uma ONG (CORRIGIDO PARA EVITAR ERRO DE COLUNA INVÁLIDA)
// UPDATE: Editar os dados de uma ONG (VERSÃO FINAL CORRIGIDA)
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  try {
    const [currentOngRows] = await db.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOngRows.length === 0) return res.status(404).json({ message: "ONG não encontrada." });
    const currentOng = currentOngRows[0];

    // Cria uma cópia dos dados recebidos
    const dataToUpdate = { ...req.body };

    // --- LIMPEZA DE CAMPOS PROIBIDOS OU INVÁLIDOS ---
    
    // 1. Remove arquivos temporários ou inválidos
    delete dataToUpdate.logo_base64;
    delete dataToUpdate.ata_base64;
    delete dataToUpdate.statute_base64;
    delete dataToUpdate.logo_file;
    delete dataToUpdate.ata_file;
    delete dataToUpdate.statute_file;

    // 2. CORREÇÃO DO ERRO ATUAL: Remove campos de sistema que não devem ser atualizados
    delete dataToUpdate.created_at; // <--- ISSO RESOLVE O SEU ERRO ATUAL
    delete dataToUpdate.updated_at; // Caso exista
    delete dataToUpdate.id;         // Não se atualiza a chave primária
    delete dataToUpdate.responsible_user_id; // Segurança: evita mudar o dono da ONG por acidente

    // Processa os arquivos Base64 se existirem, senão mantém a URL antiga
    dataToUpdate.logo_url = req.body.logo_base64 ? saveBase64File(req.body.logo_base64, 'logo') : currentOng.logo_url;
    dataToUpdate.ata_url = req.body.ata_base64 ? saveBase64File(req.body.ata_base64, 'ata') : currentOng.ata_url;
    dataToUpdate.statute_url = req.body.statute_base64 ? saveBase64File(req.body.statute_base64, 'statute') : currentOng.statute_url;
    
    // Formata a data de fundação se ela vier no corpo da requisição
    if (dataToUpdate.foundation_date) {
        dataToUpdate.foundation_date = formatDate(dataToUpdate.foundation_date);
    }

    // Se após a limpeza não sobrar nenhum campo, retorna erro
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "Nenhum dado válido enviado para atualização." });
    }

    const [result] = await db.query('UPDATE ongs SET ? WHERE id = ?', [dataToUpdate, id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ message: "Nenhuma ONG foi encontrada para atualizar." });

    res.status(200).json({ message: "ONG atualizada com sucesso." });
  } catch (error) {
    console.error(`[UPDATE ONG ID: ${id}] Erro no processo de atualização:`, error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao atualizar a ONG.' });
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
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// GET: Obter os utilizadores de uma ONG específica
exports.getOngUsers = async (req, res) => {
  const { ongId } = req.params;
  const searchTerm = req.query.search || '';
  
  try {
    const query = `SELECT id, name, email, cpf, seal_balance FROM users WHERE ong_id = ? AND role_id = 4 AND (name LIKE ? OR email LIKE ? OR cpf LIKE ?)`;
    const [rows] = await db.query(query, [ongId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuários da ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor ao buscar os usuários." });
  }
};

// POST: Debitar o saldo de um usuário
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
    console.error("Erro ao debitar saldo:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    if (connection) connection.release();
  }
};

// GET: Listar todos os administradores de uma ONG
exports.getOngAdmins = async (req, res) => {
  const { id } = req.params; 
  try {
    const [admins] = await db.query(
      "SELECT id, name, email, cpf, phone, created_at FROM users WHERE ong_id = ? AND role_id = 3", 
      [id]
    );
    res.status(200).json(admins);
  } catch (error) {
    console.error("Erro ao buscar administradores:", error);
    res.status(500).json({ error: "Erro ao buscar administradores." });
  }
};

// POST: Adicionar um novo administrador à ONG
exports.addOngAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, cpf, phone, password } = req.body;

  if (!name || !email || !password || !cpf) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existingAdmins] = await connection.query(
      "SELECT COUNT(id) as count FROM users WHERE ong_id = ? AND role_id = 3",
      [id]
    );

    if (existingAdmins[0].count >= 5) {
      await connection.rollback();
      return res.status(400).json({ message: "Limite máximo de 5 administradores atingido." });
    }

    const [userExists] = await connection.query("SELECT id FROM users WHERE email = ? OR cpf = ?", [email, cpf]);
    if (userExists.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "E-mail ou CPF já cadastrados no sistema." });
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
    console.error("Erro ao adicionar administrador:", error);
    res.status(500).json({ error: "Erro interno ao adicionar administrador." });
  } finally {
    if (connection) connection.release();
  }
};

// DELETE: Remover um administrador
exports.removeOngAdmin = async (req, res) => {
  const { id, userId } = req.params;
  const requestingUserId = req.user.id;

  if (parseInt(userId) === requestingUserId) {
    return res.status(400).json({ message: "Você não pode excluir a si mesmo." });
  }

  try {
    const [user] = await db.query("SELECT id FROM users WHERE id = ? AND ong_id = ?", [userId, id]);
    if (user.length === 0) {
        return res.status(404).json({ message: "Administrador não encontrado." });
    }

    const [countResult] = await db.query("SELECT COUNT(id) as count FROM users WHERE ong_id = ? AND role_id = 3", [id]);
    if (countResult[0].count <= 1) {
        return res.status(400).json({ message: "A ONG precisa ter pelo menos um administrador." });
    }

    await db.query("DELETE FROM users WHERE id = ?", [userId]);
    res.status(200).json({ message: "Administrador removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover administrador:", error);
    res.status(500).json({ error: "Erro interno." });
  }
};