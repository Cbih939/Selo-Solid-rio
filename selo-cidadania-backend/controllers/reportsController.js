const db = require('../config/db');

// ========================================================================
// FUNÇÃO PRINCIPAL E UNIFICADA PARA GERAR TODOS OS RELATÓRIOS
// ========================================================================
exports.getReports = async (req, res) => {
  // Pega os filtros da URL. Se não existirem, usa valores padrão.
  const ongId = req.query.ongId;
  const userSearch = req.query.userSearch || ''; // Filtro de pesquisa de usuário

  // Constrói a cláusula WHERE para ONG, que será reutilizada em várias queries
  const ongFilterClause = ongId ? 'AND u.ong_id = ?' : '';
  const ongParams = ongId ? [ongId] : [];

  try {
    // --- 1. RELATÓRIO DE SELOS ---
    const sealsQuery = `
      SELECT 
        (SELECT SUM(seal_balance) FROM users u WHERE u.role_id = 4 ${ongFilterClause}) as sealsInCirculation,
        (SELECT COUNT(r.id) FROM redemptions r JOIN users u ON r.user_id = u.id WHERE 1=1 ${ongFilterClause}) as redeemedCount;
    `;
    const [sealsResult] = await db.query(sealsQuery, [...ongParams, ...ongParams]);

    // --- 2. BENEFICIÁRIOS COM MAIS SELOS (TOP 5 para o dashboard) ---
    const topUsersQuery = `
      SELECT u.id, u.name, u.cpf, u.seal_balance, 0 as used_seals -- 'used_seals' é um placeholder
      FROM users u
      WHERE u.role_id = 4 ${ongFilterClause}
      ORDER BY u.seal_balance DESC 
      LIMIT 5;
    `;
    const [topUsers] = await db.query(topUsersQuery, ongParams);
    
    // --- 3. LISTA COMPLETA DE BENEFICIÁRIOS COM MAIS SELOS (para o modal) ---
    const allTopUsersQuery = `
      SELECT u.id, u.name, u.cpf, u.seal_balance, 0 as used_seals -- 'used_seals' é um placeholder
      FROM users u
      WHERE u.role_id = 4 ${ongFilterClause}
      ORDER BY u.seal_balance DESC;
    `;
    const [allTopUsers] = await db.query(allTopUsersQuery, ongParams);

    // --- 4. ÚLTIMOS 5 RESGATES (para o dashboard) ---
    const latestRedemptionsQuery = `
      SELECT 
        r.id, 
        u.id as user_id, 
        u.name as user_name, 
        u.cpf as user_cpf, 
        r.redemption_date, 
        r.seals_used as seals_redeemed, 
        u.seal_balance as remaining_balance 
      FROM redemptions r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 ${ongFilterClause}
      ORDER BY r.redemption_date DESC 
      LIMIT 5;
    `;
    const [latestRedemptions] = await db.query(latestRedemptionsQuery, ongParams);

    // --- 5. LISTA COMPLETA DE RESGATES (para o modal) ---
    const allRedemptionsQuery = `
      SELECT 
        r.id, 
        u.id as user_id, 
        u.name as user_name, 
        u.cpf as user_cpf, 
        r.redemption_date, 
        r.seals_used as seals_redeemed, 
        u.seal_balance as remaining_balance 
      FROM redemptions r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 ${ongFilterClause}
      ORDER BY r.redemption_date DESC;
    `;
    const [allRedemptions] = await db.query(allRedemptionsQuery, ongParams);

    // --- 6. RELATÓRIO DE BENEFICIÁRIOS (com pesquisa e contagem de dependentes) ---
    let usersListQuery = `
      SELECT 
        u.id, 
        u.name, 
        u.cpf, 
        u.seal_balance,
        COUNT(d.id) as dependents_count 
      FROM 
        users u
      LEFT JOIN 
        dependents d ON u.id = d.user_id
      WHERE 
        u.role_id = 4 
    `;
    
    const usersListParams = [];

    if (ongId) {
      usersListQuery += ' AND u.ong_id = ?';
      usersListParams.push(ongId);
    }

    if (userSearch) {
      usersListQuery += ' AND (u.name LIKE ? OR u.cpf LIKE ?)';
      usersListParams.push(`%${userSearch}%`);
      usersListParams.push(`%${userSearch}%`);
    }

    usersListQuery += ' GROUP BY u.id ORDER BY u.name ASC';
    
    const [usersList] = await db.query(usersListQuery, usersListParams);

    // --- Montagem da Resposta Final ---
    res.status(200).json({
      sealsReport: {
        sealsInCirculation: sealsResult[0].sealsInCirculation || 0,
        redeemedCount: sealsResult[0].redeemedCount || 0,
        topUsers, // Top 5 para o dashboard
        allTopUsers, // Lista completa para o modal
        latestRedemptions, // Últimos 5 para o dashboard
        allRedemptions, // Lista completa para o modal
      },
      usersReport: {
        totalUsers: usersList.length,
        usersList, // Lista filtrada e com contagem de dependentes
      }
    });

  } catch (error) {
    console.error("Erro ao gerar relatórios:", error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor ao gerar os relatórios.', details: error.message });
  }
};
