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
    // 1. Extrai e converte os dados para os tipos corretos
    const { description } = req.body;
    const userId = parseInt(req.body.userId, 10);
    const ongId = parseInt(req.body.ongId, 10);
    const activityId = parseInt(req.body.activity_id, 10);
    
    const files = req.files;

    // 2. Validação robusta dos dados
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Pelo menos um arquivo de comprovante é obrigatório." });
    }
    if (isNaN(userId) || isNaN(ongId) || isNaN(activityId)) {
      return res.status(400).json({ message: "Dados inválidos. IDs de usuário, ONG e atividade devem ser números." });
    }

    // 3. Prepara os dados para o banco
    // Mapeia o array de arquivos para um array de URLs relativas
    const fileUrls = files.map(file => `/uploads/${file.filename}`);
    // Converte o array de URLs em uma string JSON para salvar no banco
    const fileUrlsJson = JSON.stringify(fileUrls);

    // 4. Executa a Query SQL
    // Verifique se os nomes das colunas (user_id, ong_id, activity_id, file_urls)
    // correspondem EXATAMENTE à sua tabela 'social_proofs'.
    const sql = `
      INSERT INTO social_proofs 
      (description, user_id, ong_id, activity_id, file_urls, status) 
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;
    
    await db.query(sql, [description, userId, ongId, activityId, fileUrlsJson]);
    
    // 5. Retorna sucesso
    res.status(201).json({ message: "Prova social enviada com sucesso para análise." });

  } catch (error) {
    // 6. Captura e loga qualquer erro do banco de dados
    console.error("ERRO AO INSERIR PROVA SOCIAL NO BANCO:", error);
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
    // A query agora seleciona 'file_urls' (plural)
    const query = `
      SELECT 
        sp.id, 
        pa.description as title, 
        u.name as userName, 
        sp.description, 
        sp.file_urls  -- <<< CORREÇÃO PRINCIPAL APLICADA AQUI
      FROM social_proofs sp
      JOIN users u ON sp.user_id = u.id
      JOIN proof_activities pa ON sp.activity_id = pa.id
      WHERE sp.ong_id = ? AND sp.status = 'pending'
      ORDER BY sp.created_at DESC
    `;
    const [rows] = await db.query(query, [ongId]);
    
    // Converte a string JSON de 'file_urls' de volta para um array
    // para que o frontend possa usá-la facilmente.
    const proofs = rows.map(proof => {
      try {
        return {
          ...proof,
          // Garante que o frontend sempre receba um array, mesmo se o campo for nulo ou malformado
          file_urls: JSON.parse(proof.file_urls || '[]') 
        };
      } catch (e) {
        // Se o JSON.parse falhar, retorna um array vazio para não quebrar o frontend
        return { ...proof, file_urls: [] };
      }
    });

    res.status(200).json(proofs);

  } catch (error) {
    // Adiciona um log de erro detalhado para facilitar a depuração futura
    console.error(`ERRO AO BUSCAR PROVAS PENDENTES PARA ONG ID ${ongId}:`, error);
    res.status(500).json({ 
      message: "Ocorreu um erro interno ao buscar as provas pendentes.",
      error: error.message 
    });
  }
};

// UPDATE: ONG aprova uma prova social (lógica de selos agora é automática)
exports.approveProof = async (req, res) => {
  const { proofId } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [proofs] = await connection.query(
      `SELECT sp.user_id, pa.seal_value FROM social_proofs sp 
       JOIN proof_activities pa ON sp.activity_id = pa.id WHERE sp.id = ?`,
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
    // A query junta com a tabela de atividades para obter a descrição como 'title'
    const query = `
      SELECT 
        sp.id, 
        pa.description as title, 
        sp.description, 
        sp.status, 
        sp.feedback_message, 
        sp.file_url 
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
