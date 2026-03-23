const db = require('../config/db');

// --- ÁREA DO ADMINISTRADOR / GESTÃO DE CATÁLOGO ---

// GET: Listar todas as OSCs para o Select
exports.getAllOngs = async (req, res) => {
  try {
    // 👇 Substitui 'ongs' pelo nome exato da tua tabela (ex: oscs, organizations)
    // Usamos fantasy_name AS name para que o frontend (React) entenda.
    const sql = "SELECT id, fantasy_name AS name FROM ongs ORDER BY fantasy_name ASC";
    
    const [ongs] = await db.query(sql);
    res.status(200).json(ongs);
  } catch (error) {
    console.error("Erro ao buscar OSCs na tabela correta:", error);
    res.status(500).json({ error: "Erro ao carregar a lista de organizações." });
  }
};

// GET: Busca atividades de uma OSC específica
exports.getActivitiesByOng = async (req, res) => {
  const { ongId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM proof_activities WHERE ong_id = ? ORDER BY description ASC", [ongId]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Criar nova Atividade vinculada à OSC
exports.createActivity = async (req, res) => {
  try {
    const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!ong_id || ong_id === '0' || ong_id === '') {
      return res.status(400).json({ error: "Selecione uma OSC válida." });
    }

    const sql = `INSERT INTO proof_activities (description, seal_value, is_automatic, validation_method, image_url, ong_id) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.query(sql, [description, seal_value, is_automatic === 'true' || is_automatic == 1 ? 1 : 0, validation_method, image_url, ong_id]);

    res.status(201).json({ message: "Atividade cadastrada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT: Editar Atividade Existente
exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    let sql = `UPDATE proof_activities SET description = ?, seal_value = ?, is_automatic = ?, validation_method = ?, ong_id = ?`;
    const params = [description, seal_value, is_automatic === 'true' || is_automatic == 1 ? 1 : 0, validation_method, ong_id];

    if (image_url) {
      sql += `, image_url = ?`;
      params.push(image_url);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await db.query(sql, params);
    res.status(200).json({ message: "Atividade atualizada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Remover Atividade do catálogo
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    const [check] = await db.query("SELECT id FROM social_proofs WHERE activity_id = ? LIMIT 1", [id]);
    if (check.length > 0) {
      return res.status(400).json({ error: "Não é possível excluir: existem provas enviadas por usuários para esta atividade." });
    }

    await db.query("DELETE FROM proof_activities WHERE id = ?", [id]);
    res.status(200).json({ message: "Atividade removida com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GESTÃO DE ENVIOS (USUÁRIOS SUBMETENDO PROVAS) ---

exports.createSocialProof = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { description, userId, ongId, activity_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Pelo menos um arquivo comprobatório é obrigatório." });
    }

    const [act] = await connection.query("SELECT is_automatic, seal_value FROM proof_activities WHERE id = ?", [activity_id]);
    if (act.length === 0) throw new Error("Atividade não encontrada.");

    const status = act[0].is_automatic ? 'approved' : 'pending';
    const fileUrls = JSON.stringify(files.map(f => `/uploads/${f.filename}`));

    await connection.query(
      "INSERT INTO social_proofs (description, user_id, ong_id, activity_id, file_urls, status) VALUES (?,?,?,?,?,?)",
      [description, userId, ongId, activity_id, fileUrls, status]
    );

    if (act[0].is_automatic) {
      await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [act[0].seal_value, userId]);
    }
    await connection.commit();
    res.status(201).json({ message: "Prova enviada com sucesso!" });
  } catch (e) {
    await connection.rollback();
    res.status(500).json({ error: e.message });
  } finally { 
    connection.release(); 
  }
};

exports.getUserProofs = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT sp.*, pa.description as title FROM social_proofs sp JOIN proof_activities pa ON sp.activity_id = pa.id WHERE sp.user_id = ? ORDER BY sp.created_at DESC", [req.params.userId]);
    res.status(200).json(rows.map(r => ({ ...r, file_urls: JSON.parse(r.file_urls || '[]') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingProofs = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT sp.*, u.name as userName, pa.description as title FROM social_proofs sp JOIN users u ON sp.user_id = u.id JOIN proof_activities pa ON sp.activity_id = pa.id WHERE sp.ong_id = ? AND sp.status = 'pending' ORDER BY sp.created_at DESC", [req.params.ongId]);
    res.status(200).json(rows.map(r => ({ ...r, file_urls: JSON.parse(r.file_urls || '[]') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveProof = async (req, res) => {
  const { proofId } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [p] = await connection.query("SELECT sp.user_id, pa.seal_value FROM social_proofs sp JOIN proof_activities pa ON sp.activity_id = pa.id WHERE sp.id = ? AND sp.status = 'pending'", [proofId]);
    
    if (p.length === 0) throw new Error("Prova já processada ou inexistente.");

    await connection.query("UPDATE social_proofs SET status = 'approved' WHERE id = ?", [proofId]);
    await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [p[0].seal_value, p[0].user_id]);
    
    await connection.commit();
    res.status(200).json({ message: "Prova aprovada e selos atribuídos!" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.rejectProof = async (req, res) => {
  try {
    await db.query("UPDATE social_proofs SET status = 'rejected' WHERE id = ?", [req.params.proofId]);
    res.status(200).json({ message: "Prova rejeitada." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    await db.query("UPDATE social_proofs SET feedback_message = ? WHERE id = ?", [req.body.message, req.params.proofId]);
    res.status(200).json({ message: "Feedback enviado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};