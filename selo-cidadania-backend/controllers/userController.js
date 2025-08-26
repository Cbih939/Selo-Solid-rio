const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todos os utilizadores comuns (role_id = 4)
exports.getAllUsers = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `
      SELECT id, name, email, seal_balance 
      FROM users 
      WHERE role_id = 4 AND (name LIKE ? OR email LIKE ?)
    `;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, cpf, phone, password, ong_id } = req.body;
  
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || 'senha_padrao', salt);
    const role_id = 4;

    await db.query(
      "INSERT INTO users (name, email, cpf, phone, password_hash, role_id, ong_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, cpf, phone, password_hash, role_id, ong_id || null]
    );
    res.status(201).json({ message: "Utilizador criado com sucesso." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('uc_cpf')) {
        return res.status(409).json({ message: "Este CPF já está registado." });
      }
      if (error.message.includes('email')) {
        return res.status(409).json({ message: "Este email já está a ser utilizado." });
      }
    }
    res.status(500).json({ error: error.message });
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

// UPDATE: Atualizar o perfil de um utilizador (usado pela página de perfil)
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

// UPDATE: Redefinir a senha de um utilizador (NOVO)
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Validação para garantir que uma senha foi enviada
  if (!password) {
    return res.status(400).json({ message: "A nova senha é obrigatória." });
  }

  try {
    // Encripta a nova senha
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Atualiza a senha no banco de dados
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

// UPDATE: Atualizar dados básicos de um utilizador (usado pela lista de admins)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json({ message: "Utilizador atualizado com sucesso..." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter o saldo de selos de um utilizador específico (NOVO)
exports.getUserBalance = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT seal_balance FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json(rows[0]); // Retorna o objeto { seal_balance: valor }
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

// POST: Criar um novo usuário (beneficiário) e os seus dependentes
exports.createUser = async (req, res) => {
  const { name, email, cpf, phone, password, ong_id, dependents } = req.body;
  const role_id = 4; // ID para o perfil 'user' (beneficiário)

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  // Validação do limite de dependentes
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

    // Se houver dependentes, insere-os na nova tabela
    if (dependents && dependents.length > 0) {
      const dependentsQuery = 'INSERT INTO dependents (user_id, full_name, cpf, phone, relationship) VALUES ?';
      // Mapeia os dados dos dependentes para o formato de inserção em massa
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

// --- NOVAS FUNÇÕES PARA GESTÃO DE DEPENDENTES ---

// GET: Listar os dependentes do beneficiário logado
exports.getDependents = async (req, res) => {
  // Assumimos que um middleware de autenticação adiciona o ID do usuário em req.user.id
  const userId = req.user.id; 

  try {
    const [dependents] = await db.query('SELECT * FROM dependents WHERE user_id = ?', [userId]);
    res.status(200).json(dependents);
  } catch (error) {
    console.error("Erro ao buscar dependentes:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
};

// POST: Adicionar um novo dependente para o beneficiário logado
exports.addDependent = async (req, res) => {
  const userId = req.user.id;
  const { fullName, cpf, phone, relationship } = req.body;

  if (!fullName || !relationship) {
    return res.status(400).json({ message: 'Nome completo e grau de parentesco são obrigatórios.' });
  }

  const connection = await db.getConnection();
  try {
    // Verifica o limite de dependentes
    const [countResult] = await connection.query('SELECT COUNT(id) as count FROM dependents WHERE user_id = ?', [userId]);
    if (countResult[0].count >= 20) {
      return res.status(400).json({ message: 'O limite de 20 dependentes foi atingido.' });
    }

    // Insere o novo dependente
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

// PUT: Atualizar um dependente existente
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

// DELETE: Excluir um dependente
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
