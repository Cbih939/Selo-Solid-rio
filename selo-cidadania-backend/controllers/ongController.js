// Arquivo: controllers/ongController.js (VERSÃO 100% COMPLETA E CORRIGIDA)

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ==================================================================
// ### FUNÇÕES RESTAURADAS DO SEU COMMIT ESTÁVEL ###
// ==================================================================

// GET: Listar todas as ONGs
exports.getAllOngs = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT id, fantasy_name, corporate_name, cnpj, contact_email, responsible_name 
      FROM ongs 
      WHERE fantasy_name LIKE ? OR corporate_name LIKE ? OR cnpj LIKE ?
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter detalhes de uma ONG específica
exports.getOngById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM ongs WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "ONG não encontrada." });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Listar todos os usuários de uma ONG específica
exports.getOngUsers = async (req, res) => {
    const { ongId } = req.params;
    const searchTerm = req.query.search || '';
    try {
        const query = `
            SELECT id, name, email, seal_balance 
            FROM users 
            WHERE ong_id = ? AND (name LIKE ? OR email LIKE ?)
        `;
        const [rows] = await db.query(query, [ongId, `%${searchTerm}%`, `%${searchTerm}%`]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==================================================================
// ### FUNÇÃO DE CRIAÇÃO DE ONG CORRIGIDA ###
// ==================================================================
exports.createOng = async (req, res) => {
  const {
    fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone,
    website, instagram, zip_code, address, address_number, district, city, state, country,
    responsible_name, responsible_cpf, responsible_email, responsible_phone,
    logo_url, ata_url, statute_url
  } = req.body;

  if (!fantasy_name || !cnpj || !responsible_name || !responsible_email) {
    return res.status(400).json({ message: 'Nome Fantasia, CNPJ, Nome do Responsável e Email do Responsável são obrigatórios.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // PASSO 1: Criar o usuário Coordenador PRIMEIRO
    const [existingUser] = await connection.query('SELECT email FROM users WHERE email = ?', [responsible_email]);
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'O email do responsável já está em uso por outro usuário.' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, cpf, phone, password_hash, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [responsible_name, responsible_email, responsible_cpf, responsible_phone, passwordHash, 3] // role_id = 3 para 'Coordenador ONG'
    );
    const responsibleUserId = userResult.insertId;

    // PASSO 2: Criar a ONG, já com o ID do responsável
    const [ongResult] = await connection.query(
      `
      INSERT INTO ongs (
        fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone, 
        website, instagram, zip_code, address, address_number, district, city, state, country,
        responsible_name, responsible_cpf, responsible_email, responsible_phone,
        logo_url, ata_url, statute_url,
        responsible_user_id 
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone,
        website, instagram, zip_code, address, address_number, district, city, state, country,
        responsible_name, responsible_cpf, responsible_email, responsible_phone,
        logo_url, ata_url, statute_url,
        responsibleUserId
      ]
    );
    const ongId = ongResult.insertId;

    // PASSO 3: Atualizar o usuário coordenador com o ID da sua ONG
    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ongId, responsibleUserId]);

    await connection.commit();
    res.status(201).json({ message: 'ONG e Coordenador criados com sucesso!', ongId, responsibleUserId });

  } catch (error) {
    await connection.rollback();
    console.error("ERRO NA CRIAÇÃO DA ONG E COORDENADOR:", error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor ao criar a ONG.' });
  } finally {
    connection.release();
  }
};

// ==================================================================
// ### FUNÇÕES RESTANTES RESTAURADAS DO SEU COMMIT ESTÁVEL ###
// ==================================================================

// UPDATE: Atualizar uma ONG
exports.updateOng = async (req, res) => {
    const { id } = req.params;
    const ongData = req.body;
    try {
        const [result] = await db.query("UPDATE ongs SET ? WHERE id = ?", [ongData, id]);
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
        // Encontra o ID do usuário responsável para deletá-lo também
        const [ongs] = await connection.query("SELECT responsible_user_id FROM ongs WHERE id = ?", [id]);
        
        // Deleta os usuários associados à ONG
        await connection.query("DELETE FROM users WHERE ong_id = ?", [id]);
        
        // Deleta a ONG
        const [result] = await connection.query("DELETE FROM ongs WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "ONG não encontrada." });
        }

        // Se encontrou um usuário responsável, deleta-o
        if (ongs.length > 0 && ongs[0].responsible_user_id) {
            await connection.query("DELETE FROM users WHERE id = ?", [ongs[0].responsible_user_id]);
        }

        await connection.commit();
        res.status(200).json({ message: "ONG e usuários associados excluídos com sucesso." });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};
