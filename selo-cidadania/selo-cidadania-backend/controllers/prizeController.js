const db = require('../config/db');

// CREATE: Cadastrar um novo prémio
exports.createPrize = async (req, res) => {
  const { name, cost } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO prizes (name, cost) VALUES (?, ?)",
      [name, cost]
    );
    res.status(201).json({ id: result.insertId, name, cost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ: Listar todos os prémios
exports.getAllPrizes = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, cost FROM prizes");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Editar um prémio (NOVO)
exports.updatePrize = async (req, res) => {
  const { id } = req.params;
  const { name, cost } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE prizes SET name = ?, cost = ? WHERE id = ?",
      [name, cost, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Prémio não encontrado." });
    }
    res.status(200).json({ message: "Prémio atualizado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Excluir um prémio
exports.deletePrize = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM prizes WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Prémio não encontrado." });
    }
    res.status(200).json({ message: "Prémio excluído com sucesso." });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: "Não é possível excluir este prémio, pois ele já foi resgatado por um ou mais utilizadores." });
    }
    res.status(500).json({ error: error.message });
  }
};