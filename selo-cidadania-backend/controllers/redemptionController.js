const db = require('../config/db');

// CREATE: Um utilizador resgata um prémio
exports.redeemPrize = async (req, res) => {
  const { userId, prizeId } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obter o saldo do utilizador e o custo do prémio
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

    // 3. Subtrair o custo e registar
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
  const userId = req.user.id; // Alterado para pegar do token por segurança
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
  const userId = req.user.id; 

  try {
    const [result] = await db.execute(
      'UPDATE users SET first_login_bonus = 1 WHERE id = ? AND first_login_bonus = 0',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Bônus já resgatado ou usuário não elegível." });
    }

    res.status(200).json({ message: "Bônus de primeiro login processado com sucesso." });
  } catch (error) {
    console.error("Erro no redeemFirstLogin:", error);
    res.status(500).json({ message: "Erro interno ao processar bônus." });
  }
};