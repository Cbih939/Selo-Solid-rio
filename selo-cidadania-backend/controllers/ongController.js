// selo-cidadania-backend/controllers/ongController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs'); // Precisamos do File System para salvar os arquivos

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

// Função para salvar um arquivo Base64 no disco
const saveBase64File = (base64String, fieldName) => {
    if (!base64String) return null;

    // Extrai o tipo de conteúdo e os dados da string Base64
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        console.error("String Base64 inválida recebida.");
        return null;
    }
    
    const mimeType = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    // Gera um nome de arquivo único
    const extension = mimeType.split('/')[1];
    const filename = `${fieldName}-${Date.now()}.${extension}`;
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const filepath = path.join(uploadsDir, filename);
    
    // Garante que o diretório de uploads exista
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Salva o arquivo no disco
    fs.writeFileSync(filepath, data);
    
    // Retorna a URL pública para ser salva no banco de dados
    return path.join('/uploads', filename).replace(/\\/g, '/');
};


// READ: Listar todas as ONGs (sem alterações)
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

// READ: Buscar uma ONG por ID (sem alterações)
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

// CREATE: Criar uma nova ONG (adaptado para Base64)
exports.createOng = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      logo_base64, ata_base64, statute_base64, // Pega os arquivos base64
      ...ongData // O resto dos dados
    } = req.body;

    const {
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, website, instagram, zip_code, address,
      address_number, district, city, state, country,
      president_name, president_cpf,
      responsible_name, responsible_cpf, responsible_email, responsible_phone, responsible_password
    } = ongData;

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

    const logo_url = saveBase64File(logo_base64, 'logo');
    const ata_url = saveBase64File(ata_base64, 'ata');
    const statute_url = saveBase64File(statute_base64, 'statute');
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

// UPDATE: Editar os dados de uma ONG (adaptado para Base64)
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  // Separa os arquivos base64 do resto dos dados da ONG
  const { logo_base64, ata_base64, statute_base64, ...ongData } = req.body;

  try {
    const [currentOngRows] = await db.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOngRows.length === 0) {
      return res.status(404).json({ message: "ONG não encontrada." });
    }
    const currentOng = currentOngRows[0];

    // Salva os novos arquivos (se enviados) ou mantém os antigos
    const logo_url = logo_base64 ? saveBase64File(logo_base64, 'logo') : currentOng.logo_url;
    const ata_url = ata_base64 ? saveBase64File(ata_base64, 'ata') : currentOng.ata_url;
    const statute_url = statute_base64 ? saveBase64File(statute_base64, 'statute') : currentOng.statute_url;

    // Prepara o objeto final para o update
    const dataToUpdate = { ...ongData, logo_url, ata_url, statute_url };
    
    if (dataToUpdate.foundation_date) {
      dataToUpdate.foundation_date = formatDate(dataToUpdate.foundation_date);
    }
    
    // Remove campos que não devem ser atualizados
    delete dataToUpdate.id;
    delete dataToUpdate.created_at;

    const [result] = await db.query('UPDATE ongs SET ? WHERE id = ?', [dataToUpdate, id]);

    if (result.affectedRows === 0) {
      // Isso pode acontecer se os dados enviados forem idênticos aos já existentes
      return res.status(200).json({ message: "Nenhum dado foi alterado, mas a operação foi bem-sucedida." });
    }

    res.status(200).json({ message: "ONG atualizada com sucesso." });

  } catch (error) {
    console.error(`[UPDATE ONG ID: ${id}] Erro no processo de atualização:`, error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao tentar atualizar a ONG.' });
  }
};

// DELETE: Excluir uma ONG (sem alterações)
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

// GET: Obter os utilizadores de uma ONG específica (sem alterações)
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

// POST: Debitar o saldo de um usuário (sem alterações)
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
