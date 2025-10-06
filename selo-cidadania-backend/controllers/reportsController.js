// selo-cidadania-backend/controllers/reportsController.js

const db = require('../config/db');

exports.getReports = async (req, res) => {
  const { ongId, search } = req.query;
  let connection;

  try {
    connection = await db.getConnection();

    // 1. ESTATÍSTICAS GERAIS
    const [totalUsersResult] = await connection.query(`SELECT COUNT(id) as total_users FROM users WHERE ong_id = ? AND role_id = 4`, [ongId]);
    const [totalSealsResult] = await connection.query(`SELECT SUM(seal_balance) as total_seals FROM users WHERE ong_id = ?`, [ongId]);
    const [totalRedeemedResult] = await connection.query(`SELECT COUNT(r.id) as total_redeemed FROM redemptions r JOIN users u ON r.user_id = u.id WHERE u.ong_id = ?`, [ongId]);

    // 2. ÚLTIMOS 5 RESGATES
    const [latestRedemptions] = await connection.query(`
      SELECT r.id, u.name as user_name, r.redemption_date, p.name as prize_name
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE u.ong_id = ? ORDER BY r.redemption_date DESC LIMIT 5
    `, [ongId]);

    // 3. HISTÓRICO COMPLETO DE RESGATES
    const [allRedemptions] = await connection.query(`
      SELECT r.id, u.id as user_id, u.name as user_name, u.cpf as user_cpf, r.redemption_date, p.name as prize_name, p.seal_cost as seals_redeemed, u.seal_balance as remaining_balance
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE u.ong_id = ? ORDER BY r.redemption_date DESC
    `, [ongId]);

    // 4. BENEFICIÁRIOS COM MAIS SELOS (TOP 5)
    const [topUsers] = await connection.query(`
      SELECT u.id, u.name, u.seal_balance 
      FROM users u WHERE u.ong_id = ? AND role_id = 4 ORDER BY u.seal_balance DESC LIMIT 5
    `, [ongId]);

    // ++ INÍCIO DA MELHORIA: Lógica otimizada para buscar usuários e dependentes ++
    // 5. LISTA COMPLETA DE TODOS OS BENEFICIÁRIOS E SEUS DEPENDENTES
    
    // 5a. Busca todos os usuários (beneficiários) da ONG
    let allUsersQuery = `
      SELECT id, name, email, cpf, phone, seal_balance, created_at
      FROM users
      WHERE ong_id = ? AND role_id = 4
    `;
    const params = [ongId];
    if (search) {
      allUsersQuery += ` AND (name LIKE ? OR cpf LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    allUsersQuery += ` ORDER BY name ASC`;
    const [allUsers] = await connection.query(allUsersQuery, params);

    // 5b. Se encontrou usuários, busca todos os seus dependentes de uma só vez
    if (allUsers.length > 0) {
      const userIds = allUsers.map(u => u.id);
      const [dependents] = await connection.query(
        `SELECT user_id, full_name as name, relationship, birth_date FROM dependents WHERE user_id IN (?)`,
        [userIds]
      );

      // 5c. Mapeia os dependentes para seus respectivos usuários para acesso rápido
      const dependentsMap = dependents.reduce((acc, dep) => {
        if (!acc[dep.user_id]) {
          acc[dep.user_id] = [];
        }
        acc[dep.user_id].push(dep);
        return acc;
      }, {});

      // 5d. Anexa a lista de dependentes a cada usuário
      allUsers.forEach(user => {
        user.dependents = dependentsMap[user.id] || [];
      });
    }
    // ++ FIM DA MELHORIA ++

    res.status(200).json({
      generalStats: {
        totalUsers: totalUsersResult[0]?.total_users || 0,
        totalSealsInCirculation: totalSealsResult[0]?.total_seals || 0,
        totalSealsRedeemed: totalRedeemedResult[0]?.total_redeemed || 0,
      },
      latestRedemptions,
      allRedemptions,
      topUsers,
      allUsers, // Agora contém os dependentes de forma mais eficiente
    });
  } catch (error) {
    console.error("Erro fatal ao gerar relatórios:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getSocialProofsReport = async (req, res) => {
    const { ongId, search } = req.query;
    let connection;
    try {
      connection = await db.getConnection();
      let query = `
        SELECT 
          sp.id, u.id as user_id, u.name as user_name, u.cpf as user_cpf, 
          sp.created_at as submission_date, pa.description as activity_description, 
          pa.seal_value as seals_earned, sp.status, sp.feedback_message
        FROM social_proofs sp
        JOIN users u ON sp.user_id = u.id
        JOIN proof_activities pa ON sp.activity_id = pa.id
        WHERE 1=1
      `;
      const params = [];
  
      if (ongId) {
        query += ` AND u.ong_id = ?`;
        params.push(ongId);
      }
      if (search) {
        query += ` AND (u.name LIKE ? OR u.cpf LIKE ? OR pa.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      query += ` ORDER BY sp.created_at DESC`;
      const [socialProofs] = await connection.query(query, params);
      res.status(200).json(socialProofs);
    } catch (error) {
      console.error("Erro fatal ao gerar relatório de provas sociais:", error);
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
};
