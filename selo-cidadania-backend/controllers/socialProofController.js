// Arquivo: controllers/socialProofController.js
const db = require('../config/db');

// GET: Obter a lista de todas as atividades disponíveis
exports.getActivities = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, description, seal_value FROM proof_activities ORDER BY description ASC");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Um utilizador submete uma nova prova social
exports.createSocialProof = async (req, res) => {
  try {
    const { description } = req.body;
    const userId = parseInt(req.body.userId, 10);
    const ongId = parseInt(req.body.ongId, 10);
    const activityId = parseInt(req.body.activity_id, 10);
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Pelo menos um arquivo de comprovante é obrigatório." });
    }
    if (isNaN(userId) || isNaN(ongId) || isNaN(activityId)) {
      return res.status(400).json({ message: "Dados inválidos. IDs de usuário, ONG e atividade devem ser números." });
    }

    const fileUrls = files.map(file => `/uploads/${file.filename}`);
    const fileUrlsJson = JSON.stringify(fileUrls);

    const sql = `
      INSERT INTO social_proofs 
      (description, user_id, ong_id, activity_id, file_urls, status) 
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;
    
    await db.query(sql, [description, userId, ongId, activityId, fileUrlsJson]);
    
    res.status(201).json({ message: "Prova enviada com sucesso para análise." });

  } catch (error) {
    console.error("ERRO AO INSERIR PROVA NO BANCO:", error);
    res.status(500).json({ 
      message: "Ocorreu um erro interno no servidor ao salvar a prova.",
      error: error.message 
    });
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
    console.error(`ERRO AO BUSCAR PROVAS PENDENTES PARA ONG ID ${ongId}:`, error);
    res.status(500).json({ 
      message: "Ocorreu um erro interno ao buscar as provas pendentes.",
      error: error.message 
    });
  }
};

// UPDATE: ONG aprova uma prova social (Com validação de ficheiros)
exports.approveProof = async (req, res) => {
  const { proofId } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Busca os dados da prova e o valor em selos da atividade
    const [proofs] = await connection.query(
      `SELECT sp.user_id, sp.file_urls, pa.seal_value 
       FROM social_proofs sp 
       JOIN proof_activities pa ON sp.activity_id = pa.id 
       WHERE sp.id = ?`,
      [proofId]
    );

    if (proofs.length === 0) throw new Error("Prova não encontrada.");
    
    const { user_id, seal_value, file_urls } = proofs[0];

    // VALIDAÇÃO DE SEGURANÇA: Impede aprovação se file_urls for null ou vazio
    if (!file_urls || file_urls === '[]' || file_urls === 'null') {
      throw new Error("Não é possível aprovar uma prova social que não contém imagens comprobatórias.");
    }

    // Atualiza status da prova
    await connection.query("UPDATE social_proofs SET status = 'approved' WHERE id = ?", [proofId]);
    
    // Adiciona o saldo de selos ao utilizador
    await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [seal_value, user_id]);

    await connection.commit();
    res.status(200).json({ message: "Prova aprovada e selos atribuídos com sucesso." });
  } catch (error) {
    await connection.rollback();
    console.error("ERRO NA APROVAÇÃO:", error.message);
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
    console.error(`ERRO FATAL AO BUSCAR PROVAS PARA O USUÁRIO ${userId}:`, error);
    res.status(500).json({ 
      message: "Ocorreu um erro no servidor ao buscar suas provas.",
      error: error.message 
    });
  }
};

// UPDATE: ONG envia uma mensagem de feedback para uma prova social
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

// UPDATE: Um utilizador edita uma prova social pendente
exports.updateProof = async (req, res) => {
  const { proofId } = req.params;
  const { description, activity_id } = req.body;
  const files = req.files;

  try {
    if (!description || !activity_id) {
      return res.status(400).json({ message: "Descrição e atividade são obrigatórias." });
    }

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

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Prova não encontrada ou já não está pendente." });
    }

    res.status(200).json({ message: "Prova social atualizada com sucesso." });

  } catch (error) {
    console.error(`ERRO AO ATUALIZAR PROVA ${proofId}:`, error);
    res.status(500).json({ 
      message: "Ocorreu um erro no servidor ao atualizar a prova.",
      error: error.message 
    });
  }
};