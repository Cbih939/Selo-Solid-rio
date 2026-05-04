// Arquivo: selo-cidadania-backend/controllers/userController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');

const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

exports.getUserDetails = async (req, res) => {
  const { id } = req.params;
  const requestingUser = req.user;

  try {
    // Adicionado race, pcd, course_interest na busca
    let query = "SELECT id, name, email, cpf, phone, seal_balance, created_at, attendance_status, analysis_message, last_analysis_date, race, pcd, course_interest FROM users WHERE id = ?";
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
    const [dependentes] = await db.query("SELECT id, full_name, relationship, birth_date, cpf FROM dependents WHERE user_id = ?", [id]);
    
    let status_history = [];
    try {
        const [historyRows] = await db.query("SELECT status, message, admin_name, created_at FROM status_history WHERE user_id = ? ORDER BY created_at DESC", [id]);
        status_history = historyRows;
    } catch(e) {}

    res.status(200).json({ usuario: usuario, dependentes: dependentes || [], status_history: status_history });

  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor.', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Adicionado race, pcd, course_interest
    const { 
      name, cpf, phone, email, password, role, ong_id, address, dependents, profile_photo,
      mothers_name, birth_date, rg, gender, sexual_orientation, race,
      residence_time, housing_type, rooms_count, has_water, has_sanitation, has_electricity,
      family_income, household_size, education_level, employment_status, course_interest, pcd,
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
        mothers_name, birth_date, rg, gender, sexual_orientation, race,
        residence_time, housing_type, rooms_count, has_water, has_sanitation, has_electricity,
        family_income, household_size, education_level, employment_status, course_interest, pcd,
        social_benefits, public_services_access, main_needs, traditional_community
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, cpf, phone, email, await bcrypt.hash(password, 10), 4, ong_id, profile_photo || null,
        address?.logradouro || null, address?.numero || null, address?.complemento || null,
        address?.bairro || null, address?.cidade || null, address?.estado || null, address?.cep || null,
        mothers_name || null, safeBirthDate, rg || null, gender || null, sexual_orientation || null, race || null,
        residence_time || null, housing_type || null, rooms_count || null, 
        has_water ? 1 : 0, has_sanitation ? 1 : 0, has_electricity ? 1 : 0,
        family_income || null, household_size || null, education_level || null, employment_status || null, course_interest || null, pcd || null,
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

exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT 
        u.*,
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

    userData.birth_date = formatDate(userData.birth_date);

    res.status(200).json(userData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, phone, profile_photo, password } = req.body;
    
    try {
        let query = "UPDATE users SET name = ?, email = ?, phone = ?";
        let params = [name, email, phone];

        if (profile_photo !== undefined) {
            query += ", profile_photo = ?";
            params.push(profile_photo);
        }

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

exports.updateUserProfile = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.params.id;
    
    // Adicionado race, pcd, course_interest
    const { 
      name, cpf, phone, email, password, profile_photo, address, dependents,
      mothers_name, birth_date, rg, gender, sexual_orientation, race,
      residence_time, housing_type, rooms_count, has_water, has_sanitation, has_electricity,
      family_income, household_size, education_level, employment_status, course_interest, pcd,
      social_benefits, public_services_access, main_needs, traditional_community
    } = req.body;

    const benefitsStr = social_benefits ? JSON.stringify(social_benefits) : '[]';
    const servicesStr = public_services_access ? JSON.stringify(public_services_access) : '[]';
    const needsStr = main_needs ? JSON.stringify(main_needs) : '[]';
    const safeBirthDate = birth_date ? birth_date : null;

    let query = `UPDATE users SET 
        name = ?, phone = ?, email = ?, 
        logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, cep = ?,
        mothers_name = ?, birth_date = ?, rg = ?, gender = ?, sexual_orientation = ?, race = ?,
        residence_time = ?, housing_type = ?, rooms_count = ?, has_water = ?, has_sanitation = ?, has_electricity = ?,
        family_income = ?, household_size = ?, education_level = ?, employment_status = ?, course_interest = ?, pcd = ?,
        social_benefits = ?, public_services_access = ?, main_needs = ?, traditional_community = ?`;
    
    let params = [
        name, phone, email,
        address?.logradouro || null, address?.numero || null, address?.complemento || null,
        address?.bairro || null, address?.cidade || null, address?.estado || null, address?.cep || null,
        mothers_name || null, safeBirthDate, rg || null, gender || null, sexual_orientation || null, race || null,
        residence_time || null, housing_type || null, rooms_count || null, 
        has_water ? 1 : 0, has_sanitation ? 1 : 0, has_electricity ? 1 : 0,
        family_income || null, household_size || null, education_level || null, employment_status || null, course_interest || null, pcd || null,
        benefitsStr, servicesStr, needsStr, traditional_community || null
    ];

    if (cpf !== undefined) {
        query += ", cpf = ?";
        params.push(cpf);
    }

    if (profile_photo !== undefined) {
        query += ", profile_photo = ?";
        params.push(profile_photo);
    }

    if (password && password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        query += ", password_hash = ?";
        params.push(await bcrypt.hash(password, salt));
    }

    query += " WHERE id = ?";
    params.push(userId);

    await connection.query(query, params);

    if (dependents) {
      await connection.query("DELETE FROM dependents WHERE user_id = ?", [userId]);
      for (let dep of dependents) {
        const depAddress = dep.same_address ? address : dep.address;
        await connection.query(
          `INSERT INTO dependents (user_id, full_name, birth_date, kinship, cpf, profile_photo, logradouro, numero, complemento, bairro, cidade, estado, cep) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, dep.full_name || dep.name, dep.birth_date || null, dep.kinship, dep.cpf || null, dep.profile_photo || null,
            depAddress?.logradouro || null, depAddress?.numero || null, depAddress?.complemento || null,
            depAddress?.bairro || null, depAddress?.cidade || null, depAddress?.estado || null, depAddress?.cep || null
          ]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Perfil e Mapeamento Social atualizados com sucesso." });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao atualizar perfil do usuário:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

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

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query("DELETE FROM dependents WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM social_proofs WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM redemptions WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM status_history WHERE user_id = ?", [id]);

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
    const [result] = await db.query('INSERT INTO dependents (user_id, full_name, cpf, phone, kinship, birth_date) VALUES (?, ?, ?, ?, ?, ?)', [userId, fullName, cpf || null, phone || null, relationship, birth_date || null]);
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
    const [result] = await db.query('UPDATE dependents SET full_name = ?, cpf = ?, phone = ?, kinship = ?, birth_date = ? WHERE id = ? AND user_id = ?', [fullName, cpf, phone, relationship, birth_date, dependentId, userId]);
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

// =========================================================================
// CORREÇÃO: DÉBITO MANUAL DE SELOS (COM MOTIVO E VALOR PERSONALIZADOS)
// =========================================================================
exports.debitSeals = async (req, res) => {
  const { userId } = req.params;
  const { amount, reason } = req.body; 

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    // Busca o saldo atual do utilizador
    const [users] = await connection.query('SELECT seal_balance FROM users WHERE id = ? FOR UPDATE', [userId]);
    
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    const currentBalance = users[0].seal_balance;
    if (currentBalance < amount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Saldo insuficiente na carteira do beneficiário.' });
    }

    const newBalance = currentBalance - amount;
    const finalReason = reason || 'Débito Manual da OSC';
    
    // 1. Deduz os selos da conta do utilizador
    await connection.query('UPDATE users SET seal_balance = ? WHERE id = ?', [newBalance, userId]);
    
    // 2. Grava o débito na tabela de resgates para a auditoria
    await connection.query(
      'INSERT INTO redemptions (user_id, prize_name, seals_redeemed, redemption_date, status) VALUES (?, ?, ?, NOW(), "completed")', 
      [userId, finalReason, amount]
    );
    
    await connection.commit();
    res.status(200).json({ message: 'Débito realizado com sucesso!', newBalance });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro no debitSeals:", error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar o débito.' });
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

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "Não encontrado." });
    
    let user = users[0];

    try {
        user.social_benefits = user.social_benefits ? JSON.parse(user.social_benefits) : [];
        user.public_services_access = user.public_services_access ? JSON.parse(user.public_services_access) : [];
        user.main_needs = user.main_needs ? JSON.parse(user.main_needs) : [];
    } catch(e) {
        user.social_benefits = [];
        user.public_services_access = [];
        user.main_needs = [];
    }

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

exports.sendSeals = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const ong_id = req.body.ong_id || req.user.ong_id; 
    const evaluator_name = req.user.name || 'Coordenador';
    const { targetType, userId, amount, reason } = req.body;
    const sealAmount = parseInt(amount, 10);

    if (!sealAmount || sealAmount <= 0) {
        throw new Error("Quantidade de selos inválida.");
    }

    const title = reason ? `Bônus: ${reason}` : 'Bônus/Envio Direto da OSC';

    if (targetType === 'all') {
        const [users] = await connection.query("SELECT id FROM users WHERE ong_id = ? AND role_id = 4", [ong_id]);
        
        if(users.length === 0) {
            throw new Error("Não existem beneficiários cadastrados nesta OSC.");
        }

        for (let u of users) {
            await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [sealAmount, u.id]);
            await connection.query(
                "INSERT INTO social_proofs (user_id, ong_id, title, status, seal_value, created_at, evaluated_at, evaluator_name, feedback_message) VALUES (?, ?, ?, 'approved', ?, NOW(), NOW(), ?, ?)",
                [u.id, ong_id, title, sealAmount, evaluator_name, 'Envio em lote pelo coordenador']
            );
        }
    } else {
        if (!userId) throw new Error("Usuário não selecionado.");
        await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [sealAmount, userId]);
        await connection.query(
            "INSERT INTO social_proofs (user_id, ong_id, title, status, seal_value, created_at, evaluated_at, evaluator_name, feedback_message) VALUES (?, ?, ?, 'approved', ?, NOW(), NOW(), ?, ?)",
            [userId, ong_id, title, sealAmount, evaluator_name, 'Envio direto pelo coordenador']
        );
    }

    await connection.commit();
    res.status(200).json({ message: "Selos enviados com sucesso!" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao enviar selos:", error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.redeemFirstLoginBonus = async (req, res) => {
  try {
    res.status(200).json({ message: "Rota de primeiro login ativada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao resgatar bônus." });
  }
};

// =========================================================================
// CORREÇÃO: BUSCAR O NOME REAL DO ADMINISTRADOR NO BANCO DE DADOS
// =========================================================================
exports.updateAttendance = async (req, res) => {
  const { userId } = req.params;
  const { status, message } = req.body; 
  
  // ID do gestor que está logado e fez a requisição
  const adminId = req.user.id; 

  try {
    const db = require('../config/db'); // Garante que puxa a conexão

    // 1. Busca o nome exato do administrador logado (Ex: "Viviane Ferreira")
    const [adminRows] = await db.query("SELECT name FROM users WHERE id = ?", [adminId]);
    const realAdminName = adminRows.length > 0 ? adminRows[0].name : "Equipa da OSC";

    // 2. Atualiza o status atual e força o uso do NOW()
    await db.query(
      "UPDATE users SET attendance_status = ?, analysis_message = ?, last_analysis_date = NOW() WHERE id = ?",
      [status, message || null, userId]
    );

    // 3. Grava o histórico usando o nome real extraído do banco
    try {
      await db.query(
        "INSERT INTO status_history (user_id, status, message, admin_name, created_at) VALUES (?, ?, ?, ?, NOW())",
        [userId, status, message || null, realAdminName]
      );
    } catch(err) {
      console.warn("Falha ao gravar no status_history:", err.message);
    }

    res.status(200).json({ message: "Status atualizado com sucesso!" });
  } catch (error) {
    console.error("ERRO NO UPDATE ATTENDANCE:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// ++ NOVA FUNÇÃO: GOD MODE (IMPERSONATE) PARA O SUPER ADMIN ++
// =========================================================================
exports.impersonateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const db = require('../config/db');
    const jwt = require('jsonwebtoken');
    
    // Procura o utilizador alvo no banco de dados
    const [users] = await db.query('SELECT id, name, email, role, ong_id FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    const user = users[0];
    
    // Gera um novo token JWT "falso" para o Admin entrar como se fosse o utilizador
    const token = jwt.sign(
      { id: user.id, role: user.role, ong_id: user.ong_id },
      process.env.JWT_SECRET || 'secreta', // Usa a chave secreta do seu .env
      { expiresIn: '2h' } // Tempo de validade do teste
    );
    
    res.status(200).json({ 
      message: 'Acesso simulado com sucesso!', 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        ong_id: user.ong_id 
      }
    });
  } catch (error) {
    console.error("Erro ao simular acesso (Impersonate):", error);
    res.status(500).json({ error: 'Erro interno ao tentar simular o acesso.' });
  }
};

// =========================================================================
// SISTEMA DE USUÁRIOS ONLINE (HEARTBEAT)
// =========================================================================

// 1. Recebe o "batimento cardíaco" do utilizador e atualiza a hora
exports.ping = async (req, res) => {
    try {
        const db = require('../config/db');
        await db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [req.user.id]);
        res.status(200).send('ok');
    } catch (error) {
        // Erros de ping podem ser ignorados silenciosamente para não poluir logs
        res.status(500).send('error');
    }
};

// 2. Retorna todos os utilizadores que deram "ping" nos últimos 5 minutos
exports.getOnlineUsers = async (req, res) => {
    try {
        const db = require('../config/db');
        const [users] = await db.query(`
            SELECT u.id, u.name, u.cpf, u.role, u.last_active, o.fantasy_name as ong_name
            FROM users u
            LEFT JOIN ongs o ON u.ong_id = o.id
            WHERE u.last_active >= NOW() - INTERVAL 5 MINUTE
            ORDER BY u.last_active DESC
        `);
        res.status(200).json(users);
    } catch (error) {
        console.error("Erro ao buscar usuários online:", error);
        res.status(500).json({ error: 'Erro ao buscar monitorização em tempo real.' });
    }
};