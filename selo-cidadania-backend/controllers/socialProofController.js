const db = require('../config/db');

// --- ÁREA DO ADMINISTRADOR / GESTÃO DE CATÁLOGO ---

exports.getAllOngs = async (req, res) => {
  try {
    // CORREÇÃO: Voltamos a usar 'ongs' em vez de 'oscs'
    const sql = "SELECT id, fantasy_name AS name FROM ongs ORDER BY fantasy_name ASC";
    
    const [ongs] = await db.query(sql);
    res.status(200).json(ongs);
  } catch (error) {
    console.error("Erro ao buscar OSCs na tabela correta:", error);
    res.status(500).json({ error: "Erro ao carregar a lista de organizações." });
  }
};

exports.getActivitiesByOng = async (req, res) => {
  const { ongId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM proof_activities WHERE ong_id = ? ORDER BY description ASC", [ongId]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

// Função atualizada com Exclusão em Cascata
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  const db = require('../config/db'); // Garanta que a importação do banco está correta
  
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. PRIMEIRO: Apagar todas as provas sociais (histórico) vinculadas a esta atividade
    await connection.query('DELETE FROM social_proofs WHERE activity_id = ?', [id]);

    // 2. SEGUNDO: Apagar a atividade do catálogo
    const [result] = await connection.query('DELETE FROM proof_activities WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Atividade e histórico associado excluídos com sucesso!' });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao excluir atividade:", error);
    res.status(500).json({ error: 'Erro interno ao excluir a atividade.' });
  } finally {
    if (connection) connection.release();
  }
};

// --- GESTÃO DE ENVIOS (USUÁRIOS SUBMETENDO PROVAS) ---

exports.createSocialProof = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // ++ AGORA RECEBE participants ++
    const { description, userId, ongId, activity_id, participants } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Pelo menos um arquivo comprobatório é obrigatório." });
    }

    const [act] = await connection.query("SELECT is_automatic, seal_value FROM proof_activities WHERE id = ?", [activity_id]);
    if (act.length === 0) throw new Error("Atividade não encontrada.");

    const status = act[0].is_automatic ? 'approved' : 'pending';
    const fileUrls = JSON.stringify(files.map(f => `/uploads/${f.filename}`));
    
    // Converte os participantes para JSON válido (se vier vazio, salva um array vazio)
    const participantsJson = participants ? participants : '[]';

    await connection.query(
      "INSERT INTO social_proofs (description, user_id, ong_id, activity_id, file_urls, status, participants) VALUES (?,?,?,?,?,?,?)",
      [description, userId, ongId, activity_id, fileUrls, status, participantsJson]
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
    const query = `
      SELECT 
        sp.*, 
        pa.description as title,
        u_evaluator.name as evaluator_name
      FROM social_proofs sp 
      JOIN proof_activities pa ON sp.activity_id = pa.id 
      LEFT JOIN users u_evaluator ON sp.evaluated_by = u_evaluator.id
      WHERE sp.user_id = ? 
      ORDER BY sp.created_at DESC
    `;
    const [rows] = await db.query(query, [req.params.userId]);
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
  const { adminId } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [p] = await connection.query("SELECT sp.user_id, pa.seal_value FROM social_proofs sp JOIN proof_activities pa ON sp.activity_id = pa.id WHERE sp.id = ? AND sp.status = 'pending'", [proofId]);
    
    if (p.length === 0) throw new Error("Prova já processada ou inexistente.");

    await connection.query(
      "UPDATE social_proofs SET status = 'approved', evaluated_by = ?, evaluated_at = NOW() WHERE id = ?", 
      [adminId, proofId]
    );
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
  const { proofId } = req.params;
  const { adminId, message } = req.body; // Agora recebe a mensagem junto
  try {
    await db.query(
      "UPDATE social_proofs SET status = 'rejected', feedback_message = ?, evaluated_by = ?, evaluated_at = NOW() WHERE id = ?", 
      [message || null, adminId, proofId]
    );
    res.status(200).json({ message: "Prova rejeitada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ++ NOVA FUNÇÃO: DEVOLVER PARA CORREÇÃO (REENVIAR) ++
exports.requestResubmission = async (req, res) => {
  const { proofId } = req.params;
  const { adminId, message } = req.body;
  try {
    await db.query(
      "UPDATE social_proofs SET status = 'needs_correction', feedback_message = ?, evaluated_by = ?, evaluated_at = NOW() WHERE id = ?", 
      [message || null, adminId, proofId]
    );
    res.status(200).json({ message: "Prova devolvida para reenvio." });
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

// ++ NOVA FUNÇÃO DE RELATÓRIO DE AUDITORIA ++
// ++ NOVA FUNÇÃO DE RELATÓRIO DE AUDITORIA (CORRIGIDA) ++
// ++ NOVA FUNÇÃO DE RELATÓRIO DE AUDITORIA (LÊ PROVAS E BÔNUS MANUAIS) ++
exports.getEvaluationLog = async (req, res) => {
  const { ongId } = req.params;
  try {
    let query = `
      SELECT 
        sp.id,
        COALESCE(pa.description, sp.title) as activity_title,
        COALESCE(pa.seal_value, sp.seal_value) as seal_value,
        u_sender.name as sender_name,
        sp.created_at as sent_at,
        COALESCE(u_evaluator.name, sp.evaluator_name) as evaluator_name,
        sp.evaluated_at as evaluated_at,
        sp.status,
        sp.feedback_message,
        o.fantasy_name as ong_name
      FROM social_proofs sp
      LEFT JOIN proof_activities pa ON sp.activity_id = pa.id
      JOIN users u_sender ON sp.user_id = u_sender.id
      LEFT JOIN users u_evaluator ON sp.evaluated_by = u_evaluator.id
      LEFT JOIN ongs o ON sp.ong_id = o.id 
    `;
    // Nota: O uso do COALESCE e LEFT JOIN permite que o sistema mostre a Prova Social, 
    // e se for um Bônus Manual (sem atividade), ele mostra os dados do bônus!

    const queryParams = [];

    // Se não for 'all', filtra pela OSC específica.
    if (ongId !== 'all') {
      query += ` WHERE sp.ong_id = ? AND sp.status IN ('approved', 'rejected')`;
      queryParams.push(ongId);
    } else {
      query += ` WHERE sp.status IN ('approved', 'rejected')`;
    }

    query += ` ORDER BY sp.evaluated_at DESC`;

    const [rows] = await db.query(query, queryParams);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro na Auditoria:", error);
    res.status(500).json({ error: error.message });
  }
};