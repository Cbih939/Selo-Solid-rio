const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Função para formatar a data corretamente (YYYY-MM-DD)
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

// ==================================================================
// ===== FUNÇÃO createOng COM A LÓGICA DE ARQUIVOS CORRIGIDA =====
// ==================================================================
exports.createOng = async (req, res) => {
  const connection = await db.getConnection();
  try {
    console.log('[CREATE ONG] --- Início do Processo ---');
    console.log('[CREATE ONG] Arquivos recebidos:', req.files); // Log para ver o que o multer processou
    console.log('[CREATE ONG] Corpo da requisição:', req.body);

    // 1. Extrai os caminhos dos arquivos do req.files
    // O multer nos dá um objeto onde a chave é o fieldname ('logo_file', etc.)
    // e o valor é um array de objetos de arquivo. Pegamos o primeiro (e único) arquivo.
    const logo_url = req.files?.logo_file ? `/uploads/${req.files.logo_file[0].filename}` : null;
    const ata_url = req.files?.ata_file ? `/uploads/${req.files.ata_file[0].filename}` : null;
    const statute_url = req.files?.statute_file ? `/uploads/${req.files.statute_file[0].filename}` : null;

    console.log(`[CREATE ONG] URLs geradas: Logo[${logo_url}], Ata[${ata_url}], Estatuto[${statute_url}]`);

    // 2. Extrai os dados de texto do req.body
    const {
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, website, instagram, zip_code, address,
      address_number, district, city, state, country,
      president_name, president_cpf, // Dados do Presidente
      responsible_name, responsible_cpf, responsible_email, responsible_phone, responsible_password // Dados do Coordenador (usuário)
    } = req.body;

    // 3. Validação dos dados obrigatórios
    if (!responsible_name || !responsible_cpf || !responsible_email || !responsible_password) {
      return res.status(400).json({ error: "Dados do Coordenador (Nome, CPF, E-mail, Senha) são obrigatórios." });
    }
    if (!fantasy_name || !cnpj || !president_name || !president_cpf) {
      return res.status(400).json({ error: "Campos da ONG (Nome Fantasia, CNPJ) e do Presidente (Nome, CPF) são obrigatórios." });
    }

    // Inicia a transação com o banco de dados
    await connection.beginTransaction();

    // 4. Cria o usuário (Coordenador) primeiro
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(responsible_password, salt);

    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, responsible_cpf, responsible_phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`,
      [responsible_name, responsible_email, passwordHash, responsible_cpf, responsible_phone]
    );
    const responsible_user_id = userResult.insertId;
    console.log(`[CREATE ONG] Usuário Coordenador criado com ID: ${responsible_user_id}`);

    // 5. Cria a ONG, agora incluindo as URLs dos arquivos e os dados do presidente
    const formattedDate = formatDate(foundation_date);
    const ongQuery = `
      INSERT INTO ongs (
        fantasy_name, corporate_name, cnpj, foundation_date, 
        logo_url, ata_url, statute_url, 
        contact_email, phone, website, instagram, 
        zip_code, address, address_number, district, city, state, country, 
        responsible_user_id, responsible_name, responsible_cpf
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const ongParams = [
      fantasy_name, corporate_name, cnpj, formattedDate,
      logo_url, ata_url, statute_url,
      contact_email, phone, website, instagram,
      zip_code, address, address_number, district, city, state, country,
      responsible_user_id, president_name, president_cpf // Usando os dados do presidente aqui
    ];
    
    const [ongResult] = await connection.query(ongQuery, ongParams);
    const ong_id = ongResult.insertId;
    console.log(`[CREATE ONG] ONG criada com ID: ${ong_id}`);

    // 6. Atualiza o usuário recém-criado com o ID da ONG
    await connection.query('UPDATE users SET ong_id = ? WHERE id = ?', [ong_id, responsible_user_id]);

    // Finaliza a transação
    await connection.commit();
    console.log('[CREATE ONG] --- Processo Concluído com Sucesso ---');
    res.status(201).json({ message: "OSC e usuário responsável criados com sucesso." });

  } catch (error) {
    // Em caso de erro, desfaz todas as operações
    await connection.rollback();
    console.error('!!!!!! [CREATE ONG] ERRO FATAL NO PROCESSO !!!!!!', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor ao tentar criar a OSC.' });
  } finally {
    // Libera a conexão com o banco de dados
    connection.release();
  }
};


// ==================================================================
// ===== FUNÇÃO updateOng COM A LÓGICA DE ARQUIVOS CORRIGIDA =====
// ==================================================================
exports.updateOng = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`[UPDATE ONG ID: ${id}] --- Início do Processo ---`);
    console.log('[UPDATE ONG] Arquivos recebidos:', req.files);
    console.log('[UPDATE ONG] Corpo da requisição:', req.body);

    // Busca os dados atuais da ONG para obter as URLs dos arquivos antigos
    const [currentOng] = await db.query('SELECT logo_url, ata_url, statute_url FROM ongs WHERE id = ?', [id]);
    if (currentOng.length === 0) {
      return res.status(404).json({ error: 'OSC não encontrada.' });
    }

    // Lógica para decidir se usa o novo arquivo ou mantém o antigo
    const logo_url = req.files?.logo_file ? `/uploads/${req.files.logo_file[0].filename}` : currentOng[0].logo_url;
    const ata_url = req.files?.ata_file ? `/uploads/${req.files.ata_file[0].filename}` : currentOng[0].ata_url;
    const statute_url = req.files?.statute_file ? `/uploads/${req.files.statute_file[0].filename}` : currentOng[0].statute_url;

    console.log(`[UPDATE ONG] URLs finais: Logo[${logo_url}], Ata[${ata_url}], Estatuto[${statute_url}]`);

    const {
      fantasy_name, corporate_name, cnpj, foundation_date,
      contact_email, phone, website, instagram, zip_code, address,
      address_number, district, city, state,
      president_name, president_cpf
    } = req.body;

    const formattedDate = formatDate(foundation_date);

    const updateQuery = `
      UPDATE ongs SET
        fantasy_name = ?, corporate_name = ?, cnpj = ?, foundation_date = ?,
        contact_email = ?, phone = ?, website = ?, instagram = ?,
        zip_code = ?, address = ?, address_number = ?, district = ?, city = ?, state = ?,
        responsible_name = ?, responsible_cpf = ?,
        logo_url = ?, ata_url = ?, statute_url = ?
      WHERE id = ?
    `;
    const updateParams = [
      fantasy_name, corporate_name, cnpj, formattedDate,
      contact_email, phone, website, instagram,
      zip_code, address, address_number, district, city, state,
      president_name, president_cpf,
      logo_url, ata_url, statute_url,
      id
    ];

    await db.query(updateQuery, updateParams);

    console.log(`[UPDATE ONG ID: ${id}] --- Processo Concluído com Sucesso ---`);
    res.status(200).json({ message: 'OSC atualizada com sucesso.' });

  } catch (error) {
    console.error(`!!!!!! [UPDATE ONG ID: ${id}] ERRO FATAL NO PROCESSO !!!!!!`, error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor ao tentar atualizar a OSC.' });
  }
};


// --- OUTRAS FUNÇÕES (sem alterações) ---

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
    res.status(500).json({ error: error.message });
  }
};

exports.getOngById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ongs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'OSC não encontrada.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOng = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("UPDATE users SET ong_id = NULL WHERE ong_id = ?", [id]);
    const [ongResult] = await connection.query("DELETE FROM ongs WHERE id = ?", [id]);
    if (ongResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "OSC não encontrada." });
    }
    await connection.commit();
    res.status(200).json({ message: "OSC excluída com sucesso." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

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
  if (parseInt(amount, 10) <= 0) {
    return res.status(400).json({ message: "O valor a ser debitado deve ser positivo." });
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT id, seal_balance FROM users WHERE id = ? AND ong_id = ? FOR UPDATE', [userId, ongId]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Operação não permitida. O usuário não pertence a esta OSC." });
    }
    const user = users[0];
    if (user.seal_balance < amount) {
      await connection.rollback();
      return res.status(400).json({ message: "Saldo insuficiente para realizar o débito." });
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
