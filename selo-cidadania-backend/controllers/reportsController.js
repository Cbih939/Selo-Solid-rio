const db = require('../config/db');

// GET: Obter as estatísticas gerais do sistema
exports.getSystemStats = async (req, res) => {
  try {
    // Executa todas as queries de contagem em paralelo para maior eficiência
    const [userCounts] = await db.query("SELECT r.name as role_name, COUNT(u.id) as count FROM users u JOIN roles r ON u.role_id = r.id GROUP BY r.name");
    const [ongCount] = await db.query("SELECT COUNT(id) as count FROM ongs");
    const [totalSeals] = await db.query("SELECT SUM(seal_balance) as total FROM users");
    const [redeemedCount] = await db.query("SELECT COUNT(id) as count FROM redemptions");

    // Organiza os dados num objeto de estatísticas
    const stats = {
      totalUsers: 0,
      totalOngs: ongCount[0].count,
      totalAdmins1: 0,
      totalAdmins5: 0,
      totalRegularUsers: 0, // Utilizadores comuns
      totalOngUsers: 0, // Utilizadores que são responsáveis por ONGs
      sealsInCirculation: totalSeals[0].total || 0,
      totalRedemptions: redeemedCount[0].count,
    };

    // Processa os resultados da contagem de utilizadores por perfil
    userCounts.forEach(row => {
      stats.totalUsers += row.count;
      if (row.role_name === 'admin5') stats.totalAdmins5 = row.count;
      if (row.role_name === 'admin1') stats.totalAdmins1 = row.count;
      if (row.role_name === 'user') stats.totalRegularUsers = row.count;
      if (row.role_name === 'ong') stats.totalOngUsers = row.count;
    });

    res.status(200).json(stats);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter a lista detalhada de todos os resgates (NOVO)
exports.getAllRedemptions = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.name AS user_name,
        p.name AS prize_name,
        r.redemption_date
      FROM redemptions r
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      ORDER BY r.redemption_date DESC
    `;
    const [rows] = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter as estatísticas de uma ONG específica (NOVO)
exports.getOngStats = async (req, res) => {
  const { ongId } = req.params;

  try {
    // Executa as queries para a ONG específica em paralelo
    const [userCount] = await db.query("SELECT COUNT(id) as count FROM users WHERE ong_id = ? AND role_id = 4", [ongId]);
    const [totalSeals] = await db.query("SELECT SUM(seal_balance) as total FROM users WHERE ong_id = ? AND role_id = 4", [ongId]);
    const [redemptionCount] = await db.query(
      `SELECT COUNT(r.id) as count 
       FROM redemptions r 
       JOIN users u ON r.user_id = u.id 
       WHERE u.ong_id = ?`,
      [ongId]
    );

    const stats = {
      totalUsers: userCount[0].count,
      sealsInCirculation: totalSeals[0].total || 0,
      totalRedemptions: redemptionCount[0].count,
    };

    res.status(200).json(stats);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReportsData = async (req, res) => {
  const { ongId, startDate, endDate } = req.query; // Filtros

  try {
    // --- Relatório de Selos ---
    const sealsQuery = `
      SELECT 
        (SELECT SUM(seal_balance) FROM users WHERE role_id = 4 ${ongId ? 'AND ong_id = ?' : ''}) as sealsInCirculation,
        (SELECT COUNT(r.id) FROM redemptions r JOIN users u ON r.user_id = u.id WHERE 1=1 ${ongId ? 'AND u.ong_id = ?' : ''}) as redeemedCount;
    `;
    const [sealsResult] = await db.query(sealsQuery, ongId ? [ongId, ongId] : []);

    // --- Utilizadores com mais selos ---
    const topUsersQuery = `
      SELECT name, seal_balance FROM users 
      WHERE role_id = 4 ${ongId ? 'AND ong_id = ?' : ''}
      ORDER BY seal_balance DESC LIMIT 5;
    `;
    const [topUsers] = await db.query(topUsersQuery, ongId ? [ongId] : []);

    // --- Últimos Resgates ---
    const latestRedemptionsQuery = `
      SELECT u.name as user_name, p.name as prize_name, r.redemption_date
      FROM redemptions r
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE 1=1 ${ongId ? 'AND u.ong_id = ?' : ''}
      ORDER BY r.redemption_date DESC LIMIT 5;
    `;
    const [latestRedemptions] = await db.query(latestRedemptionsQuery, ongId ? [ongId] : []);
    
    // --- Contagem de Utilizadores e ONGs ---
    const countsQuery = `
      SELECT 
        (SELECT COUNT(id) FROM users WHERE role_id = 4 ${ongId ? 'AND ong_id = ?' : ''}) as totalUsers,
        (SELECT COUNT(id) FROM ongs) as totalOngs;
    `;
    const [countsResult] = await db.query(countsQuery, ongId ? [ongId] : []);

    res.status(200).json({
      sealsReport: {
        sealsInCirculation: sealsResult[0].sealsInCirculation || 0,
        redeemedCount: sealsResult[0].redeemedCount || 0,
        topUsers,
        latestRedemptions
      },
      usersReport: {
        totalUsers: countsResult[0].totalUsers
      },
      ongsReport: {
        totalOngs: countsResult[0].totalOngs
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};