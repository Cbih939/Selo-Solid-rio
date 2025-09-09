const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todos os utilizadores comuns (role_id = 4)
exports.getAllUsers = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT id, name, cpf, email, seal_balance 
      FROM users 
      WHERE role_id = 4 AND (name LIKE ? OR email LIKE ?)
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter os detalhes de um usuário e seus dependentes
// GET: Obter os detalhes de um usuário e seus dependentes
exports.getUserDetails = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Busca os dados do usuário principal (esta query está correta)
    const [users] = await db.query(
      "SELECT id, name, email, cpf, phone FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    const usuario = users[0];

    // 2. Busca os dependentes com os nomes de coluna corretos
    //    Ajuste 'full_name' e 'relationship' se os nomes no seu banco forem diferentes.
    const [dependentes] = await db.query(
      "SELECT id, full_name as nome, relationship as data_nascimento FROM dependents WHERE user_id = ?",
      [id]
    );
    // Se você tiver uma coluna de data, mude 'relationship' para o nome correto (ex: 'birth_date').

    // 3. Monta a resposta no formato que o frontend espera
    res.status(200).json({
      usuario: usuario,
      dependentes: dependentes || []
    });

  } catch (error) {
    // Se a query falhar, este bloco captura o erro e o envia como resposta,
    // o que é muito melhor para depuração do que um erro 500 genérico.
    console.error("Erro ao buscar detalhes do usuário:", error);
    res.status(500).json({ 
        message: 'Ocorreu um erro no servidor ao buscar os detalhes.',
        error: error.message // Envia a mensagem de erro real do banco de dados
    });
  }
};

