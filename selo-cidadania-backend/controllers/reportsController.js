// Arquivo: controllers/reportsController.js (Com a correção do nome da coluna)

const db = require('../config/db');

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

    // ### CORREÇÃO ESTÁ AQUI ###
    // Trocamos 'r.seals_used' pelo nome correto da coluna (ex: 'r.seals_cost').
    // Verifique na sua tabela 'redemptions' qual é o nome real da coluna de selos usados.
    const correctColumnNameForSealsUsed = 'seals_cost'; // <<< AJUSTE AQUI SE NECESSÁRIO

    // --- 4 & 5. RESGATES ---
    let redemptionsBaseQuery = `
      SELECT 
        r.id, 
        u.id as user_id, 
        u.name as user_name, 
        u.cpf as user_cpf, 
        r.redemption_date, 
        r.${correctColumnNameForSealsUsed} as seals_redeemed, 
        u.seal_balance as remaining_balance 
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id 
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
