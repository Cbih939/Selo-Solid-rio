// Arquivo: selo-cidadania-backend/controllers/userController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ==================================================================
// ++ INÍCIO DA CORREÇÃO: Nova função para buscar detalhes completos ++
// ==================================================================
exports.getUserDetails = async (req, res) => {
  const { id } = req.params;
  // Assumindo que o middleware de autenticação adiciona o 'user' ao 'req'
  const ongId = req.user.ong_id; 

  try {
    // 1. Busca os dados do usuário titular, garantindo que ele pertence à ONG do coordenador
    const [userRows] = await db.query(
      "SELECT id, name, email, cpf, phone, seal_balance, created_at FROM users WHERE id = ? AND ong_id = ?",
      [id, ongId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Beneficiário não encontrado ou não pertence à sua ONG." });
    }
    const usuario = userRows[0];

    // 2. Busca os dependentes associados a esse usuário
    const [dependentes] = await db.query(
      "SELECT id, full_name, relationship, birth_date FROM dependents WHERE user_id = ?",
      [id]
    );

    // 3. Retorna o objeto combinado que o frontend espera
    res.status(200).json({
      usuario: usuario,
      dependentes: dependentes || []
    });

  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    res.status(500).json({ 
        message: 'Ocorreu um erro no servidor ao buscar os detalhes.',
        error: error.message
    });
  }
};
// ++ FIM DA CORREÇÃO ++
// ==================================================================


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

// POST: Criar um novo usuário (beneficiário) e os seus dependentes
exports.createUser = async (req, res) => {
  const { name, email, cpf, phone, password, dependents } = req.body;
  const ong_id = req.user.ong_id; // Pega o ID da ONG do coordenador logado
  const role_id = 4; // ID para "Beneficiário"

  if (!name || !password) {
    return res.status(400).json({ message: 'Nome e senha são obrigatórios.' });
  }
  if (dependents && dependents.length > 20) {
    return res.status(400).json({ message: 'O limite de 20 dependentes foi excedido.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    if (email) {
        const [existingEmail] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }
    }
    if (cpf) {
        const [existingCpf] = await connection.query('SELECT id FROM users WHERE cpf = ?', [cpf]);
        if (existingCpf.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Este CPF já está em uso.' });
        }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const [result] = await connection.query(
      'INSERT INTO users (name, email, cpf, phone, password_hash, ong_id, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email || null, cpf || null, phone || null, passwordHash, ong_id, role_id]
    );
    const userId = result.insertId;

    if (dependents && dependents.length > 0) {
      const dependentsQuery = 'INSERT INTO dependents (user_id, full_name, cpf, phone, relationship, birth_date) VALUES ?';
      const dependentsValues = dependents.map(dep => [userId, dep.fullName, dep.cpf, dep.phone, dep.relationship, dep.birth_date]);
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

// GET: Obter o perfil detalhado do PRÓPRIO utilizador logado
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const [users] = await db.query(
      "SELECT u.id, u.name, u.email, u.cpf, u.phone, r.name as role, u.ong_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Atualizar o PRÓPRIO perfil
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, phone } = req.body;
    try {
        await db.query(
            "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
            [name, email, phone, userId]
        );
        res.status(200).json({ message: "Perfil atualizado com sucesso." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE: Redefinir a senha de um utilizador (pelo coordenador)
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

// UPDATE: Atualizar dados básicos de um utilizador (pelo coordenador)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body; // Apenas nome e email podem ser editados aqui
  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e Email são obrigatórios.' });
  }
  try {
    const [result] = await db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.status(200).json({ message: "Usuário atualizado com sucesso." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'O Email informado já está em uso por outro usuário.' });
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

// DELETE: Excluir um utilizador comum (pelo coordenador)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM dependents WHERE user_id = ?", [id]);
    const [result] = await connection.query("DELETE FROM users WHERE id = ? AND role_id = 4", [id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Utilizador não encontrado ou não é um beneficiário." });
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

// --- FUNÇÕES PARA GESTÃO DE DEPENDENTES (pelo próprio usuário) ---
exports.getDependents = async (req, res) => {
  const userId = req.user.id; 
  try {
    const [dependents] = await db.query('SELECT * FROM dependents WHERE user_id = ?', [userId]);
    res.status(200).json(dependents);
  } catch (error) {
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

exports.addDependent = async (req, res) => {
  const userId = req.user.id;
  const { fullName, cpf, phone, relationship, birth_date } = req.body;
  if (!fullName || !relationship) {
    return res.status(400).json({ message: 'Nome completo e grau de parentesco são obrigatórios.' });
  }
  try {
    const [countResult] = await db.query('SELECT COUNT(id) as count FROM dependents WHERE user_id = ?', [userId]);
    if (countResult[0].count >= 20) {
      return res.status(400).json({ message: 'O limite de 20 dependentes foi atingido.' });
    }
    const [result] = await db.query(
      'INSERT INTO dependents (user_id, full_name, cpf, phone, relationship, birth_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, fullName, cpf || null, phone || null, relationship, birth_date || null]
    );
    res.status(201).json({ message: 'Dependente adicionado com sucesso.', dependentId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

exports.updateDependent = async (req, res) => {
  const userId = req.user.id;
  const { dependentId } = req.params;
  const { fullName, cpf, phone, relationship, birth_date } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE dependents SET full_name = ?, cpf = ?, phone = ?, relationship = ?, birth_date = ? WHERE id = ? AND user_id = ?',
      [fullName, cpf, phone, relationship, birth_date, dependentId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dependente não encontrado ou não pertence a este beneficiário.' });
    }
    res.status(200).json({ message: 'Dependente atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

exports.deleteDependent = async (req, res) => {
  const userId = req.user.id;
  const { dependentId } = req.params;
  try {
    const [result] = await db.query('DELETE FROM dependents WHERE id = ? AND user_id = ?', [dependentId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dependente não encontrado ou não pertence a este beneficiário.' });
    }
    res.status(200).json({ message: 'Dependente excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// DEBIT: Debitar selos (pelo coordenador)
exports.debitSeals = async (req, res) => {
  const { userId } = req.params;
  const { amount, reason } = req.body; 
  const ongId = req.user.ong_id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'A quantidade de selos a debitar deve ser maior que zero.' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'O motivo do débito é obrigatório.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query('SELECT * FROM users WHERE id = ? AND ong_id = ? FOR UPDATE', [userId, ongId]);
    const user = users[0];

    if (!user) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuário não encontrado ou não pertence à sua ONG.' });
    }

    if (user.seal_balance < amount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Saldo de selos insuficiente.' });
    }

    const newBalance = user.seal_balance - amount;
    await connection.query('UPDATE users SET seal_balance = ? WHERE id = ?', [newBalance, userId]);

    // Assumindo que a tabela 'redemptions' tem uma coluna 'reason' e 'redeemed_value'
    const redemptionData = {
      user_id: userId,
      ong_id: user.ong_id,
      reason: reason,
      redeemed_value: amount,
      redemption_date: new Date(),
    };
    // Esta query pode falhar se a tabela 'redemptions' não tiver as colunas 'reason' e 'redeemed_value'
    await connection.query('INSERT INTO redemptions SET ?', redemptionData);

    await connection.commit();

    res.status(200).json({ 
        message: `${amount} selo(s) debitado(s) com sucesso.`,
        newBalance: newBalance 
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao debitar selos:", error);
    res.status(500).json({ error: 'Erro interno do servidor ao processar o débito.' });
  } finally {
    if (connection) connection.release();
  }
};
