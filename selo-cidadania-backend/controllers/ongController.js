// Arquivo: selo-cidadania-backend/controllers/ongController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

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
    
    // LOG DE ERRO
    const actorName = req.user?.name || 'Sistema';
    await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao listar OSCs: ${error.message}`, "error");
    
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
    
    // LOG DE ERRO
    const actorName = req.user?.name || 'Sistema';
    await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao buscar OSC ID ${id}: ${error.message}`, "error");
    
    res.status(500).json({ error: error.message });
  }
};

// CREATE: Criar uma nova ONG
exports.createOng = async (req, res) => {
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;
  const connection = await db.getConnection();
  
  try {
    const {
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, whatsapp, website, instagram, facebook, drive_link,
      zip_code, address, address_number, district, city, state, country,
      president_name, president_cpf,
      responsible_name, responsible_cpf, responsible_email, responsible_phone, responsible_password,
      parent_ong_id
    } = req.body;

    if (!responsible_name || !responsible_cpf || !responsible_email || !responsible_password) {
      await registerSystemLog(actorId, actorOng, actorName, "Aviso de Validação", "Tentativa de criar ONG sem os dados do Coordenador.", "warning");
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
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Nova OSC Cadastrada", `A instituição '${fantasy_name}' (${cnpj}) foi registada com sucesso. Coordenador: ${responsible_name}.`, "success");

    res.status(201).json({ message: "ONG e usuário responsável criados com sucesso." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro detalhado ao criar ONG:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
        // LOG DE AVISO (Duplicação)
        await registerSystemLog(actorId, actorOng, actorName, "Cadastro Bloqueado", `Tentativa de criar OSC falhou: CNPJ ou E-mail já existentes.`, "warning");
        return res.status(400).json({ error: 'Já existe uma instituição cadastrada com este CNPJ ou E-mail.' });
    }
    
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Criar OSC", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    if (connection) connection.release();
  }
};

// UPDATE: Atualização Blindada
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;

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

    if (dataToUpdate.parent_ong_id !== undefined) {
        dataToUpdate.parent_ong_id = dataToUpdate.parent_ong_id === '' || dataToUpdate.parent_ong_id === null ? null : dataToUpdate.parent_ong_id;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "Nenhum dado válido para atualização." });
    }

    const [result] = await db.query('UPDATE ongs SET ? WHERE id = ?', [dataToUpdate, id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ message: "Nenhuma ONG atualizada." });

    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Perfil de OSC Atualizado", `Os dados da instituição ID ${id} foram modificados.`, "success");

    res.status(200).json({ message: "ONG atualizada com sucesso." });
  } catch (error) {
    console.error(`[UPDATE ONG ID: ${id}] Erro:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
        await registerSystemLog(actorId, actorOng, actorName, "Edição Bloqueada", `Tentativa de editar OSC ID ${id} com CNPJ ou E-mail já utilizados.`, "warning");
        return res.status(400).json({ error: 'CNPJ ou E-mail já em uso por outra instituição.' });
    }
    
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Atualizar OSC", `Falha técnica ao atualizar ID ${id}: ${error.message}`, "error");
    res.status(500).json({ error: 'Erro interno ao atualizar ONG.' });
  }
};

// DELETE: Excluir uma ONG
exports.deleteOng = async (req, res) => {
  const { id } = req.params;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;
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
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "OSC Excluída", `A instituição ID ${id} foi removida permanentemente do sistema.`, "success");
    res.status(200).json({ message: "ONG excluída com sucesso." });

  } catch (error) {
    if (connection) await connection.rollback();
    
    // Proteção caso tenha filiais (Constraint de Chave Estrangeira)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        await registerSystemLog(actorId, actorOng, actorName, "Exclusão Bloqueada", `Tentativa de excluir OSC ID ${id} impedida (possui filiais ou utilizadores pendentes).`, "warning");
        return res.status(400).json({ error: 'Não é possível excluir esta OSC pois existem filiais ou utilizadores associados a ela.' });
    }
    
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Excluir OSC", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Buscar usuários da ONG
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

// Débito manual de saldo do usuário
exports.debitUserBalance = async (req, res) => {
  const ongId = req.user?.ong_id; 
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const { userId, amount, reason } = req.body;

  if (!userId || !amount || !reason || amount <= 0) {
    return res.status(400).json({ message: "ID do usuário, valor positivo e motivo são obrigatórios." });
  }
  if (!ongId) {
    await registerSystemLog(actorId, null, actorName, "Acesso Negado", "Utilizador sem ONG tentou realizar débito manual.", "warning");
    return res.status(403).json({ message: "Apenas um coordenador de ONG pode realizar esta operação." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT id, name, seal_balance FROM users WHERE id = ? AND ong_id = ? FOR UPDATE', [userId, ongId]);
    
    if (users.length === 0) {
      await connection.rollback();
      await registerSystemLog(actorId, ongId, actorName, "Operação Inválida", `Tentativa de debitar saldo de utilizador ID ${userId} que não pertence à ONG.`, "warning");
      return res.status(403).json({ message: "Operação não permitida. O usuário não pertence a esta ONG." });
    }

    const user = users[0];
    if (user.seal_balance < amount) {
      await connection.rollback();
      await registerSystemLog(actorId, ongId, actorName, "Saldo Insuficiente", `Débito falhou: Utilizador '${user.name}' não possui ${amount} selos.`, "warning");
      return res.status(400).json({ message: "Saldo insuficiente." });
    }

    await connection.query('UPDATE users SET seal_balance = seal_balance - ? WHERE id = ?', [amount, userId]);
    await connection.query('INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, ?, ?, ?)', [userId, ongId, 'debit', amount, reason]);
    
    await connection.commit();
    
    // LOG DE SUCESSO (Ação manual de administrador)
    await registerSystemLog(actorId, ongId, actorName, "Débito Manual de Selos", `Débito de ${amount} selos da conta de '${user.name}'. Motivo: ${reason}`, "success");
    
    res.status(200).json({ message: "Débito realizado com sucesso." });
  } catch (error) {
    if (connection) await connection.rollback();
    await registerSystemLog(actorId, ongId, actorName, "Erro em Transação Financeira", `Falha ao debitar saldo: ${error.message}`, "error");
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    if (connection) connection.release();
  }
};

// Buscar administradores da ONG
exports.getOngAdmins = async (req, res) => {
  const { id } = req.params; 
  try {
    const [admins] = await db.query("SELECT id, name, email, cpf, phone, created_at FROM users WHERE ong_id = ? AND role_id = 3", [id]);
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar administradores." });
  }
};

// Adicionar um administrador à ONG
exports.addOngAdmin = async (req, res) => {
  const { id } = req.params;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
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
      await registerSystemLog(actorId, id, actorName, "Limite de Equipa Atingido", `Tentativa de adicionar o 6º administrador na OSC ID ${id} bloqueada.`, "warning");
      return res.status(400).json({ message: "Limite máximo de 5 administradores atingido." });
    }

    const [userExists] = await connection.query("SELECT id FROM users WHERE email = ? OR cpf = ?", [email, cpf]);
    if (userExists.length > 0) {
      await connection.rollback();
      await registerSystemLog(actorId, id, actorName, "Cadastro de Admin Bloqueado", `Tentativa de adicionar admin falhou: CPF ou E-mail (${email}) já existem.`, "warning");
      return res.status(409).json({ message: "E-mail ou CPF já cadastrados." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await connection.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone, role_id, ong_id) VALUES (?, ?, ?, ?, ?, 3, ?)`,
      [name, email, passwordHash, cpf, phone, id]
    );

    await connection.commit();
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, id, actorName, "Novo Admin de OSC", `Utilizador '${name}' foi adicionado como Administrador Nv.2 na OSC.`, "success");
    
    res.status(201).json({ message: "Novo administrador adicionado com sucesso!" });
  } catch (error) {
    if (connection) await connection.rollback();
    await registerSystemLog(actorId, id, actorName, "Erro ao Adicionar Admin", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: "Erro interno ao adicionar administrador." });
  } finally {
    if (connection) connection.release();
  }
};

