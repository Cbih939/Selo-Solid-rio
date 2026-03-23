const db = require('../config/db');

// --- GESTÃO DE CATÁLOGO DE ATIVIDADES (ADMIN/OSC) ---

// POST: Criar uma nova atividade social (Catálogo)
exports.createActivity = async (req, res) => {
  try {
    const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
      INSERT INTO proof_activities (description, seal_value, is_automatic, validation_method, image_url, ong_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      description, 
      seal_value, 
      is_automatic === 'true' || is_automatic === 1 ? 1 : 0, 
      validation_method, 
      image_url, 
      ong_id
    ]);

    res.status(201).json({ message: "Atividade da sua OSC cadastrada!", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT: Editar uma atividade existente
exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const { description, seal_value, is_automatic, validation_method } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    let sql = `UPDATE proof_activities SET description = ?, seal_value = ?, is_automatic = ?, validation_method = ?`;
    const params = [description, seal_value, is_automatic === 'true' || is_automatic === 1 ? 1 : 0, validation_method];

    if (image_url) {
      sql += `, image_url = ?`;
      params.push(image_url);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await db.query(sql, params);
    res.status(200).json({ message: "Atividade atualizada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Deletar atividade
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM proof_activities WHERE id = ?", [id]);
    res.status(200).json({ message: "Atividade removida com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Não é possível remover atividades que já possuem envios vinculados." });
  }
};

// GET: Obter a lista de todas as atividades de uma ONG
exports.getActivities = async (req, res) => {
  const { ongId } = req.query;
  try {
    const [rows] = await db.query(
      "SELECT * FROM proof_activities WHERE ong_id = ? ORDER BY description ASC", 
      [ongId]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GESTÃO DE ENVIOS DE PROVAS (USUÁRIO/BENEFICIÁRIO) ---

// POST: Submeter nova prova social
exports.createSocialProof = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { description, userId, ongId, activity_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Pelo menos um arquivo de comprovante é obrigatório." });
    }

    const [activities] = await connection.query(
      "SELECT is_automatic, seal_value FROM proof_activities WHERE id = ?", 
      [activity_id]
    );

    if (activities.length === 0) throw new Error("Atividade não encontrada.");
    
    const { is_automatic, seal_value } = activities[0];
    const status = is_automatic ? 'approved' : 'pending';
    const fileUrlsJson = JSON.stringify(files.map(file => `/uploads/${file.filename}`));

    const sql = `
      INSERT INTO social_proofs (description, user_id, ong_id, activity_id, file_urls, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await connection.query(sql, [description, userId, ongId, activity_id, fileUrlsJson, status]);
    
    if (is_automatic) {
      await connection.query(
        "UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", 
        [seal_value, userId]
      );
    }

    await connection.commit();
    res.status(201).json({ 
      message: is_automatic 
        ? "Prova validada automaticamente! Selos adicionados." 
        : "Prova enviada com sucesso para análise da OSC." 
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Erro ao salvar a prova.", error: error.message });
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