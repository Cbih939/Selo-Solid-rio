// Arquivo: controllers/socialProofController.js
const db = require('../config/db');

// --- GESTÃO DE CATÁLOGO DE ATIVIDADES (ADMIN/OSC) ---

// GET: Obter a lista de todas as atividades disponíveis (Agora com imagem e tipo de validação)
exports.getActivities = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, description, seal_value, image_url, is_automatic FROM proof_activities ORDER BY description ASC");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Criar uma nova atividade social (Catálogo)
exports.createActivity = async (req, res) => {
  try {
    const { description, seal_value, is_automatic, validation_method } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
      INSERT INTO proof_activities (description, seal_value, is_automatic, validation_method, image_url) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [description, seal_value, is_automatic, validation_method, image_url]);

    res.status(201).json({ message: "Atividade cadastrada com sucesso!", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GESTÃO DE ENVIOS DE PROVAS (USUÁRIO/BENEFICIÁRIO) ---

// POST: Um utilizador submete uma nova prova social (Com lógica de aprovação automática)
exports.createSocialProof = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { description } = req.body;
    const userId = parseInt(req.body.userId, 10);
    const ongId = parseInt(req.body.ongId, 10);
    const activityId = parseInt(req.body.activity_id, 10);
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Pelo menos um arquivo de comprovante é obrigatório." });
    }

    // Busca dados da atividade para verificar se é automática
    const [activities] = await connection.query(
      "SELECT is_automatic, seal_value FROM proof_activities WHERE id = ?", 
      [activityId]
    );

    if (activities.length === 0) throw new Error("Atividade não encontrada.");
    
    const { is_automatic, seal_value } = activities[0];
    const status = is_automatic ? 'approved' : 'pending';

    const fileUrls = files.map(file => `/uploads/${file.filename}`);
    const fileUrlsJson = JSON.stringify(fileUrls);

    const sql = `
      INSERT INTO social_proofs 
      (description, user_id, ong_id, activity_id, file_urls, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await connection.query(sql, [description, userId, ongId, activityId, fileUrlsJson, status]);
    
    // Se for automática, já credita os selos na hora
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
    console.error("ERRO AO INSERIR PROVA:", error);
    res.status(500).json({ message: "Erro ao salvar a prova.", error: error.message });
  } finally {
    connection.release();
  }
};

// READ: ONG lista as provas pendentes
exports.getPendingProofs = async (req, res) => {
  const { ongId } = req.params;
  try {
    const query = `
      SELECT 
        sp.id, 
        pa.description as title, 
        u.name as userName, 
        sp.description, 
        sp.file_urls
      FROM social_proofs sp
      JOIN users u ON sp.user_id = u.id
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE sp.ong_id = ? AND sp.status = 'pending'
      ORDER BY sp.created_at DESC
    `;
    const [rows] = await db.query(query, [ongId]);
    
    const proofs = rows.map(proof => {
      try {
        return { ...proof, file_urls: JSON.parse(proof.file_urls || '[]') };
      } catch (e) {
        return { ...proof, file_urls: [] };
      }
    });

    res.status(200).json(proofs);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar provas pendentes.", error: error.message });
  }
};

// UPDATE: ONG aprova uma prova social manualmente
exports.approveProof = async (req, res) => {
  const { proofId } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [proofs] = await connection.query(
      `SELECT sp.user_id, sp.file_urls, pa.seal_value 
       FROM social_proofs sp 
       JOIN proof_activities pa ON sp.activity_id = pa.id 
       WHERE sp.id = ? AND sp.status = 'pending'`,
      [proofId]
    );

    if (proofs.length === 0) throw new Error("Prova não encontrada ou já processada.");
    
    const { user_id, seal_value, file_urls } = proofs[0];

    if (!file_urls || file_urls === '[]' || file_urls === 'null') {
      throw new Error("Prova sem imagens comprobatórias.");
    }

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

// UPDATE: ONG rejeita uma prova social
exports.rejectProof = async (req, res) => {
  const { proofId } = req.params;
  try {
    await db.query("UPDATE social_proofs SET status = 'rejected' WHERE id = ?", [proofId]);
    res.status(200).json({ message: "Prova rejeitada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Um utilizador lista as suas próprias provas sociais
exports.getUserProofs = async (req, res) => {
  const { userId } = req.params;
  try {
    const query = `
      SELECT 
        sp.id, 
        pa.description as title, 
        sp.description, 
        sp.status, 
        sp.feedback_message, 
        sp.file_urls
      FROM social_proofs sp
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE sp.user_id = ? 
      ORDER BY sp.created_at DESC
    `;
    const [rows] = await db.query(query, [userId]);

    const proofs = rows.map(proof => {
      try {
        return { ...proof, file_urls: JSON.parse(proof.file_urls || '[]') };
      } catch (e) {
        return { ...proof, file_urls: [] };
      }
    });

    res.status(200).json(proofs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Feedback para prova
exports.sendMessage = async (req, res) => {
  const { proofId } = req.params;
  const { message } = req.body;
  try {
    await db.query("UPDATE social_proofs SET feedback_message = ? WHERE id = ?", [message, proofId]);
    res.status(200).json({ message: "Mensagem enviada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Editar prova pendente
exports.updateProof = async (req, res) => {
  const { proofId } = req.params;
  const { description, activity_id } = req.body;
  const files = req.files;

  try {
    let fileUrlsJson = null;
    if (files && files.length > 0) {
      const fileUrls = files.map(file => `/uploads/${file.filename}`);
      fileUrlsJson = JSON.stringify(fileUrls);
    }

    let sql = 'UPDATE social_proofs SET description = ?, activity_id = ?';
    const params = [description, activity_id];

    if (fileUrlsJson) {
      sql += ', file_urls = ?';
      params.push(fileUrlsJson);
    }

    sql += " WHERE id = ? AND status = 'pending'"; 
    params.push(proofId);

    const [result] = await db.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Não permitido." });

    res.status(200).json({ message: "Prova atualizada." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Deletar atividade (Catálogo)
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM proof_activities WHERE id = ?", [id]);
    res.status(200).json({ message: "Atividade removida com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Não é possível remover atividades que já possuem envios vinculados." });
  }
};