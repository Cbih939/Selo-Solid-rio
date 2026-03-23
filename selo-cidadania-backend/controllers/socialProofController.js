const db = require('../config/db');

// --- ÁREA DO ADMINISTRADOR ---

// Lista todas as OSCs para o Select inicial
exports.getAllOngs = async (req, res) => {
  try {
    // Busca todos os usuários. Se funcionar, saberemos que o problema era apenas o filtro 'role'
    const [ongs] = await db.query(
      "SELECT id, name FROM users ORDER BY name ASC"
    );
    
    console.log("Tentando carregar OSCs. Total encontrado:", ongs.length);
    res.status(200).json(ongs);
  } catch (error) {
    console.error("Erro na query getAllOngs:", error);
    res.status(500).json({ error: "Erro ao buscar organizações no banco." });
  }
};

// Busca atividades de uma OSC específica para listar nos blocos
exports.getActivitiesByOng = async (req, res) => {
  const { ongId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM proof_activities WHERE ong_id = ?", [ongId]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deletar Atividade
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    // Bloqueia exclusão se houver provas enviadas por usuários (evita erro de FK)
    const [check] = await db.query("SELECT id FROM social_proofs WHERE activity_id = ? LIMIT 1", [id]);
    if (check.length > 0) {
      return res.status(400).json({ message: "Não é possível excluir: usuários já enviaram provas para esta atividade." });
    }

    await db.query("DELETE FROM proof_activities WHERE id = ?", [id]);
    res.status(200).json({ message: "Atividade removida com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Editar Atividade (Completo)
exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    let sql = `
      UPDATE proof_activities 
      SET description = ?, seal_value = ?, is_automatic = ?, validation_method = ?, ong_id = ?
    `;
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

// POST: Criar nova (Agora garantindo o ong_id)
exports.createActivity = async (req, res) => {
  try {
    const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!ong_id || ong_id == 0) {
      return res.status(400).json({ message: "Selecione uma OSC válida." });
    }

    const sql = `INSERT INTO proof_activities (description, seal_value, is_automatic, validation_method, image_url, ong_id) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.query(sql, [description, seal_value, is_automatic === 'true' || is_automatic == 1 ? 1 : 0, validation_method, image_url, ong_id]);

    res.status(201).json({ message: "Atividade cadastrada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT: Editar atividade existente
exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    let sql = `
      UPDATE proof_activities 
      SET description = ?, seal_value = ?, is_automatic = ?, validation_method = ?, ong_id = ?
    `;
    const params = [
      description, 
      seal_value, 
      is_automatic === 'true' || is_automatic === 1 ? 1 : 0, 
      validation_method, 
      ong_id
    ];

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

// DELETE: Remover atividade
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    // Verifica se existem envios antes de deletar (Integridade referencial)
    const [linked] = await db.query("SELECT id FROM social_proofs WHERE activity_id = ? LIMIT 1", [id]);
    if (linked.length > 0) {
      return res.status(400).json({ error: "Não é possível excluir: existem provas enviadas por usuários para esta atividade." });
    }

    await db.query("DELETE FROM proof_activities WHERE id = ?", [id]);
    res.status(200).json({ message: "Atividade removida do catálogo." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Obter atividades filtradas por OSC (Para os "blocos" por OSC no front)
exports.getActivitiesByOng = async (req, res) => {
  const { ongId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM proof_activities WHERE ong_id = ? ORDER BY created_at DESC", 
      [ongId]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GESTÃO DE ENVIOS (RESTANTE DO CÓDIGO) ---

exports.createSocialProof = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { description, userId, ongId, activity_id } = req.body;
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ message: "Arquivos obrigatórios." });

    const [activities] = await connection.query("SELECT is_automatic, seal_value FROM proof_activities WHERE id = ?", [activity_id]);
    if (activities.length === 0) throw new Error("Atividade não encontrada.");
    
    const { is_automatic, seal_value } = activities[0];
    const status = is_automatic ? 'approved' : 'pending';
    const fileUrlsJson = JSON.stringify(files.map(f => `/uploads/${f.filename}`));

    await connection.query(
      "INSERT INTO social_proofs (description, user_id, ong_id, activity_id, file_urls, status) VALUES (?, ?, ?, ?, ?, ?)",
      [description, userId, ongId, activity_id, fileUrlsJson, status]
    );
    
    if (is_automatic) {
      await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [seal_value, userId]);
    }

    await connection.commit();
    res.status(201).json({ message: "Enviado com sucesso!" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// GET: Listar provas pendentes para a ONG
exports.getPendingProofs = async (req, res) => {
  const { ongId } = req.params;
  try {
    const query = `
      SELECT sp.id, pa.description as title, u.name as userName, sp.description, sp.file_urls
      FROM social_proofs sp
      JOIN users u ON sp.user_id = u.id
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE sp.ong_id = ? AND sp.status = 'pending'
      ORDER BY sp.created_at DESC
    `;
    const [rows] = await db.query(query, [ongId]);
    
    const proofs = rows.map(proof => ({
      ...proof,
      file_urls: JSON.parse(proof.file_urls || '[]')
    }));

    res.status(200).json(proofs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Aprovar prova manualmente
exports.approveProof = async (req, res) => {
  const { proofId } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [proofs] = await connection.query(
      `SELECT sp.user_id, pa.seal_value FROM social_proofs sp 
       JOIN proof_activities pa ON sp.activity_id = pa.id 
       WHERE sp.id = ? AND sp.status = 'pending'`,
      [proofId]
    );

    if (proofs.length === 0) throw new Error("Prova não encontrada ou já processada.");
    
    const { user_id, seal_value } = proofs[0];

    await connection.query("UPDATE social_proofs SET status = 'approved' WHERE id = ?", [proofId]);
    await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [seal_value, user_id]);

    await connection.commit();
    res.status(200).json({ message: "Prova aprovada e selos atribuídos." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

// UPDATE: Rejeitar prova
exports.rejectProof = async (req, res) => {
  const { proofId } = req.params;
  try {
    await db.query("UPDATE social_proofs SET status = 'rejected' WHERE id = ?", [proofId]);
    res.status(200).json({ message: "Prova rejeitada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Listar provas do usuário
exports.getUserProofs = async (req, res) => {
  const { userId } = req.params;
  try {
    const query = `
      SELECT sp.id, pa.description as title, sp.description, sp.status, sp.feedback_message, sp.file_urls
      FROM social_proofs sp
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE sp.user_id = ? ORDER BY sp.created_at DESC
    `;
    const [rows] = await db.query(query, [userId]);
    const proofs = rows.map(p => ({ ...p, file_urls: JSON.parse(p.file_urls || '[]') }));
    res.status(200).json(proofs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Feedback
exports.sendMessage = async (req, res) => {
  const { proofId } = req.params;
  const { message } = req.body;
  try {
    await db.query("UPDATE social_proofs SET feedback_message = ? WHERE id = ?", [message, proofId]);
    res.status(200).json({ message: "Mensagem enviada." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Editar prova enviada
exports.updateProof = async (req, res) => {
  const { proofId } = req.params;
  const { description, activity_id } = req.body;
  const files = req.files;

  try {
    let sql = 'UPDATE social_proofs SET description = ?, activity_id = ?';
    const params = [description, activity_id];

    if (files && files.length > 0) {
      const fileUrlsJson = JSON.stringify(files.map(f => `/uploads/${f.filename}`));
      sql += ', file_urls = ?';
      params.push(fileUrlsJson);
    }

    sql += " WHERE id = ? AND status = 'pending'"; 
    params.push(proofId);

    const [result] = await db.query(sql, params);
    if (result.affectedRows === 0) return res.status(403).json({ message: "Edição não permitida (prova já processada ou inexistente)." });

    res.status(200).json({ message: "Prova atualizada." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};