// controllers/ongController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
// === INÍCIO DA ALTERAÇÃO ===
// Módulos para manipular caminhos de ficheiros e o sistema de ficheiros
const fs = require('fs'); 
const path = require('path');
// === FIM DA ALTERAÇÃO ===

// Função utilitária para formatar a data para o formato YYYY-MM-DD
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
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

// READ: Buscar uma ONG por ID
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
  // O seu código original para esta função estava correto e completo.
  // Mantive-o exatamente como estava.
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

    const logo_url = req.files?.logo_file ? `/uploads/${req.files.logo_file[0].filename}` : null;
    const ata_url = req.files?.ata_file ? `/uploads/${req.files.ata_file[0].filename}` : null;
    const statute_url = req.files?.statute_file ? `/uploads/${req.files.statute_file[0].filename}` : null;
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

// UPDATE: Editar os dados de uma ONG
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, website, instagram, zip_code, address,
      address_number, district, city, state, country,
      responsible_name, responsible_cpf
    } = req.body;

    const [currentOngRows] = await db.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOngRows.length === 0) {
      return res.status(404).json({ message: "ONG não encontrada para atualizar." });
    }
    const currentOng = currentOngRows[0];

    // === INÍCIO DA ALTERAÇÃO ===
    // Função auxiliar para apagar ficheiros
    const deleteFile = (filePath) => {
        if (filePath) {
            // Assume que a pasta 'public' é a raiz servida estaticamente. Ajuste se necessário.
            const fullPath = path.join('public', filePath);
            fs.unlink(fullPath, (err) => {
                if (err) console.error(`Erro ao apagar ficheiro antigo: ${fullPath}`, err);
            });
        }
    };

    let logo_url = currentOng.logo_url;
    if (req.files?.logo_file) {
        deleteFile(currentOng.logo_url); // Apaga o ficheiro antigo
        logo_url = `/uploads/${req.files.logo_file[0].filename}`; // Define o novo
    }

    let ata_url = currentOng.ata_url;
    if (req.files?.ata_file) {
        deleteFile(currentOng.ata_url);
        ata_url = `/uploads/${req.files.ata_file[0].filename}`;
    }

    let statute_url = currentOng.statute_url;
    if (req.files?.statute_file) {
        deleteFile(currentOng.statute_url);
        statute_url = `/uploads/${req.files.statute_file[0].filename}`;
    }
    // === FIM DA ALTERAÇÃO ===

    const formattedDate = formatDate(foundation_date);
    const query = `
      UPDATE ongs SET
        fantasy_name = ?, corporate_name = ?, cnpj = ?, foundation_date = ?,
        contact_email = ?, phone = ?, website = ?, instagram = ?,
        zip_code = ?, address = ?, address_number = ?, district = ?, city = ?, state = ?, country = ?,
        responsible_name = ?, responsible_cpf = ?,
        logo_url = ?, ata_url = ?, statute_url = ?
      WHERE id = ?
    `;
    const values = [
      fantasy_name, corporate_name, cnpj, formattedDate,
      contact_email, phone, website, instagram,
      zip_code, address, address_number, district, city, state, country,
      responsible_name, responsible_cpf,
      logo_url, ata_url, statute_url,
      id
    ];

    await db.query(query, values);
    res.status(200).json({ message: "ONG atualizada com sucesso." });

  } catch (error) {
    console.error(`[UPDATE ONG ID: ${id}] ERRO NO PROCESSO:`, error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao tentar atualizar a ONG.' });
  }
};

// DELETE: Excluir uma ONG
exports.deleteOng = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // === INÍCIO DA ALTERAÇÃO ===
    // 1. Buscar os caminhos dos ficheiros antes de apagar a ONG do DB
    const [ongRows] = await connection.query("SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?", [id]);
    
    // 2. Apagar os ficheiros do sistema de ficheiros
    if (ongRows.length > 0) {
        const ong = ongRows[0];
        const filesToDelete = [ong.logo_url, ong.ata_url, ong.statute_url];
        filesToDelete.forEach(filePath => {
            if (filePath) {
                const fullPath = path.join('public', filePath);
                fs.unlink(fullPath, err => {
                    if (err) console.error(`Falha ao apagar ficheiro na exclusão da ONG: ${fullPath}`, err);
                });
            }
        });
    }
    // === FIM DA ALTERAÇÃO ===

    // 3. Desvincular usuários da ONG
    await connection.query("UPDATE users SET ong_id = NULL WHERE ong_id = ?", [id]);
    
    // 4. Excluir a ONG do banco de dados
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

// As funções abaixo foram mantidas como no seu original
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