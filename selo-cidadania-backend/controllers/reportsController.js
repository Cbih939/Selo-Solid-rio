// Arquivo: controllers/reportsController.js (VERSÃO 100% COMPLETA E CORRIGIDA)

const db = require('../config/db');

exports.getReports = async (req, res) => {
  const { ongId, search } = req.query;
  let connection;

  try {
    connection = await db.getConnection();

    // 1. ESTATÍSTICAS GERAIS (sem alterações, já estava correto)
    const [totalUsersResult] = await connection.query(`SELECT COUNT(id) as total_users FROM users WHERE ong_id = ?`, [ongId]);
    const [totalSealsResult] = await connection.query(`SELECT SUM(seal_balance) as total_seals FROM users WHERE ong_id = ?`, [ongId]);
    
    const [totalRedeemedResult] = await connection.query(`
      SELECT COUNT(r.id) as total_redeemed 
      FROM redemptions r
      JOIN users u ON r.user_id = u.id
      WHERE u.ong_id = ?
    `, [ongId]);

    // ==================================================================
    // ++ INÍCIO DA CORREÇÃO ++
    // ==================================================================

    // 2. ÚLTIMOS 5 RESGATES (CORRIGIDO)
    // Trocado 'r.reason' por 'p.name' e adicionado o JOIN com a tabela 'prizes'.
    const [latestRedemptions] = await connection.query(`
      SELECT r.id, u.name as user_name, r.redemption_date, p.name as prize_name
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE u.ong_id = ? ORDER BY r.redemption_date DESC LIMIT 5
    `, [ongId]);

    // 3. HISTÓRICO COMPLETO DE RESGATES (CORRIGIDO)
    // Trocado 'r.reason' por 'p.name' e adicionado o JOIN com a tabela 'prizes'.
    // Também corrigido 'r.redeemed_value' para 'p.seal_cost' para obter o custo em selos do prêmio.
    const [allRedemptions] = await connection.query(`
      SELECT 
        r.id, 
        u.id as user_id, 
        u.name as user_name, 
        u.cpf as user_cpf, 
        r.redemption_date, 
        p.name as prize_name, 
        p.seal_cost as seals_redeemed, 
        u.seal_balance as remaining_balance
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE u.ong_id = ? ORDER BY r.redemption_date DESC
    `, [ongId]);

    // ==================================================================
    // ++ FIM DA CORREÇÃO ++
    // ==================================================================

    // 4. BENEFICIÁRIOS COM MAIS SELOS (TOP 5) (sem alterações)
    const [topUsers] = await connection.query(`
      SELECT u.id, u.name, u.seal_balance 
      FROM users u WHERE u.ong_id = ? ORDER BY u.seal_balance DESC LIMIT 5
    `, [ongId]);

    // 5. LISTA COMPLETA DE TODOS OS BENEFICIÁRIOS E SEUS DEPENDENTES (sem alterações)
    let allUsersQuery = `
      SELECT 
        u.id, u.name, u.email, u.cpf, u.phone, u.seal_balance, u.created_at,
        (SELECT GROUP_CONCAT(
          JSON_OBJECT('name', d.full_name, 'relationship', d.relationship, 'birth_date', d.birth_date)
          SEPARATOR '|||'
        ) FROM dependents d WHERE d.user_id = u.id) as dependents_json
      FROM users u
      WHERE u.ong_id = ?
    `;
    const allUsersParams = [ongId];
    if (search) {
      allUsersQuery += ` AND (u.name LIKE ? OR u.cpf LIKE ? OR u.email LIKE ?)`;
      allUsersParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    allUsersQuery += ` ORDER BY u.name ASC`;
    const [allUsersRaw] = await connection.query(allUsersQuery, allUsersParams);

    const allUsers = allUsersRaw.map(user => {
      let dependents = [];
      if (user.dependents_json) {
        dependents = user.dependents_json.split('|||').map(depString => {
          try {
            return JSON.parse(depString);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
      }
      return { ...user, dependents };
    });

    res.status(200).json({
      generalStats: {
        totalUsers: totalUsersResult[0]?.total_users || 0,
        totalSealsInCirculation: totalSealsResult[0]?.total_seals || 0,
        totalSealsRedeemed: totalRedeemedResult[0]?.total_redeemed || 0,
      },
      latestRedemptions,
      allRedemptions,
      topUsers,
      allUsers,
    });
  } catch (error) {
    console.error("Erro fatal ao gerar relatórios:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// A função getSocialProofsReport já estava correta e não precisa de alterações.
exports.getSocialProofsReport = async (req, res) => {
    const { ongId, search } = req.query;
    let connection;
    try {
      connection = await db.getConnection();
      let query = `
        SELECT 
          sp.id, 
          u.id as user_id, 
          u.name as user_name, 
          u.cpf as user_cpf, 
          sp.created_at as submission_date, 
          pa.description as activity_description, 
          pa.seal_value as seals_earned, 
          sp.status, 
          sp.feedback_message
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
