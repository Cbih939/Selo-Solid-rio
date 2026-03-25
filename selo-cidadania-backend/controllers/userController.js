// Arquivo: selo-cidadania-backend/controllers/userController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ: Listar todos os utilizadores (para admin)
exports.getAllUsers = async (req, res) => {
  const searchTerm = req.query.search || '';
  try {
    const query = `SELECT id, name, cpf, email, seal_balance FROM users WHERE role_id = 4 AND (name LIKE ? OR email LIKE ? OR cpf LIKE ?)`;
    const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter os detalhes de um usuário e seus dependentes (para o modal da ONG)
exports.getUserDetails = async (req, res) => {
  const { id } = req.params;
  const requestingUser = req.user;

  try {
    let query = "SELECT id, name, email, cpf, phone, seal_balance, created_at FROM users WHERE id = ?";
    const params = [id];

    if (requestingUser.role !== 'admin5' && requestingUser.role !== 'admin1') {
        query += " AND ong_id = ?";
        params.push(requestingUser.ong_id);
    }

    const [userRows] = await db.query(query, params);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Beneficiário não encontrado ou você não tem permissão para vê-lo." });
    }

    const usuario = userRows[0];
    const [dependentes] = await db.query("SELECT id, full_name, relationship, birth_date FROM dependents WHERE user_id = ?", [id]);
    
    res.status(200).json({ usuario: usuario, dependentes: dependentes || [] });

  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.', error: error.message });
  }
};

// POST: Criar um novo usuário (beneficiário) e seus dependentes (pelo coordenador)
exports.createUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      name, cpf, phone, email, password, role, ong_id, 
      address, 
      dependents,
      profile_photo 
    } = req.body;

    const [userResult] = await connection.query(
      `INSERT INTO users (name, cpf, phone, email, password, role, ong_id, logradouro, numero, complemento, bairro, cidade, estado, cep, profile_photo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, cpf, phone, email, password, role, ong_id,
        address?.logradouro || null, address?.numero || null, address?.complemento || null,
        address?.bairro || null, address?.cidade || null, address?.estado || null, address?.cep || null,
        profile_photo || null 
      ]
    );

    const newUserId = userResult.insertId;

    if (dependents && dependents.length > 0) {
      for (let dep of dependents) {
        const depAddress = dep.sameAddress ? address : dep.address;
        await connection.query(
          `INSERT INTO dependents (user_id, full_name, birth_date, relationship, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, profile_photo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newUserId, dep.fullName, dep.birth_date, dep.relationship, dep.cpf || null,
            depAddress?.logradouro || null, depAddress?.numero || null, depAddress?.complemento || null,
            depAddress?.bairro || null, depAddress?.cidade || null, depAddress?.estado || null, depAddress?.cep || null,
            dep.profile_photo || null 
          ]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: "Beneficiário cadastrado com sucesso!" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// GET: Obter o perfil do PRÓPRIO utilizador logado
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT 
        u.id, u.name, u.email, u.cpf, u.phone, u.ong_id, u.seal_balance, u.profile_photo,
        u.logradouro, u.numero, u.complemento, u.bairro, u.cidade, u.estado, u.cep,
        r.name as role,
        o.fantasy_name as ong_name,
        o.logo_url as ong_logo_url
      FROM users u 
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN ongs o ON u.ong_id = o.id
      WHERE u.id = ?
    `;

    const [users] = await db.query(query, [userId]);

    if (users.length === 0) {
        return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    res.status(200).json(users[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Atualizar o PRÓPRIO perfil (Geral)
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, phone } = req.body;
    try {
        await db.query("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?", [name, email, phone, userId]);
        res.status(200).json({ message: "Perfil atualizado com sucesso." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ++ NOVA FUNÇÃO: Atualizar perfil estendido (Foto e Endereço) ++
// Esta é a função que estava faltando e causava o erro!
// UPDATE: Perfil do próprio utilizador (Dados Pessoais + Endereço + Dependentes)
exports.updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, phone, profile_photo, address, dependents } = req.body;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. ATUALIZAR TITULAR (Garante que os nomes das colunas batem com o banco)
    const userQuery = `
      UPDATE users SET 
        name = ?, phone = ?, profile_photo = ?,
        logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, cep = ?
      WHERE id = ?
    `;
    
    await connection.query(userQuery, [
      name, phone, profile_photo || null,
      address?.logradouro || null, 
      address?.numero || null, 
      address?.complemento || null,
      address?.bairro || null, 
      address?.cidade || null, 
      address?.estado || null, 
      address?.cep || null,
      userId
    ]);

    // 2. ATUALIZAR DEPENDENTES
    if (dependents && Array.isArray(dependents)) {
      // Remove dependentes antigos para evitar conflitos de ID ou duplicados
      await connection.query("DELETE FROM dependents WHERE user_id = ?", [userId]);

      for (const dep of dependents) {
        // CORREÇÃO DO ERRO DE CPF: 
        // Se o CPF vier vazio ou null, enviamos uma string vazia '' ou um valor padrão 
        // caso o seu banco não aceite NULL.
        const safeCpf = dep.cpf && dep.cpf.trim() !== '' ? dep.cpf : '000.000.000-00'; 

        const depQuery = `
          INSERT INTO dependents 
          (user_id, full_name, cpf, kinship, birth_date, logradouro, numero, bairro, cidade, estado, cep)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.query(depQuery, [
          userId,
          dep.full_name || dep.name,
          safeCpf, // <--- Aqui está a correção para o erro do log
          dep.kinship || dep.relationship || 'Dependente',
          dep.birth_date || null,
          dep.logradouro || address?.logradouro || null,
          dep.numero || address?.numero || null,
          dep.bairro || address?.bairro || null,
          dep.cidade || address?.cidade || null,
          dep.estado || address?.estado || null,
          dep.cep || address?.cep || null
        ]);
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Perfil e dependentes atualizados com sucesso!" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("ERRO CRÍTICO NO BANCO:", error.sqlMessage || error.message);
    res.status(500).json({ 
      error: "Erro ao salvar dados.", 
      sqlError: error.sqlMessage 
    });
  } finally {
    if (connection) connection.release();
  }
};

