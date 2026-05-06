const db = require('../config/db');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

// CREATE: Um utilizador resgata um prémio
exports.redeemPrize = async (req, res) => {
    const { userId, prizeId } = req.body;
    const actorId = req.user?.id || userId;
    const actorName = req.user?.name || 'Beneficiário';
    const actorOng = req.user?.ong_id || null;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Alterado para buscar também o nome e a ONG do utilizador, e o nome do prémio para os logs
        const [users] = await connection.query("SELECT name, ong_id, seal_balance FROM users WHERE id = ? FOR UPDATE", [userId]);
        const [prizes] = await connection.query("SELECT name, cost FROM prizes WHERE id = ?", [prizeId]);

        if (users.length === 0 || prizes.length === 0) {
            await connection.rollback();
            await registerSystemLog(actorId, actorOng, actorName, "Falha no Resgate", "Tentativa de resgate bloqueada: Utilizador ou Prémio não encontrado.", "warning");
            return res.status(404).json({ message: "Utilizador ou prémio não encontrado." });
        }

        const user = users[0];
        const prize = prizes[0];

        // CORREÇÃO DE BUG: Alterado de <= para <
        if (user.seal_balance < prize.cost) {
            await connection.rollback();
            await registerSystemLog(actorId, user.ong_id, actorName, "Saldo Insuficiente", `O utilizador '${user.name}' tentou resgatar '${prize.name}' mas não possui selos suficientes (Saldo: ${user.seal_balance}, Custo: ${prize.cost}).`, "warning");
            return res.status(400).json({ message: "Saldo de selos insuficiente." });
        }

        await connection.query("UPDATE users SET seal_balance = seal_balance - ? WHERE id = ?", [prize.cost, userId]);
        await connection.query("INSERT INTO redemptions (user_id, prize_id) VALUES (?, ?)", [userId, prizeId]);

        // ATUALIZAÇÃO IMPORTANTE: Registar no histórico financeiro para aparecer nos logs globais
        await connection.query(
            "INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, 'debit', ?, ?)",
            [userId, user.ong_id, prize.cost, `Resgate de Prémio no Shopping: ${prize.name}`]
        );

        await connection.commit();
        
        // LOG DE SUCESSO
        await registerSystemLog(actorId, user.ong_id, actorName, "Prémio Resgatado", `O utilizador '${user.name}' resgatou com sucesso o item '${prize.name}' por ${prize.cost} selos.`, "success");

        res.status(200).json({ message: "Prémio resgatado com sucesso!" });
    } catch (error) {
        if (connection) await connection.rollback();
        
        // LOG DE ERRO CRÍTICO
        await registerSystemLog(actorId, actorOng, actorName, "Erro em Resgate", `Falha técnica durante o resgate de prémio: ${error.message}`, "error");
        
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// GET: Histórico de resgates
exports.getUserRedemptions = async (req, res) => {
    const userId = req.params.userId || req.user?.id;
    try {
        const query = `
            SELECT p.name AS prize_name, r.redemption_date
            FROM redemptions r
            JOIN prizes p ON r.prize_id = p.id
            WHERE r.user_id = ?
            ORDER BY r.redemption_date DESC
        `;
        const [rows] = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        // LOG DE ERRO
        const actorName = req.user?.name || 'Sistema';
        await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro de Sistema", `Falha ao carregar o histórico de resgates: ${error.message}`, "error");
        res.status(500).json({ error: error.message });
    }
};

// POST: Resgate de bônus de primeiro login
exports.redeemFirstLogin = async (req, res) => {
  try {
    const userId = req.user?.id;
    const actorName = req.user?.name || 'Beneficiário';
    const actorOng = req.user?.ong_id || null;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const [existing] = await db.query(
      `SELECT id FROM redemptions WHERE user_id = ? AND prize_id IS NULL`,
      [userId]
    );

    if (existing.length > 0) {
      // LOG DE AVISO (Proteção contra dupla cobrança)
      await registerSystemLog(userId, actorOng, actorName, "Aviso de Bónus", "O utilizador tentou resgatar o bónus de primeiro login novamente.", "warning");
      return res.status(400).json({
        message: 'Bônus de primeiro login já resgatado.'
      });
    }

    await db.query(
      `UPDATE users SET seal_balance = seal_balance + 10 WHERE id = ?`,
      [userId]
    );

    await db.query(
      `INSERT INTO redemptions (user_id, prize_id)
       VALUES (?, NULL)`,
      [userId]
    );

    // ATUALIZAÇÃO IMPORTANTE: Registar o crédito no histórico financeiro
    await db.query(
        "INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, 'credit', 10, 'Bônus de Primeiro Acesso')",
        [userId, actorOng]
    );

    // LOG DE SUCESSO
    await registerSystemLog(userId, actorOng, actorName, "Bónus Inicial Resgatado", "O utilizador iniciou sessão pela primeira vez e recebeu o bónus de 10 selos.", "success");

    return res.json({
      message: 'Bônus de primeiro login resgatado com sucesso!'
    });

  } catch (error) {
    console.error('ERRO redeemFirstLogin:', error);
    
    // LOG DE ERRO CRÍTICO
    const actorName = req.user?.name || 'Sistema';
    await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro em Bónus Inicial", `Falha técnica ao processar o bónus de login: ${error.message}`, "error");
    
    res.status(500).json({
      message: 'Erro ao processar bônus.'
    });
  }
};