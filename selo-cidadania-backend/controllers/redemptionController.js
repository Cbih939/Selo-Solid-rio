const db = require('../config/db');

// CREATE: Um utilizador resgata um prémio
exports.redeemPrize = async (req, res) => {
    const { userId, prizeId } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [users] = await connection.query("SELECT seal_balance FROM users WHERE id = ? FOR UPDATE", [userId]);
        const [prizes] = await connection.query("SELECT cost FROM prizes WHERE id = ?", [prizeId]);

        if (users.length === 0 || prizes.length === 0) {
            throw new Error("Utilizador ou prémio não encontrado.");
        }

        const userBalance = users[0].seal_balance;
        const prizeCost = prizes[0].cost;

        if (userBalance <= prizeCost) {
            await connection.rollback();
            return res.status(400).json({ message: "Saldo de selos insuficiente." });
        }

        await connection.query("UPDATE users SET seal_balance = seal_balance - ? WHERE id = ?", [prizeCost, userId]);
        await connection.query("INSERT INTO redemptions (user_id, prize_id) VALUES (?, ?)", [userId, prizeId]);

        await connection.commit();
        res.status(200).json({ message: "Prémio resgatado com sucesso!" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// GET: Histórico de resgates
exports.getUserRedemptions = async (req, res) => {
    const userId = req.params.userId || req.user.id;
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
        res.status(500).json({ error: error.message });
    }
};

// POST: Resgate de bônus de primeiro login
exports.redeemFirstLogin = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const [existing] = await db.query(
      `SELECT id FROM redemptions WHERE user_id = ? AND prize_id IS NULL`,
      [userId]
    );

    if (existing.length > 0) {
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

    return res.json({
      message: 'Bônus de primeiro login resgatado com sucesso!'
    });

  } catch (error) {
    console.error('ERRO redeemFirstLogin:', error);
    res.status(500).json({
      message: 'Erro ao processar bônus.'
    });
  }
};