// UPDATE: Redefinir a senha de um utilizador (pelo coordenador)
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: "A nova senha é obrigatória." });
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const [result] = await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Utilizador não encontrado." });
    res.status(200).json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Atualizar dados básicos de um utilizador (pelo coordenador)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, cpf } = req.body;
  
  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, cpf = ? WHERE id = ?", 
      [name, email, phone, cpf, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    res.status(200).json({ message: "Usuário atualizado com sucesso." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'O Email ou CPF informado já está em uso.' });
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

// DELETE: Excluir um utilizador comum (pelo coordenador)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query("DELETE FROM dependents WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM social_proofs WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM redemptions WHERE user_id = ?", [id]);

    const [result] = await connection.query("DELETE FROM users WHERE id = ? AND role_id = 4", [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    await connection.commit();
    res.status(200).json({ message: "Dados excluídos com sucesso." });

  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: "Erro ao excluir. O usuário possui vínculos ativos." });
  } finally {
    if (connection) connection.release();
  }
};

// --- GESTÃO DE DEPENDENTES ---
exports.getMyDependents = async (req, res) => {
  const userId = req.user.id; 
  try {
    const [dependents] = await db.query('SELECT * FROM dependents WHERE user_id = ?', [userId]);
    res.status(200).json(dependents);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dependentes." });
  }
};

