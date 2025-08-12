const db = require('../config/db');

// CREATE: Um utilizador resgata um prémio
exports.redeemPrize = async (req, res) => {
  const { userId, prizeId } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obter o saldo do utilizador e o custo do prémio (com lock para evitar race conditions)
    const [users] = await connection.query("SELECT seal_balance FROM users WHERE id = ? FOR UPDATE", [userId]);
    const [prizes] = await connection.query("SELECT cost FROM prizes WHERE id = ?", [prizeId]);

    if (users.length === 0 || prizes.length === 0) {
      throw new Error("Utilizador ou prémio não encontrado.");
    }

    const userBalance = users[0].seal_balance;
    const prizeCost = prizes[0].cost;

    // 2. Verificar se o utilizador tem selos suficientes
    if (userBalance < prizeCost) {
      await connection.rollback();
      return res.status(400).json({ message: "Saldo de selos insuficiente para resgatar este prémio." });
    }

    // 3. Subtrair o custo do saldo do utilizador
    await connection.query("UPDATE users SET seal_balance = seal_balance - ? WHERE id = ?", [prizeCost, userId]);

    // 4. Registar o resgate na tabela 'redemptions'
    await connection.query("INSERT INTO redemptions (user_id, prize_id) VALUES (?, ?)", [userId, prizeId]);

    await connection.commit();
    res.status(200).json({ message: "Prémio resgatado com sucesso!" });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// GET: Obter o histórico de resgates de um utilizador (NOVO)
exports.getUserRedemptions = async (req, res) => {
  const { userId } = req.params;
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