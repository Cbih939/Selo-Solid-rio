const db = require('../config/db');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

// CREATE: Cadastrar um novo prémio
exports.createPrize = async (req, res) => {
  const { name, cost } = req.body;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;

  try {
    const [result] = await db.query(
      "INSERT INTO prizes (name, cost) VALUES (?, ?)",
      [name, cost]
    );
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Novo Prémio no Catálogo", `O prémio '${name}' com custo de ${cost} selos foi adicionado.`, "success");

    res.status(201).json({ id: result.insertId, name, cost });
  } catch (error) {
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Criar Prémio", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

// READ: Listar todos os prémios
exports.getAllPrizes = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, cost FROM prizes");
    res.status(200).json(rows);
  } catch (error) {
    // LOG DE ERRO
    const actorName = req.user?.name || 'Sistema / Anônimo';
    await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao listar prémios: ${error.message}`, "error");
    
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Editar um prémio (NOVO)
exports.updatePrize = async (req, res) => {
  const { id } = req.params;
  const { name, cost } = req.body;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;

  try {
    const [result] = await db.query(
      "UPDATE prizes SET name = ?, cost = ? WHERE id = ?",
      [name, cost, id]
    );
    
    if (result.affectedRows === 0) {
      await registerSystemLog(actorId, actorOng, actorName, "Edição Inválida", `Tentativa de atualizar o prémio ID ${id} que não existe.`, "warning");
      return res.status(404).json({ message: "Prémio não encontrado." });
    }

    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Prémio Atualizado", `O prémio ID ${id} foi atualizado para '${name}' custando ${cost} selos.`, "success");

    res.status(200).json({ message: "Prémio atualizado com sucesso." });
  } catch (error) {
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Atualizar Prémio", `Falha técnica no prémio ID ${id}: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Excluir um prémio
exports.deletePrize = async (req, res) => {
  const { id } = req.params;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;

  try {
    const [result] = await db.query("DELETE FROM prizes WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      await registerSystemLog(actorId, actorOng, actorName, "Exclusão Inválida", `Tentativa de excluir o prémio ID ${id} que já não existe.`, "warning");
      return res.status(404).json({ message: "Prémio não encontrado." });
    }

    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Prémio Excluído", `O prémio ID ${id} foi removido do catálogo permanentemente.`, "success");

    res.status(200).json({ message: "Prémio excluído com sucesso." });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        // LOG DE AVISO (Bloqueio por regra de negócio)
        await registerSystemLog(actorId, actorOng, actorName, "Exclusão Bloqueada", `Tentativa de excluir o prémio ID ${id} bloqueada porque ele já possui um histórico de resgates pelos utilizadores.`, "warning");
        return res.status(400).json({ message: "Não é possível excluir este prémio, pois ele já foi resgatado por um ou mais utilizadores." });
    }
    
    // LOG DE ERRO CRÍTICO
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Excluir Prémio", `Falha técnica no prémio ID ${id}: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};