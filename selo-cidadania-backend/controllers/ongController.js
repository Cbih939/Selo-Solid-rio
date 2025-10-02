// controllers/ongController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path'); // Importe o módulo 'path' do Node.js

// Função utilitária para formatar a data para o formato YYYY-MM-DD
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null; // Retorna nulo se a data for inválida
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
      SELECT 
          o.id, o.fantasy_name, o.cnpj, o.responsible_name, 
          o.contact_email, o.phone
      FROM ongs o
      WHERE 
          o.fantasy_name LIKE ? OR 
          o.responsible_name LIKE ? OR 
          o.contact_email LIKE ?
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar ONGs:', error);
    res.status(500).json({ error: error.message });
  }
};

// READ: Buscar uma ONG por ID para visualização ou edição
exports.getOngById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ongs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ONG não encontrada.' });
    }
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
      return res.status(400).json({ error: "Dados do Coordenador (Nome, CPF, E-mail, Senha) são obrigatórios." });
    }

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(responsible_password, salt);
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`,
      [responsible_name, responsible_email, passwordHash, responsible_cpf, responsible_phone]
    );
    const responsible_user_id = userResult.insertId;

    // Constrói a URL a partir do filename fornecido pelo multer
    const logo_url = req.files?.logo_file ? path.join('/uploads', req.files.logo_file[0].filename).replace(/\\/g, '/') : null;
    const ata_url = req.files?.ata_file ? path.join('/uploads', req.files.ata_file[0].filename).replace(/\\/g, '/') : null;
    const statute_url = req.files?.statute_file ? path.join('/uploads', req.files.statute_file[0].filename).replace(/\\/g, '/') : null;
    const formattedDate = formatDate(foundation_date);

    const [ongResult] = await connection.query(
      `INSERT INTO ongs (
        fantasy_name, corporate_name, cnpj, foundation_date, 
        contact_email, phone, website, instagram, zip_code, address, 
        address_number, district, city, state, country, 
        responsible_name, responsible_cpf, responsible_user_id,
        logo_url, ata_url, statute_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fantasy_name, corporate_name, cnpj, formattedDate,
        contact_email, phone, website, instagram, zip_code, address,
        address_number, district, city, state, country,
        president_name, president_cpf, responsible_user_id,
        logo_url, ata_url, statute_url
      ]
    );
    const ong_id = ongResult.insertId;

    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ong_id, responsible_user_id]);

    await connection.commit();
    res.status(201).json({ message: "ONG e usuário responsável criados com sucesso." });

  } catch (error) {
    await connection.rollback();
    console.error("Erro detalhado ao criar ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor ao tentar criar a ONG." });
  } finally {
    connection.release();
  }
};


// =====================================================================
// ++ INÍCIO DA CORREÇÃO FINAL ++
// =====================================================================
// UPDATE: Editar os dados de uma ONG
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  const ongDataFromRequest = req.body;

  try {
    // 1. Buscar o estado atual da ONG no banco de dados.
    const [currentOngRows] = await db.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOngRows.length === 0) {
      return res.status(404).json({ message: "ONG não encontrada para atualizar." });
    }
    const currentOng = currentOngRows[0];

    // 2. Preparar os dados para atualização, começando com os dados do corpo da requisição.
    const dataToUpdate = { ...ongDataFromRequest };

    // 3. Processar os caminhos dos arquivos.
    // Se um novo arquivo foi enviado, crie a nova URL.
    // Se não, mantenha a URL antiga que já estava no banco.
    dataToUpdate.logo_url = req.files?.logo_file 
      ? path.join('/uploads', req.files.logo_file[0].filename).replace(/\\/g, '/') 
      : currentOng.logo_url;

    dataToUpdate.ata_url = req.files?.ata_file 
      ? path.join('/uploads', req.files.ata_file[0].filename).replace(/\\/g, '/')
      : currentOng.ata_url;

    dataToUpdate.statute_url = req.files?.statute_file 
      ? path.join('/uploads', req.files.statute_file[0].filename).replace(/\\/g, '/')
      : currentOng.statute_url;

    // 4. Formatar a data, se ela foi enviada.
    if (dataToUpdate.foundation_date) {
      dataToUpdate.foundation_date = formatDate(dataToUpdate.foundation_date);
    }

    // 5. Remover campos que não devem ser atualizados diretamente ou que não existem na tabela.
    // Isso evita erros de "Unknown column".
    delete dataToUpdate.id;
    delete dataToUpdate.created_at; 
    // Adicione outros campos que não devem ser atualizados, se houver.

    // 6. Construir e executar a query de atualização.
    const [result] = await db.query('UPDATE ongs SET ? WHERE id = ?', [dataToUpdate, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Nenhuma ONG foi atualizada. Verifique o ID." });
    }

    res.status(200).json({ message: "ONG atualizada com sucesso." });

  } catch (error) {
    console.error(`[UPDATE ONG ID: ${id}] Erro no processo de atualização:`, error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao tentar atualizar a ONG.' });
  }
};
// =====================================================================
// ++ FIM DA CORREÇÃO ++
// =====================================================================


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
    const query = `
      SELECT id, name, email, seal_balance 
      FROM users 
      WHERE ong_id = ? AND role_id = 4 AND (name LIKE ? OR email LIKE ?)
    `;
    const [rows] = await db.query(query, [ongId, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Debitar o saldo de um usuário
exports.debitUserBalance = async (req, res) => {
  const ongId = req.user.ong_id; 
  const { userId, amount, reason } = req.body;

  if (!userId || !amount || !reason) {
    return res.status(400).json({ message: "ID do usuário, valor e motivo são obrigatórios." });
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
    await connection.rollback();
    console.error("Erro ao debitar saldo:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    connection.release();
  }
};
