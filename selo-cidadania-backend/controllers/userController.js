// Arquivo: selo-cidadania-backend/controllers/userController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Função utilitária para formatar a data (AAAA-MM-DD)
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      name, cpf, phone, email, password, role, ong_id, address, dependents, profile_photo,
      mothers_name, birth_date, rg, gender, sexual_orientation,
      residence_time, housing_type, rooms_count, has_water, has_sanitation, has_electricity,
      family_income, household_size, education_level, employment_status,
      social_benefits, public_services_access, main_needs, traditional_community
    } = req.body;

    const benefitsStr = social_benefits ? JSON.stringify(social_benefits) : '[]';
    const servicesStr = public_services_access ? JSON.stringify(public_services_access) : '[]';
    const needsStr = main_needs ? JSON.stringify(main_needs) : '[]';
    const safeBirthDate = birth_date ? birth_date : null;

    const [userResult] = await connection.query(
      `INSERT INTO users (
        name, cpf, phone, email, password_hash, role_id, ong_id, profile_photo,
        logradouro, numero, complemento, bairro, cidade, estado, cep,
        mothers_name, birth_date, rg, gender, sexual_orientation,
        residence_time, housing_type, rooms_count, has_water, has_sanitation, has_electricity,
        family_income, household_size, education_level, employment_status,
        social_benefits, public_services_access, main_needs, traditional_community
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, cpf, phone, email, await bcrypt.hash(password, 10), 4, ong_id, profile_photo || null,
        address?.logradouro || null, address?.numero || null, address?.complemento || null,
        address?.bairro || null, address?.cidade || null, address?.estado || null, address?.cep || null,
        mothers_name || null, safeBirthDate, rg || null, gender || null, sexual_orientation || null,
        residence_time || null, housing_type || null, rooms_count || null, 
        has_water ? 1 : 0, has_sanitation ? 1 : 0, has_electricity ? 1 : 0,
        family_income || null, household_size || null, education_level || null, employment_status || null,
        benefitsStr, servicesStr, needsStr, traditional_community || null
      ]
    );

    const newUserId = userResult.insertId;

    if (dependents && dependents.length > 0) {
      for (let dep of dependents) {
        const depAddress = dep.same_address ? address : dep.address;
        await connection.query(
          `INSERT INTO dependents (user_id, full_name, birth_date, kinship, cpf, profile_photo, logradouro, numero, complemento, bairro, cidade, estado, cep) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newUserId, dep.full_name || dep.name, dep.birth_date || null, dep.kinship, dep.cpf || null, dep.profile_photo || null,
            depAddress?.logradouro || null, depAddress?.numero || null, depAddress?.complemento || null,
            depAddress?.bairro || null, depAddress?.cidade || null, depAddress?.estado || null, depAddress?.cep || null
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

// GET: Obter o perfil do PRÓPRIO utilizador logado COM DADOS DO MAPEAMENTO SOCIAL
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT 
        u.*, -- Trazemos todos os campos, incluindo os novos do mapeamento
        r.name as role,
        o.fantasy_name as ong_name,
        o.logo_url as ong_logo_url,
        o.whatsapp as ong_whatsapp,
        o.instagram as ong_instagram,
        o.facebook as ong_facebook,
        o.website as ong_website
      FROM users u 
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN ongs o ON u.ong_id = o.id
      WHERE u.id = ?
    `;

    const [users] = await db.query(query, [userId]);

    if (users.length === 0) {
        return res.status(404).json({ message: "Utilizador não encontrado." });
    }
    
    let userData = users[0];
    
    // Tratamento dos campos de arrays que vêm como strings do banco (ex: "[CRAS, Posto]")
    try {
        userData.social_benefits = userData.social_benefits ? JSON.parse(userData.social_benefits) : [];
        userData.public_services_access = userData.public_services_access ? JSON.parse(userData.public_services_access) : [];
        userData.main_needs = userData.main_needs ? JSON.parse(userData.main_needs) : [];
    } catch(e) {
        console.warn("Erro ao parsear arrays do usuário", e);
        userData.social_benefits = [];
        userData.public_services_access = [];
        userData.main_needs = [];
    }

    // Formata a data de nascimento para o input do HTML
    userData.birth_date = formatDate(userData.birth_date);

    res.status(200).json(userData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Atualizar o PRÓPRIO perfil (Geral)
// UPDATE: Atualizar o PRÓPRIO perfil (Geral)
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, phone, profile_photo, password } = req.body;
    
    try {
        let query = "UPDATE users SET name = ?, email = ?, phone = ?";
        let params = [name, email, phone];

        // Se enviou uma foto nova, adiciona à query
        if (profile_photo !== undefined) {
            query += ", profile_photo = ?";
            params.push(profile_photo);
        }

        // Se enviou uma senha nova, criptografa e adiciona à query
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ", password_hash = ?";
            params.push(password_hash);
        }

        query += " WHERE id = ?";
        params.push(userId);

        await db.query(query, params);
        res.status(200).json({ message: "Perfil atualizado com sucesso." });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ error: error.message });
    }
};

// UPDATE: Perfil do próprio utilizador (Dados Pessoais + Endereço + Dependentes + Mapeamento)
exports.updateUserProfile = async (req, res) => {
  const userId = req.params.id || req.user.id;
  const { 
    name, phone, profile_photo, address, dependents,
    mothers_name, birth_date, rg, gender, sexual_orientation,
    residence_time, housing_type, rooms_count, has_water, has_sanitation, has_electricity,
    family_income, household_size, education_level, employment_status,
    social_benefits, public_services_access, main_needs, traditional_community
  } = req.body;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Transformamos os arrays num texto (JSON) para guardar no MySQL
    const benefitsStr = social_benefits ? JSON.stringify(social_benefits) : '[]';
    const servicesStr = public_services_access ? JSON.stringify(public_services_access) : '[]';
    const needsStr = main_needs ? JSON.stringify(main_needs) : '[]';
    const safeBirthDate = birth_date ? birth_date : null;

    // 1. Atualizar Titular e Mapeamento Social
    const userQuery = `
      UPDATE users SET 
        name = ?, phone = ?, profile_photo = ?,
        logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, cep = ?,
        mothers_name = ?, birth_date = ?, rg = ?, gender = ?, sexual_orientation = ?,
        residence_time = ?, housing_type = ?, rooms_count = ?, has_water = ?, has_sanitation = ?, has_electricity = ?,
        family_income = ?, household_size = ?, education_level = ?, employment_status = ?,
        social_benefits = ?, public_services_access = ?, main_needs = ?, traditional_community = ?
      WHERE id = ?
    `;
    
    await connection.query(userQuery, [
      name, phone, profile_photo || null,
      address?.logradouro || null, address?.numero || null, address?.complemento || null,
      address?.bairro || null, address?.cidade || null, address?.estado || null, address?.cep || null,
      
      mothers_name || null, safeBirthDate, rg || null, gender || null, sexual_orientation || null,
      residence_time || null, housing_type || null, rooms_count || null, 
      has_water ? 1 : 0, has_sanitation ? 1 : 0, has_electricity ? 1 : 0,
      family_income || null, household_size || null, education_level || null, employment_status || null,
      benefitsStr, servicesStr, needsStr, traditional_community || null,
      
      userId
    ]);

    // 2. Atualizar Dependentes (Mantido intacto para não quebrar o seu trabalho anterior)
    if (dependents && Array.isArray(dependents)) {
      await connection.query("DELETE FROM dependents WHERE user_id = ?", [userId]);

      for (const dep of dependents) {
        const dLogradouro = dep.same_address ? address?.logradouro : (dep.logradouro || null);
        const dNumero = dep.same_address ? address?.numero : (dep.numero || null);
        const dBairro = dep.same_address ? address?.bairro : (dep.bairro || null);
        const dCidade = dep.same_address ? address?.cidade : (dep.cidade || null);
        const dEstado = dep.same_address ? address?.estado : (dep.estado || null);
        const dCep = dep.same_address ? address?.cep : (dep.cep || null);

        const depQuery = `
          INSERT INTO dependents 
          (user_id, full_name, cpf, kinship, birth_date, profile_photo, logradouro, numero, bairro, cidade, estado, cep)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.query(depQuery, [
          userId,
          dep.full_name || dep.name || 'Dependente',
          dep.cpf || '', 
          dep.kinship || 'Outro',
          dep.birth_date || null,
          dep.profile_photo || null,
          dLogradouro, dNumero, dBairro, dCidade, dEstado, dCep
        ]);
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Perfil e Mapeamento Social atualizados com sucesso!" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro no SQL ao atualizar perfil:", error);
    res.status(500).json({ error: error.message });
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

// GET: Obter usuário por ID (Atualizado para ler o Mapeamento Social)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "Não encontrado." });
    
    let user = users[0];

    // Tratamento dos arrays do Mapeamento Social
    try {
        user.social_benefits = user.social_benefits ? JSON.parse(user.social_benefits) : [];
        user.public_services_access = user.public_services_access ? JSON.parse(user.public_services_access) : [];
        user.main_needs = user.main_needs ? JSON.parse(user.main_needs) : [];
    } catch(e) {
        user.social_benefits = [];
        user.public_services_access = [];
        user.main_needs = [];
    }

    // Formatar a data de nascimento para o input do HTML
    if (user.birth_date) {
        const d = new Date(user.birth_date);
        if (!isNaN(d.getTime())) {
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            user.birth_date = `${year}-${month}-${day}`;
        }
    }

    const [dependents] = await db.query("SELECT * FROM dependents WHERE user_id = ?", [userId]);
    user.dependents = dependents;
    res.status(200).json(user);
  } catch (error) {
    console.error("Erro em getUserById:", error);
    res.status(500).json({ error: "Erro interno." });
  }
};