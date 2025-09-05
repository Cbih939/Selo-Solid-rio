// Arquivo: controllers/reportsController.js (Versão Final e Definitiva)

const db = require('../config/db');

// Função principal para relatórios de Selos e Beneficiários
exports.getReports = async (req, res) => {
  const ongId = req.query.ongId;
  const userSearch = req.query.userSearch || '';

  try {
    // --- 1. RELATÓRIO DE SELOS ---
    let sealsInCirculationQuery = "SELECT SUM(seal_balance) as total FROM users u WHERE u.role_id = 4";
    let redeemedCountQuery = "SELECT COUNT(r.id) as count FROM redemptions r JOIN users u ON r.user_id = u.id WHERE 1=1";
    const sealsParams = [];
    if (ongId) {
      sealsInCirculationQuery += " AND u.ong_id = ?";
      redeemedCountQuery += " AND u.ong_id = ?";
      sealsParams.push(ongId);
    }
    const [sealsResult] = await db.query(sealsInCirculationQuery, sealsParams);
    const [redeemedResult] = await db.query(redeemedCountQuery, sealsParams);

    // --- 2 & 3. BENEFICIÁRIOS COM MAIS SELOS ---
    let topUsersBaseQuery = "SELECT u.id, u.name, u.cpf, u.seal_balance, 0 as used_seals FROM users u WHERE u.role_id = 4";
    const topUsersParams = [];
    if (ongId) {
      topUsersBaseQuery += " AND u.ong_id = ?";
      topUsersParams.push(ongId);
    }
    topUsersBaseQuery += " ORDER BY u.seal_balance DESC";
    const [allTopUsers] = await db.query(topUsersBaseQuery, topUsersParams);
    const topUsers = allTopUsers.slice(0, 5);

    // --- 4 & 5. RESGATES (QUERY CORRIGIDA) ---
    // ### CORREÇÃO DEFINITIVA: Removida a busca pela coluna de custo que não existe. ###
    // A query agora busca o nome do prêmio, que é uma informação útil e existente.
    let redemptionsBaseQuery = `
      SELECT 
        r.id, 
        u.id as user_id, 
        u.name as user_name, 
        u.cpf as user_cpf, 
        r.redemption_date,
        p.name as prize_name, -- Buscando o nome do prêmio em vez do custo
        u.seal_balance as remaining_balance 
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      LEFT JOIN prizes p ON r.prize_id = p.id -- Usando LEFT JOIN para não quebrar se um prêmio for deletado
      WHERE 1=1
    `;
    const redemptionsParams = [];
    if (ongId) {
      redemptionsBaseQuery += " AND u.ong_id = ?";
      redemptionsParams.push(ongId);
    }
    redemptionsBaseQuery += " ORDER BY r.redemption_date DESC";
    const [allRedemptions] = await db.query(redemptionsBaseQuery, redemptionsParams);
    const latestRedemptions = allRedemptions.slice(0, 5);

    // --- 6. RELATÓRIO DE BENEFICIÁRIOS ---
    let usersListQuery = `
      SELECT u.id, u.name, u.cpf, u.seal_balance, COUNT(d.id) as dependents_count 
      FROM users u LEFT JOIN dependents d ON u.id = d.user_id
      WHERE u.role_id = 4 
    `;
    const usersListParams = [];
    if (ongId) {
      usersListQuery += ' AND u.ong_id = ?';
      usersListParams.push(ongId);
    }
    if (userSearch) {
      usersListQuery += ' AND (u.name LIKE ? OR u.cpf LIKE ?)';
      usersListParams.push(`%${userSearch}%`, `%${userSearch}%`);
    }
    usersListQuery += ' GROUP BY u.id ORDER BY u.name ASC';
    const [usersList] = await db.query(usersListQuery, usersListParams);

    // --- Montagem da Resposta Final ---
    res.status(200).json({
      sealsReport: {
        sealsInCirculation: sealsResult[0]?.total || 0,
        redeemedCount: redeemedResult[0]?.count || 0,
        topUsers,
        allTopUsers,
        latestRedemptions,
        allRedemptions,
      },
      usersReport: {
        totalUsers: usersList.length,
        usersList,
      }
    });

  } catch (error) {
    console.error("Erro fatal ao gerar relatórios:", error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor ao gerar os relatórios.', details: error.message });
  }
};

// ### NOVA FUNÇÃO PARA O RELATÓRIO DE PROVAS SOCIAIS ###
exports.getSocialProofsReport = async (req, res) => {
  const { ongId, search } = req.query;

  try {
    let query = `
      SELECT 
        sp.id,
        sp.user_id,
        u.name as user_name,
        u.cpf as user_cpf,
        sp.status,
        sp.created_at,
        pa.seal_value
      FROM social_proofs sp
      JOIN users u ON sp.user_id = u.id
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE 1=1
    `;
    const params = [];

    if (ongId) {
      query += " AND sp.ong_id = ?";
      params.push(ongId);
    }

    if (search) {
      query += " AND (u.name LIKE ? OR u.cpf LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY sp.created_at DESC";

    const [rows] = await db.query(query, params);
    res.status(200).json(rows);

  } catch (error) {
    console.error("Erro ao gerar relatório de provas sociais:", error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor ao gerar o relatório de provas sociais.', details: error.message });
  }
};