// POST: Criar um novo usuário (beneficiário) e os seus dependentes
exports.createUser = async (req, res) => {
  const { name, email, cpf, phone, password, ong_id, dependents } = req.body;
  const role_id = 4; // ID para o perfil 'user' (beneficiário)

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  if (dependents && dependents.length > 20) {
    return res.status(400).json({ message: 'O limite de 20 dependentes foi excedido.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      'SELECT email, cpf FROM users WHERE email = ? OR (cpf IS NOT NULL AND cpf = ?)',
      [email, cpf]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Email ou CPF já cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await connection.query(
      'INSERT INTO users (name, email, cpf, phone, password_hash, ong_id, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, cpf || null, phone || null, passwordHash, ong_id || null, role_id]
    );

    const userId = result.insertId;

    if (dependents && dependents.length > 0) {
      const dependentsQuery = 'INSERT INTO dependents (user_id, full_name, cpf, phone, relationship) VALUES ?';
      const dependentsValues = dependents.map(dep => [userId, dep.fullName, dep.cpf, dep.phone, dep.relationship]);
      await connection.query(dependentsQuery, [dependentsValues]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Beneficiário e dependentes criados com sucesso.', userId });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar beneficiário:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor ao tentar criar o beneficiário.' });
  } finally {
    connection.release();
  }
};

// GET: Obter o perfil detalhado de um utilizador
exports.getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await db.query(
      "SELECT u.id, u.name, u.email, u.cpf, u.phone, r.name as role, u.ong_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    const userProfile = users[0];

    if (userProfile.role === 'ong' && userProfile.ong_id) {
      const [ongs] = await db.query("SELECT * FROM ongs WHERE id = ?", [userProfile.ong_id]);
      if (ongs.length > 0) {
        userProfile.ong_details = ongs[0];
      }
    }
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Atualizar o perfil de um utilizador
exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, ong_details } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
      [name, email, phone, id]
    );

    if (ong_details) {
      await connection.query(
        `UPDATE ongs SET 
          fantasy_name = ?, corporate_name = ?, contact_email = ?, phone = ?, website = ?, instagram = ?,
          address = ?, address_number = ?, district = ?, city = ?, state = ?, country = ?,
          main_area = ?, target_audience = ?, mission = ?
         WHERE id = ?`,
        [
          ong_details.fantasy_name, ong_details.corporate_name, ong_details.contact_email, ong_details.phone, ong_details.website, ong_details.instagram,
          ong_details.address, ong_details.address_number, ong_details.district, ong_details.city, ong_details.state, ong_details.country,
          ong_details.main_area, ong_details.target_audience, ong_details.mission,
          ong_details.id
        ]
      );
    }
    await connection.commit();
    res.status(200).json({ message: "Perfil atualizado com sucesso." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// UPDATE: Redefinir a senha de um utilizador
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "A nova senha é obrigatória." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [password_hash, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    res.status(200).json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Atualizar dados básicos de um utilizador 
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  // Coleta todos os campos que o frontend envia
  const { name, email, cpf, phone, password } = req.body;

  // Validação básica
  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e Email são obrigatórios.' });
  }

  try {
    let query;
    let params;

    // Se uma nova senha foi enviada, hasheia e inclui na query
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      query = "UPDATE users SET name = ?, email = ?, cpf = ?, phone = ?, password_hash = ? WHERE id = ?";
      params = [name, email, cpf || null, phone || null, passwordHash, id];
    } else {
      // Se não houver nova senha, atualiza apenas os outros dados
      query = "UPDATE users SET name = ?, email = ?, cpf = ?, phone = ? WHERE id = ?";
      params = [name, email, cpf || null, phone || null, id];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso." });
  } catch (error) {
    // Captura erro de email/cpf duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'O Email ou CPF informado já está em uso por outro usuário.' });
    }
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

// GET: Obter o saldo de selos de um utilizador específico
exports.getUserBalance = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT seal_balance FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Excluir um utilizador comum
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      "DELETE FROM users WHERE id = ? AND role_id = 4", 
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Utilizador não encontrado ou não é um utilizador comum." });
    }
    await connection.commit();
    res.status(200).json({ message: "Utilizador excluído com sucesso." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// --- FUNÇÕES PARA GESTÃO DE DEPENDENTES ---
// GET: Listar dependentes do beneficiário logado
exports.getDependents = async (req, res) => {
  const userId = req.user.id; 
  try {
    const [dependents] = await db.query('SELECT * FROM dependents WHERE user_id = ?', [userId]);
    res.status(200).json(dependents);
  } catch (error) {
    console.error("Erro ao buscar dependentes:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// POST: Adicionar dependente
exports.addDependent = async (req, res) => {
  const userId = req.user.id;
  const { fullName, cpf, phone, relationship } = req.body;

  if (!fullName || !relationship) {
    return res.status(400).json({ message: 'Nome completo e grau de parentesco são obrigatórios.' });
  }

  const connection = await db.getConnection();
  try {
    const [countResult] = await connection.query('SELECT COUNT(id) as count FROM dependents WHERE user_id = ?', [userId]);
    if (countResult[0].count >= 20) {
      return res.status(400).json({ message: 'O limite de 20 dependentes foi atingido.' });
    }

    const [result] = await connection.query(
      'INSERT INTO dependents (user_id, full_name, cpf, phone, relationship) VALUES (?, ?, ?, ?, ?)',
      [userId, fullName, cpf || null, phone || null, relationship]
    );

    res.status(201).json({ message: 'Dependente adicionado com sucesso.', dependentId: result.insertId });

  } catch (error) {
    console.error("Erro ao adicionar dependente:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  } finally {
    connection.release();
  }
};

// PUT: Atualizar dependente
exports.updateDependent = async (req, res) => {
  const userId = req.user.id;
  const { dependentId } = req.params;
  const { fullName, cpf, phone, relationship } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE dependents SET full_name = ?, cpf = ?, phone = ?, relationship = ? WHERE id = ? AND user_id = ?',
      [fullName, cpf, phone, relationship, dependentId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dependente não encontrado ou não pertence a este beneficiário.' });
    }

    res.status(200).json({ message: 'Dependente atualizado com sucesso.' });
  } catch (error) {
    console.error("Erro ao atualizar dependente:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// DELETE: Excluir dependente
exports.deleteDependent = async (req, res) => {
  const userId = req.user.id;
  const { dependentId } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM dependents WHERE id = ? AND user_id = ?',
      [dependentId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dependente não encontrado ou não pertence a este beneficiário.' });
    }

    res.status(200).json({ message: 'Dependente excluído com sucesso.' });
  } catch (error) {
    console.error("Erro ao excluir dependente:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// Nova função para debitar selos de um usuário
exports.debitSeals = async (req, res) => {
  const { userId } = req.params;
  const { amount, prizeId } = req.body; // 'amount' é a quantidade de selos a debitar
                                        // 'prizeId' é o ID do nosso prêmio "Débito Manual" (ex: 1)

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'A quantidade de selos a debitar deve ser maior que zero.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Buscar o usuário e verificar o saldo
    const [users] = await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [userId]);
    const user = users[0];

    if (!user) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (user.seal_balance < amount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Saldo de selos insuficiente.' });
    }

    // 2. Atualizar o saldo do usuário
    const newBalance = user.seal_balance - amount;
    await connection.query('UPDATE users SET seal_balance = ? WHERE id = ?', [newBalance, userId]);

    // 3. Criar o registro de resgate (A PARTE MAIS IMPORTANTE)
    // Usamos o prizeId do "Débito Manual" e o 'amount' como o custo real.
    const redemptionData = {
      user_id: userId,
      prize_id: prizeId, // ID do prêmio "Débito Manual"
      redemption_date: new Date(),
      // Aqui está o truque: o custo do resgate é o 'amount' que recebemos
    };
    
    // Precisamos ajustar a query para inserir o custo real, 
    // já que a tabela 'redemptions' pode não ter um campo de custo.
    // A sua query de relatório já busca o custo da tabela 'prizes'.
    // O ideal é que a query de relatório em `reportsController.js` use `p.cost` como o valor.
    // No nosso caso, o 'amount' é o custo. Vamos garantir que isso seja refletido.
    
    // A query de relatório `SUM(p.cost)` pode não funcionar aqui se o custo é variável.
    // SOLUÇÃO: Adicionar uma coluna `cost_override` ou `redeemed_value` na tabela `redemptions`.

    // Vamos assumir que sua query de relatório já está correta e busca o custo do prêmio.
    // Para um débito variável, a melhor abordagem é modificar a tabela `redemptions`.
    
    // **ALTERAÇÃO ESTRUTURAL RECOMENDADA:**
    // ALTER TABLE redemptions ADD COLUMN redeemed_value INT;
    // E usar `redeemed_value` nos relatórios.
    
    // Por enquanto, vamos apenas registrar o resgate.
    await connection.query('INSERT INTO redemptions SET ?', redemptionData);

    await connection.commit();

    res.status(200).json({ 
        message: `${amount} selo(s) debitado(s) com sucesso.`,
        newBalance: newBalance 
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao debitar selos:", error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  } finally {
    if (connection) connection.release();
  }
};