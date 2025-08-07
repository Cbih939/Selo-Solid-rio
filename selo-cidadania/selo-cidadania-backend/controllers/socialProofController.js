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

// CREATE: Um utilizador submete uma nova prova social
exports.createSocialProof = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);
  const { description, userId, ongId, activity_id } = req.body;
  const fileUrl = req.file ? req.file.path : '/uploads/placeholder.jpg'; // Usa o ficheiro enviado ou um placeholder

  if (!userId || !ongId || !activity_id) {
    return res.status(400).json({ message: "Dados incompletos." });
  }

  try {
    // A query agora usa 'activity_id' e não envia 'title'
    await db.query(
      "INSERT INTO social_proofs (description, user_id, ong_id, activity_id, file_url, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [description, userId, ongId, activity_id, fileUrl]
    );
    res.status(201).json({ message: "Prova social enviada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ: ONG lista as provas pendentes
exports.getPendingProofs = async (req, res) => {
  const { ongId } = req.params;
  try {
    const query = `
      SELECT sp.id, pa.description as title, u.name as userName, sp.description as description
      FROM social_proofs sp
      JOIN users u ON sp.user_id = u.id
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE sp.ong_id = ? AND sp.status = 'pending'
    `;
    const [rows] = await db.query(query, [ongId]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: ONG aprova uma prova social
exports.approveProof = async (req, res) => {
  const { proofId } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [proofs] = await connection.query(
      `SELECT sp.user_id, pa.seal_value 
       FROM social_proofs sp 
       JOIN proof_activities pa ON sp.activity_id = pa.id 
       WHERE sp.id = ?`,
      [proofId]
    );
    if (proofs.length === 0) throw new Error("Prova social não encontrada.");
    
    const { user_id, seal_value } = proofs[0];
    await connection.query("UPDATE social_proofs SET status = 'approved' WHERE id = ?", [proofId]);
    await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [seal_value, user_id]);

    await connection.commit();
    res.status(200).json({ message: "Prova social aprovada e selos atribuídos com sucesso." });
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
    res.status(200).json({ message: "Prova social rejeitada com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET: Um utilizador lista as suas próprias provas sociais
exports.getUserProofs = async (req, res) => {
  const { userId } = req.params;
  try {
    // A query agora junta com a tabela de atividades para obter a descrição como 'title'
    const query = `
      SELECT sp.id, pa.description as title, sp.description, sp.status, sp.feedback_message, sp.file_url 
      FROM social_proofs sp
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE sp.user_id = ? 
      ORDER BY sp.created_at DESC
    `;
    const [rows] = await db.query(query, [userId]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