// Remover um administrador da ONG
exports.removeOngAdmin = async (req, res) => {
  const { id, userId } = req.params;
  const requestingUserId = req.user?.id;
  const actorName = req.user?.name || 'Sistema';

  if (parseInt(userId) === requestingUserId) {
    await registerSystemLog(requestingUserId, id, actorName, "Operação Bloqueada", "Utilizador tentou excluir a própria conta de administrador.", "warning");
    return res.status(400).json({ message: "Você não pode excluir a si mesmo." });
  }

  try {
    const [user] = await db.query("SELECT id, name FROM users WHERE id = ? AND ong_id = ?", [userId, id]);
    if (user.length === 0) return res.status(404).json({ message: "Administrador não encontrado." });

    const [countResult] = await db.query("SELECT COUNT(id) as count FROM users WHERE ong_id = ? AND role_id = 3", [id]);
    if (countResult[0].count <= 1) {
        await registerSystemLog(requestingUserId, id, actorName, "Operação Bloqueada", "Tentativa de remover o último administrador da OSC.", "warning");
        return res.status(400).json({ message: "A ONG precisa ter pelo menos um administrador." });
    }

    await db.query("DELETE FROM users WHERE id = ?", [userId]);
    
    // LOG DE SUCESSO
    await registerSystemLog(requestingUserId, id, actorName, "Admin de OSC Removido", `O acesso de administrador do utilizador '${user[0].name}' foi revogado.`, "success");
    
    res.status(200).json({ message: "Administrador removido." });
  } catch (error) {
    await registerSystemLog(requestingUserId, id, actorName, "Erro ao Remover Admin", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: "Erro interno." });
  }
};