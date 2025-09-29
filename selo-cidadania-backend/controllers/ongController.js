const db = require("../config/db");
const bcrypt = require("bcryptjs"); // CORREÇÃO: Alterado de 'bcrypt' para 'bcryptjs'

/**
 * POST: Cria uma nova ONG e seu usuário coordenador de forma atômica.
 */
const createOng = async (req, res) => {
  // 1. Separa os dados recebidos do formulário
  const {
    // Dados da ONG
    fantasy_name, corporate_name, cnpj, foundation_date,
    contact_email, phone, website, instagram, zip_code,
    address, address_number, district, city, state, country,
    // Dados do Responsável Legal (informativo, vai para a tabela 'ongs')
    responsible_name, responsible_cpf, responsible_email, responsible_phone,
    // Dados do Coordenador (usuário do sistema, vai para a tabela 'users')
    coordinator_name, coordinator_cpf, coordinator_email, coordinator_phone, coordinator_password
  } = req.body;

  // Pega os caminhos dos arquivos de upload, se existirem
  const logoFile = req.files?.logo_file?.[0];
  const ataFile = req.files?.ata_file?.[0];
  const statuteFile = req.files?.statute_file?.[0];

  // 2. Validação inicial dos dados essenciais
  if (!fantasy_name || !cnpj || !coordinator_name || !coordinator_email || !coordinator_password) {
    return res.status(400).json({ error: "Campos essenciais (Nome da ONG, CNPJ, Nome, E-mail e Senha do Coordenador) são obrigatórios." });
  }

  const connection = await db.getConnection();

  try {
    // 3. Inicia a transação
    await connection.beginTransaction();

    // 4. Verifica duplicidade (CNPJ da ONG, e-mail e CPF do Coordenador)
    const [existing] = await connection.query(
      `SELECT 
        (SELECT id FROM ongs WHERE cnpj = ?) as ong_cnpj,
        (SELECT id FROM users WHERE email = ?) as user_email,
        (SELECT id FROM users WHERE cpf = ? AND cpf IS NOT NULL AND cpf != '') as user_cpf`,
      [cnpj, coordinator_email, coordinator_cpf]
    );

    if (existing[0].ong_cnpj) {
      await connection.rollback();
      return res.status(409).json({ error: `O CNPJ "${cnpj}" já está cadastrado.` });
    }
    if (existing[0].user_email) {
      await connection.rollback();
      return res.status(409).json({ error: `O e-mail do coordenador "${coordinator_email}" já está em uso.` });
    }
    if (existing[0].user_cpf) {
      await connection.rollback();
      return res.status(409).json({ error: `O CPF do coordenador "${coordinator_cpf}" já está em uso.` });
    }

    // 5. Insere os dados na tabela 'ongs'
    const ongSql = `
      INSERT INTO ongs (
        fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone, 
        website, instagram, zip_code, address, address_number, district, city, state, country,
        responsible_name, responsible_cpf, responsible_email, responsible_phone,
        logo_url, ata_url, statute_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const ongParams = [
      fantasy_name, corporate_name, cnpj, foundation_date, contact_email, phone,
      website, instagram, zip_code, address, address_number, district, city, state, country,
      responsible_name, responsible_cpf, responsible_email, responsible_phone,
      logoFile ? `/uploads/${logoFile.filename}` : null,
      ataFile ? `/uploads/${ataFile.filename}` : null,
      statuteFile ? `/uploads/${statuteFile.filename}` : null
    ];
    
    const [ongResult] = await connection.query(ongSql, ongParams);
    const newOngId = ongResult.insertId;

    // 6. Criptografa a senha do coordenador
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(coordinator_password, salt);

    // 7. Insere os dados na tabela 'users'
    const userSql = `
      INSERT INTO users (name, cpf, email, phone, password_hash, ong_id, role_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    // ATENÇÃO: Verifique se o ID do perfil 'ong' é realmente 3 no seu banco.
    const roleIdForOng = 3; 
    const userParams = [
      coordinator_name, coordinator_cpf, coordinator_email, coordinator_phone, 
      passwordHash, newOngId, roleIdForOng
    ];

    await connection.query(userSql, userParams);

    // 8. Se tudo deu certo, confirma a transação
    await connection.commit();

    res.status(201).json({ message: `ONG "${fantasy_name}" e seu coordenador foram criados com sucesso!` });

  } catch (error) {
    await connection.rollback();
    console.error("ERRO NA CRIAÇÃO DA ONG E COORDENADOR:", error);
    res.status(500).json({ 
      error: "Ocorreu um erro interno no servidor. Nenhuma informação foi salva.",
      details: error.message 
    });
  } finally {
    connection.release();
  }
};

// --- Funções existentes ---

const getAllOngs = async (req, res) => {
  try {
    const query = `
      SELECT id, fantasy_name, cnpj, contact_email, responsible_name 
      FROM ongs
    `;
    const [ongs] = await db.query(query);
    res.json(ongs || []);
  } catch (error) {
    console.error("Erro ao buscar ONGs:", error);
    res.status(500).json([]);
  }
};

const getOngById = async (req, res) => {
  try {
    const [ongs] = await db.query("SELECT * FROM ongs WHERE id = ?", [req.params.id]);
    if (ongs.length === 0) return res.status(404).json({ message: "ONG não encontrada." });
    res.json(ongs[0]);
  } catch (error) {
    console.error("Erro ao buscar ONG:", error);
    res.status(500).json({ message: "Erro ao buscar ONG." });
  }
};

const getOngUsers = async (req, res) => {
  try {
    const { ongId } = req.params;
    const [users] = await db.query("SELECT id, name, email, seal_balance FROM users WHERE ong_id = ?", [ongId]);
    res.json(users || []);
  } catch (error) {
    console.error("Erro ao buscar usuários da ONG:", error);
    res.status(500).json([]);
  }
};

const updateOng = async (req, res) => {
  try {
    await db.query("UPDATE ongs SET ? WHERE id = ?", [req.body, req.params.id]);
    res.json({ message: "ONG atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar ONG:", error);
    res.status(500).json({ message: "Erro ao atualizar ONG." });
  }
};

const deleteOng = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("UPDATE users SET ong_id = NULL WHERE ong_id = ?", [req.params.id]);
    await connection.query("DELETE FROM ongs WHERE id = ?", [req.params.id]);
    await connection.commit();
    res.json({ message: "ONG excluída com sucesso!" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao excluir ONG:", error);
    res.status(500).json({ message: "Erro ao excluir ONG." });
  } finally {
    connection.release();
  }
};

const debitUserBalance = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { userId, amount, reason } = req.body;
    const numericUserId = parseInt(userId, 10);
    const debitAmount = parseInt(amount, 10);

    if (isNaN(numericUserId) || isNaN(debitAmount) || debitAmount <= 0) {
      return res.status(400).json({ message: "ID do usuário e valor do débito devem ser números positivos." });
    }
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: "O motivo do débito é obrigatório." });
    }

    await connection.beginTransaction();
    const [users] = await connection.query('SELECT seal_balance FROM users WHERE id = ? FOR UPDATE', [numericUserId]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Beneficiário não encontrado." });
    }
    const currentBalance = users[0].seal_balance;
    if (currentBalance < debitAmount) {
      await connection.rollback();
      return res.status(400).json({ message: "Saldo insuficiente para realizar o débito." });
    }
    await connection.query('UPDATE users SET seal_balance = seal_balance - ? WHERE id = ?', [debitAmount, numericUserId]);
    await connection.query('INSERT INTO seal_transactions (user_id, type, amount, reason) VALUES (?, ?, ?, ?)', [numericUserId, 'debit', debitAmount, reason]);
    await connection.commit();
    res.status(200).json({ message: 'Débito realizado com sucesso!' });
  } catch (error) {
    await connection.rollback();
    console.error("ERRO CRÍTICO AO DEBITAR SALDO:", error);
    res.status(500).json({ message: "Erro interno ao processar o débito.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Exporta todas as funções
module.exports = {
  createOng,
  getAllOngs,
  getOngById,
  getOngUsers,
  updateOng,
  deleteOng,
  debitUserBalance,
};

