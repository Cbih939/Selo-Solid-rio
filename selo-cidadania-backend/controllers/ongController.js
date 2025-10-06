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
    await connection.rollback();
    console.error("Erro detalhado ao criar ONG:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    connection.release();
  }
};

// UPDATE: Editar os dados de uma ONG
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  try {
    const [currentOngRows] = await db.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOngRows.length === 0) return res.status(404).json({ message: "ONG não encontrada." });
    const currentOng = currentOngRows[0];

    const dataToUpdate = { ...req.body };
    delete dataToUpdate.logo_base64;
    delete dataToUpdate.ata_base64;
    delete dataToUpdate.statute_base64;

    dataToUpdate.logo_url = req.body.logo_base64 ? saveBase64File(req.body.logo_base64, 'logo') : currentOng.logo_url;
    dataToUpdate.ata_url = req.body.ata_base64 ? saveBase64File(req.body.ata_base64, 'ata') : currentOng.ata_url;
    dataToUpdate.statute_url = req.body.statute_base64 ? saveBase64File(req.body.statute_base64, 'statute') : currentOng.statute_url;
    
    if (dataToUpdate.foundation_date) {
        dataToUpdate.foundation_date = formatDate(dataToUpdate.foundation_date);
    }

    const [result] = await db.query('UPDATE ongs SET ? WHERE id = ?', [dataToUpdate, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Nenhuma ONG foi atualizada." });

    res.status(200).json({ message: "ONG atualizada com sucesso." });
  } catch (error) {
    console.error(`[UPDATE ONG ID: ${id}] Erro no processo de atualização:`, error);
    res.status(500).json({ error: 'Ocorreu um erro interno.' });
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

// ==================================================================
// ++ INÍCIO DA CORREÇÃO: Função movida do userController para cá ++
// ==================================================================
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
// ++ FIM DA CORREÇÃO ++
// ==================================================================
