// Arquivo: selo-cidadania-backend/controllers/reportsController.js

const db = require('../config/db');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

exports.getReports = async (req, res) => {
  const { ongId, search } = req.query;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;
  
  let connection;

  try {
    connection = await db.getConnection();

    // =========================================================================
    // LÓGICA DINÂMICA DE FILTROS: Suporta Visão Global ("all") e ONG específica
    // =========================================================================
    const isGlobal = !ongId || ongId === 'all';
    const ongFilterU = isGlobal ? "u.ong_id IS NOT NULL" : "u.ong_id = ?";
    const params = isGlobal ? [] : [ongId];
    
    // Assegura que apanha apenas beneficiários reais (soma igual à do Dashboard)
    const roleFilterU = "(u.role_id IN (3, 4) OR u.role = 'user')";

    // 1. ESTATÍSTICAS GERAIS
    const [totalUsersResult] = await connection.query(`
      SELECT COUNT(u.id) as total_users FROM users u WHERE ${ongFilterU} AND ${roleFilterU}
    `, params);
    
    const [totalSealsResult] = await connection.query(`
      SELECT IFNULL(SUM(u.seal_balance), 0) as total_seals FROM users u WHERE ${ongFilterU} AND ${roleFilterU}
    `, params);
    
    // Usamos o custo do prémio para garantir histórico antigo que possa não ter registado o valor
    const [totalRedeemedResult] = await connection.query(`
      SELECT IFNULL(SUM(IF(r.seals_redeemed > 0, r.seals_redeemed, p.custo_selos)), 0) as total_redeemed 
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id 
      JOIN prizes p ON r.prize_id = p.id
      WHERE ${ongFilterU} AND ${roleFilterU}
    `, params);

    // 2. ÚLTIMOS 5 RESGATES
    const [latestRedemptions] = await connection.query(`
      SELECT r.id, u.name as user_name, r.redemption_date, p.name as prize_name
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE ${ongFilterU} AND ${roleFilterU} 
      ORDER BY r.redemption_date DESC LIMIT 5
    `, params);

    // 3. HISTÓRICO COMPLETO DE RESGATES
    const [allRedemptions] = await connection.query(`
      SELECT r.id, u.id as user_id, u.name as user_name, u.cpf as user_cpf, r.redemption_date, p.name as prize_name, 
             IF(r.seals_redeemed > 0, r.seals_redeemed, p.custo_selos) as seals_redeemed, u.seal_balance as remaining_balance
      FROM redemptions r 
      JOIN users u ON r.user_id = u.id
      JOIN prizes p ON r.prize_id = p.id
      WHERE ${ongFilterU} AND ${roleFilterU}
      ORDER BY r.redemption_date DESC
    `, params);

    // 4. BENEFICIÁRIOS COM MAIS SELOS (TOP 5)
    const [topUsers] = await connection.query(`
      SELECT u.id, u.name, u.seal_balance 
      FROM users u 
      WHERE ${ongFilterU} AND ${roleFilterU} 
      ORDER BY u.seal_balance DESC LIMIT 5
    `, params);

    // 5. LISTA COMPLETA DE TODOS OS BENEFICIÁRIOS E SEUS DEPENDENTES
    let allUsersQuery = `
      SELECT u.*, o.fantasy_name as ong_name
      FROM users u
      LEFT JOIN ongs o ON u.ong_id = o.id
      WHERE ${ongFilterU} AND ${roleFilterU}
    `;
    let usersParams = [...params];
    
    if (search) {
      allUsersQuery += ` AND (u.name LIKE ? OR u.cpf LIKE ? OR u.email LIKE ?)`;
      usersParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    allUsersQuery += ` ORDER BY u.name ASC`;
    const [allUsers] = await connection.query(allUsersQuery, usersParams);

    if (allUsers.length > 0) {
      const userIds = allUsers.map(u => u.id);
      const [dependents] = await connection.query(
        `SELECT user_id, full_name as name, relationship, birth_date FROM dependents WHERE user_id IN (?)`,
        [userIds]
      );

      const dependentsMap = dependents.reduce((acc, dep) => {
        if (!acc[dep.user_id]) acc[dep.user_id] = [];
        acc[dep.user_id].push(dep);
        return acc;
      }, {});

      allUsers.forEach(user => {
        user.dependents = dependentsMap[user.id] || [];
      });
    }

    // LOG DE INFORMAÇÃO: Meta-Auditoria
    // Só grava o log se for a visualização inicial (sem termo de pesquisa) para não sobrecarregar o banco
    if (!search) {
        const scope = isGlobal ? 'Visão Global' : `Filtrado por OSC ID ${ongId}`;
        await registerSystemLog(actorId, actorOng, actorName, "Relatório Geral Acedido", `O administrador acedeu ao painel de Relatórios Gerais (${scope}).`, "info");
    }

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
    
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro em Relatórios", `Falha técnica ao extrair o Relatório Geral: ${error.message}`, "error");
    
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getSocialProofsReport = async (req, res) => {
    const { ongId, search } = req.query;
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;
    
    let connection;
    try {
      connection = await db.getConnection();
      
      const isGlobal = !ongId || ongId === 'all';
      const ongFilterU = isGlobal ? "u.ong_id IS NOT NULL" : "u.ong_id = ?";
      const params = isGlobal ? [] : [ongId];

      let query = `
        SELECT 
          sp.id, u.id as user_id, u.name as user_name, u.cpf as user_cpf, 
          sp.created_at as submission_date, pa.description as activity_description, 
          pa.seal_value as seals_earned, sp.status, sp.feedback_message
        FROM social_proofs sp
        JOIN users u ON sp.user_id = u.id
        JOIN proof_activities pa ON sp.activity_id = pa.id
        WHERE ${ongFilterU}
      `;
  
      if (search) {
        query += ` AND (u.name LIKE ? OR u.cpf LIKE ? OR pa.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      query += ` ORDER BY sp.created_at DESC`;
      const [socialProofs] = await connection.query(query, params);
      
      // LOG DE INFORMAÇÃO: Meta-Auditoria
      if (!search) {
        const scope = isGlobal ? 'Visão Global' : `Filtrado por OSC ID ${ongId}`;
        await registerSystemLog(actorId, actorOng, actorName, "Relatório de Provas Acedido", `O administrador acedeu ao painel de Relatório de Provas Sociais (${scope}).`, "info");
      }

      res.status(200).json(socialProofs);
    } catch (error) {
      console.error("Erro fatal ao gerar relatório de provas:", error);
      
      // LOG DE ERRO CRÍTICO
      await registerSystemLog(actorId, actorOng, actorName, "Erro em Relatórios", `Falha técnica ao extrair o Relatório de Provas Sociais: ${error.message}`, "error");
      
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
};