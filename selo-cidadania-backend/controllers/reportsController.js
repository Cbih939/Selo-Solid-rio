// Arquivo: controllers/reportsController.js (VERSÃO COMPLETA E CORRIGIDA)

const pool = require('../config/db');

exports.getReports = async (req, res) => {
  const { ongId, search } = req.query;
  let connection;

  try {
    connection = await pool.getConnection();

    // =================================================
    // 1. ESTATÍSTICAS GERAIS
    // =================================================

    // Total de Beneficiários
    const [totalUsersResult] = await connection.query(
      `SELECT COUNT(id) as total_users FROM users ${ongId ? 'WHERE ong_id = ?' : ''}`,
      ongId ? [ongId] : []
    );
    const totalUsers = totalUsersResult[0].total_users || 0;

    // Total de Selos Resgatados (Contagem de transações de resgate)
    const [totalRedeemedResult] = await connection.query(
      `SELECT COUNT(r.id) as total_redeemed FROM redemptions r ${ongId ? 'JOIN users u ON r.user_id = u.id WHERE u.ong_id = ?' : ''}`,
      ongId ? [ongId] : []
    );
    const totalSealsRedeemed = totalRedeemedResult[0].total_redeemed || 0;

    // Total de Selos em Circulação (Soma dos saldos atuais)
    const [totalSealsInCirculationResult] = await connection.query(
      `SELECT SUM(seal_balance) as total_seals FROM users ${ongId ? 'WHERE ong_id = ?' : ''}`,
      ongId ? [ongId] : []
    );
    const totalSealsInCirculation = totalSealsInCirculationResult[0].total_seals || 0;


    // =================================================
    // 2. ÚLTIMOS 5 RESGATES
    // =================================================
    let latestRedemptionsQuery = `
      SELECT 
        r.id, 
        u.id as user_id, 
        u.name as user_name, 
        u.cpf as user_cpf, 
        r.redemption_date, 
        p.name as prize_name,
        p.cost as seals_redeemed,
        u.seal_balance as remaining_balance
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE 1=1
    `;
    const latestRedemptionsParams = [];

    if (ongId) {
      latestRedemptionsQuery += ` AND u.ong_id = ?`;
      latestRedemptionsParams.push(ongId);
    }
    // Adiciona a ordenação e o limite no final da query
    latestRedemptionsQuery += ` ORDER BY r.redemption_date DESC LIMIT 5`;
    const [latestRedemptions] = await connection.query(latestRedemptionsQuery, latestRedemptionsParams);


    // =================================================
    // 3. TODOS OS RESGATES (PARA O MODAL)
    // =================================================
    let allRedemptionsQuery = `
      SELECT 
        r.id, 
        u.id as user_id, 
        u.name as user_name, 
        u.cpf as user_cpf, 
        r.redemption_date, 
        p.name as prize_name,
        p.cost as seals_redeemed,
        u.seal_balance as remaining_balance
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE 1=1
    `;
    const allRedemptionsParams = [];

    if (ongId) {
      allRedemptionsQuery += ` AND u.ong_id = ?`;
      allRedemptionsParams.push(ongId);
    }
    // Adiciona a ordenação no final da query
    allRedemptionsQuery += ` ORDER BY r.redemption_date DESC`;
    const [allRedemptions] = await connection.query(allRedemptionsQuery, allRedemptionsParams);


    // =================================================
    // 4. BENEFICIÁRIOS COM MAIS SELOS (TOP 5)
    // =================================================
    let topUsersQuery = `
      SELECT 
        u.id, u.name, u.cpf, u.seal_balance, 
        (SELECT COUNT(r.id) FROM redemptions r WHERE r.user_id = u.id) as used_seals,
        (SELECT COUNT(d.id) FROM dependents d WHERE d.user_id = u.id) as dependents_count
      FROM users u
      WHERE 1=1
    `;
    const topUsersParams = [];
    if (ongId) {
      topUsersQuery += ` AND u.ong_id = ?`;
      topUsersParams.push(ongId);
    }
    topUsersQuery += ` ORDER BY u.seal_balance DESC LIMIT 5`;
    const [topUsers] = await connection.query(topUsersQuery, topUsersParams);


    // =================================================
    // 5. TODOS OS BENEFICIÁRIOS CADASTRADOS
    // =================================================
    let allUsersQuery = `
      SELECT u.id, u.name, u.cpf, u.seal_balance, 
      (SELECT COUNT(d.id) FROM dependents d WHERE d.user_id = u.id) as dependents_count
      FROM users u
      WHERE 1=1
    `;
    const allUsersParams = [];
    if (ongId) {
      allUsersQuery += ` AND u.ong_id = ?`;
      allUsersParams.push(ongId);
    }
    if (search) {
      allUsersQuery += ` AND (u.name LIKE ? OR u.cpf LIKE ?)`;
      allUsersParams.push(`%${search}%`, `%${search}%`);
    }
    allUsersQuery += ` ORDER BY u.name ASC`;
    const [allUsers] = await connection.query(allUsersQuery, allUsersParams);


    // =================================================
    // RESPOSTA FINAL
    // =================================================
    res.status(200).json({
      generalStats: {
        totalUsers,
        totalSealsInCirculation,
        totalSealsRedeemed,
      },
      latestRedemptions,
      topUsers,
      allUsers,
      allRedemptions,
    });

  } catch (error) {
    console.error("Erro fatal ao gerar relatórios:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Função para obter o relatório de provas sociais (sem alterações)
exports.getSocialProofsReport = async (req, res) => {
  const { ongId, search } = req.query;
  let connection;
  try {
    connection = await pool.getConnection();
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
