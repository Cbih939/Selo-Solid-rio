// Arquivo: selo-cidadania-backend/controllers/userController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

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
    // 👇 Usamos 'attendance_status AS status' para que o frontend leia corretamente a propriedade
    const query = `SELECT id, name, cpf, email, seal_balance, attendance_status AS status FROM users WHERE role_id = 4 AND (name LIKE ? OR email LIKE ? OR cpf LIKE ?)`;
    
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
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;

  try {
    await connection.beginTransaction();

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
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, ong_id, actorName, "Novo Beneficiário Criado", `O utilizador '${name}' foi cadastrado no sistema (Email: ${email}).`, "success");

    res.status(201).json({ message: "Beneficiário cadastrado com sucesso!" });
  } catch (error) {
    await connection.rollback();
    
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Criar Beneficiário", `Falha técnica: ${error.message}`, "error");
    
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
    const actorName = req.user.name;
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
        
        // LOG DE INFORMAÇÃO
        await registerSystemLog(userId, req.user.ong_id, actorName, "Atualização de Perfil", "O utilizador atualizou os próprios dados de perfil.", "info");

        res.status(200).json({ message: "Perfil atualizado com sucesso." });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
  const connection = await db.getConnection();
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Administrador';
  const actorOng = req.user?.ong_id || null;

  try {
    await connection.beginTransaction();
    const userId = req.params.id;
    
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
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Mapeamento Social Atualizado", `Os dados do utilizador ID ${userId} ('${name}') foram editados pelo administrador.`, "success");

    res.status(200).json({ message: "Perfil e Mapeamento Social atualizados com sucesso." });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao atualizar perfil do usuário:", error);
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Atualizar Perfil", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Administrador';

  if (!password) return res.status(400).json({ message: "A nova senha é obrigatória." });
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const [result] = await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ message: "Utilizador não encontrado." });
    
    // LOG DE AVISO (Ação sensível)
    await registerSystemLog(actorId, req.user?.ong_id, actorName, "Redefinição de Senha", `A senha do utilizador ID ${id} foi alterada manualmente.`, "warning");

    res.status(200).json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    await registerSystemLog(actorId, req.user?.ong_id, actorName, "Erro em Redefinição", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  // 1. Extraindo o status do req.body
  const { name, email, phone, cpf, status } = req.body; 
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  
  try {
    // 2. Adicionando status = ? no UPDATE e a variável 'status' no array
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, cpf = ?, status = ? WHERE id = ?", 
      [name, email, phone, cpf, status, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    
    await registerSystemLog(actorId, req.user?.ong_id, actorName, "Atualização Rápida de Utilizador", `Dados básicos do utilizador ID ${id} alterados.`, "success");

    res.status(200).json({ message: "Usuário atualizado com sucesso." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'O Email ou CPF informado já está em uso.' });
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

// DELETE: Excluir um Beneficiário (Usuário Comum)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;
  
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Excluir todas as dependências (Filhos)
    await connection.query("DELETE FROM dependents WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM social_proofs WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM redemptions WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM status_history WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM balance_history WHERE user_id = ?", [id]);

    // 2. Excluir o usuário (Pai)
    const [result] = await connection.query("DELETE FROM users WHERE id = ? AND role_id = 4", [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    await connection.commit();
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Exclusão de Beneficiário", `O beneficiário ID ${id} e todo o seu histórico foram excluídos permanentemente.`, "success");

    res.status(200).json({ message: "Dados excluídos com sucesso." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao deletar usuário:", error); 
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Excluir Beneficiário", `Falha técnica ou vínculos ativos: ${error.message}`, "error");
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
    
    await registerSystemLog(userId, req.user?.ong_id, req.user?.name, "Dependente Adicionado", `O utilizador adicionou '${fullName}' como dependente.`, "info");
    
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

exports.debitSeals = async (req, res) => {
  const { userId } = req.params;
  const { amount, reason } = req.body; 
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Administrador';

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    const [users] = await db.query('SELECT name, ong_id, seal_balance FROM users WHERE id = ? FOR UPDATE', [userId]);
    
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
    
    await connection.query('UPDATE users SET seal_balance = ? WHERE id = ?', [newBalance, userId]);
    
    await connection.query(
      'INSERT INTO redemptions (user_id, prize_name, seals_redeemed, redemption_date, status) VALUES (?, ?, ?, NOW(), "completed")', 
      [userId, finalReason, amount]
    );

    // Registo Financeiro Global
    await connection.query(
        "INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, 'debit', ?, ?)",
        [userId, users[0].ong_id, amount, finalReason]
    );
    
    await connection.commit();
    
    // LOG DE SUCESSO FINANCEIRO
    await registerSystemLog(actorId, users[0].ong_id, actorName, "Débito Manual de Selos", `Foram retirados ${amount} selos da carteira de '${users[0].name}'. Motivo: ${finalReason}.`, "success");

    res.status(200).json({ message: 'Débito realizado com sucesso!', newBalance });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro no debitSeals:", error);
    await registerSystemLog(actorId, null, actorName, "Erro em Débito", `Falha ao realizar débito manual: ${error.message}`, "error");
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
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Coordenador';

  try {
    await connection.beginTransaction();
    
    const ong_id = req.body.ong_id || req.user.ong_id; 
    const evaluator_name = actorName;
    const { targetType, userId, amount, reason } = req.body;
    const sealAmount = parseInt(amount, 10);

    if (!sealAmount || sealAmount <= 0) {
        throw new Error("Quantidade de selos inválida.");
    }

    const title = reason ? `Bônus: ${reason}` : 'Bônus/Envio Direto da OSC';

    if (targetType === 'all') {
        const [users] = await db.query("SELECT id FROM users WHERE ong_id = ? AND role_id = 4", [ong_id]);
        
        if(users.length === 0) {
            throw new Error("Não existem beneficiários cadastrados nesta OSC.");
        }

        for (let u of users) {
            await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [sealAmount, u.id]);
            await connection.query(
                "INSERT INTO social_proofs (user_id, ong_id, title, status, seal_value, created_at, evaluated_at, evaluator_name, feedback_message) VALUES (?, ?, ?, 'approved', ?, NOW(), NOW(), ?, ?)",
                [u.id, ong_id, title, sealAmount, evaluator_name, 'Envio em lote pelo coordenador']
            );
            
            // Registo Financeiro Lote
            await connection.query(
                "INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, 'credit', ?, ?)",
                [u.id, ong_id, sealAmount, title]
            );
        }
        
        // LOG DE SUCESSO (Envio Lote)
        await registerSystemLog(actorId, ong_id, actorName, "Envio em Lote Realizado", `Foram distribuídos ${sealAmount} selos para ${users.length} utilizadores da OSC. Motivo: ${title}`, "success");

    } else {
        if (!userId) throw new Error("Usuário não selecionado.");
        await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [sealAmount, userId]);
        await connection.query(
            "INSERT INTO social_proofs (user_id, ong_id, title, status, seal_value, created_at, evaluated_at, evaluator_name, feedback_message) VALUES (?, ?, ?, 'approved', ?, NOW(), NOW(), ?, ?)",
            [userId, ong_id, title, sealAmount, evaluator_name, 'Envio direto pelo coordenador']
        );
        
        // Registo Financeiro Unico
        await connection.query(
            "INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, 'credit', ?, ?)",
            [userId, ong_id, sealAmount, title]
        );
        
        // LOG DE SUCESSO (Envio Direto)
        await registerSystemLog(actorId, ong_id, actorName, "Envio Direto Realizado", `Transferência de ${sealAmount} selos efetuada para o utilizador ID ${userId}. Motivo: ${title}`, "success");
    }

    await connection.commit();
    res.status(200).json({ message: "Selos enviados com sucesso!" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao enviar selos:", error);
    await registerSystemLog(actorId, req.body.ong_id || req.user?.ong_id, actorName, "Erro em Envio de Selos", `Falha técnica: ${error.message}`, "error");
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

exports.updateAttendance = async (req, res) => {
  const { userId } = req.params;
  const { status, message } = req.body; 
  const adminId = req.user.id; 

  try {
    const db = require('../config/db'); 

    const [adminRows] = await db.query("SELECT name, ong_id FROM users WHERE id = ?", [adminId]);
    const realAdminName = adminRows.length > 0 ? adminRows[0].name : "Equipa da OSC";
    const adminOngId = adminRows.length > 0 ? adminRows[0].ong_id : null;

    await db.query(
      "UPDATE users SET attendance_status = ?, analysis_message = ?, last_analysis_date = NOW() WHERE id = ?",
      [status, message || null, userId]
    );

    try {
      await db.query(
        "INSERT INTO status_history (user_id, status, message, admin_name, created_at) VALUES (?, ?, ?, ?, NOW())",
        [userId, status, message || null, realAdminName]
      );
    } catch(err) {
      console.warn("Falha ao gravar no status_history:", err.message);
    }
    
    // LOG DE INFORMAÇÃO
    await registerSystemLog(adminId, adminOngId, realAdminName, "Status de Atendimento Atualizado", `O status do beneficiário ID ${userId} foi alterado para '${status}'.`, "info");

    res.status(200).json({ message: "Status atualizado com sucesso!" });
  } catch (error) {
    console.error("ERRO NO UPDATE ATTENDANCE:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// GOD MODE (IMPERSONATE) PARA O SUPER ADMIN
// =========================================================================
exports.impersonateUser = async (req, res) => {
  const { id } = req.params;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Super Administrador';

  try {
    const db = require('../config/db');
    const jwt = require('jsonwebtoken');
    
    const [users] = await db.query('SELECT id, name, email, role, ong_id FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    const user = users[0];
    
    const token = jwt.sign(
      { id: user.id, role: user.role, ong_id: user.ong_id },
      process.env.JWT_SECRET || 'secreta',
      { expiresIn: '2h' } 
    );
    
    // LOG CRÍTICO DE SEGURANÇA (Alerta máximo de que alguém "assumiu" outra conta)
    await registerSystemLog(actorId, user.ong_id, actorName, "Acesso Simulado (God Mode)", `ALERTA: O administrador acedeu ao painel simulando a conta de '${user.name}' (Email: ${user.email}, Role: ${user.role}).`, "warning");
    
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
    await registerSystemLog(actorId, null, actorName, "Erro em God Mode", `Falha técnica ao tentar simular utilizador ID ${id}: ${error.message}`, "error");
    res.status(500).json({ error: 'Erro interno ao tentar simular o acesso.' });
  }
};

// =========================================================================
// SISTEMA DE USUÁRIOS ONLINE (HEARTBEAT) - Sem logs de auditoria para evitar spam
// =========================================================================

exports.ping = async (req, res) => {
    try {
        const db = require('../config/db');
        await db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [req.user.id]);
        res.status(200).send('ok');
    } catch (error) {
        res.status(500).send('error');
    }
};

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