exports.addMyDependent = async (req, res) => {
  const userId = req.user.id;
  const { fullName, cpf, phone, relationship, birth_date } = req.body;
  try {
    const [countResult] = await db.query('SELECT COUNT(id) as count FROM dependents WHERE user_id = ?', [userId]);
    if (countResult[0].count >= 20) return res.status(400).json({ message: 'Limite atingido.' });
    const [result] = await db.query('INSERT INTO dependents (user_id, full_name, cpf, phone, relationship, birth_date) VALUES (?, ?, ?, ?, ?, ?)', [userId, fullName, cpf || null, phone || null, relationship, birth_date || null]);
    res.status(201).json({ message: 'Dependente adicionado.', dependentId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Erro interno." });
  }
};

exports.updateMyDependent = async (req, res) => {
  const userId = req.user.id;
  const { dependentId } = req.params;
  const { fullName, cpf, phone, relationship, birth_date } = req.body;
  try {
    const [result] = await db.query('UPDATE dependents SET full_name = ?, cpf = ?, phone = ?, relationship = ?, birth_date = ? WHERE id = ? AND user_id = ?', [fullName, cpf, phone, relationship, birth_date, dependentId, userId]);
    res.status(200).json({ message: 'Atualizado.' });
  } catch (error) {
    res.status(500).json({ error: "Erro interno." });
  }
};

exports.deleteMyDependent = async (req, res) => {
  const userId = req.user.id;
  const { dependentId } = req.params;
  try {
    await db.query('DELETE FROM dependents WHERE id = ? AND user_id = ?', [dependentId, userId]);
    res.status(200).json({ message: 'Excluído.' });
  } catch (error) {
    res.status(500).json({ error: "Erro interno." });
  }
};

// DEBIT: Debitar selos (pelo coordenador)
exports.debitSeals = async (req, res) => {
  const { userId } = req.params;
  const { amount, prizeId } = req.body; 
  const ongId = req.user.ong_id;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT seal_balance FROM users WHERE id = ? AND ong_id = ? FOR UPDATE', [userId, ongId]);
    
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    const currentBalance = users[0].seal_balance;
    if (currentBalance < amount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Saldo insuficiente.' });
    }

    const newBalance = currentBalance - amount;
    await connection.query('UPDATE users SET seal_balance = ? WHERE id = ?', [newBalance, userId]);
    await connection.query('INSERT INTO redemptions (user_id, prize_id, redemption_date, status) VALUES (?, ?, NOW(), "completed")', [userId, prizeId || 1]);
    
    await connection.commit();
    res.status(200).json({ message: 'Débito realizado.', newBalance });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Erro no servidor.' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getMyBalance = async (req, res) => {
 const userId = req.user.id;
 try {
  const [rows] = await db.query("SELECT seal_balance FROM users WHERE id = ?", [userId]);
  res.status(200).json({ seal_balance: rows[0]?.seal_balance || 0 });
 } catch (error) {
  res.status(500).json({ error: "Erro interno." });
 }
};

exports.redeemFirstLoginBonus = async (req, res) => {
    const userId = req.user.id;
    const ongId = req.user.ong_id; 
    const FIRST_LOGIN_DESCRIPTION = 'Realizar o login de acesso ao Programa Selo Cidadania';
    
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [action] = await connection.query("SELECT id, seal_value FROM proof_activities WHERE description = ?", [FIRST_LOGIN_DESCRIPTION]);
        if (action.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Atividade não encontrada." });
        }

        const activityId = action[0].id;
        const sealsToAward = action[0].seal_value;

        const [existingProof] = await connection.query("SELECT id FROM social_proofs WHERE user_id = ? AND activity_id = ?", [userId, activityId]);
        if (existingProof.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Bônus já resgatado." });
        }

        await connection.query(`INSERT INTO social_proofs (user_id, activity_id, status, submission_date, validation_date, feedback_message, ong_id) VALUES (?, ?, 'approved', NOW(), NOW(), 'Automático', ?)`, [userId, activityId, ongId]);
        await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [sealsToAward, userId]);

        await connection.commit();
        res.status(200).json({ message: `Sucesso! Recebeu ${sealsToAward} selos.` });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "Não encontrado." });
    const user = users[0];
    const [dependents] = await db.query("SELECT * FROM dependents WHERE user_id = ?", [userId]);
    user.dependents = dependents;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro interno." });
  }
};