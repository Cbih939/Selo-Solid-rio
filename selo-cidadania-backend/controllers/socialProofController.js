const db = require('../config/db');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

// --- ÁREA DO ADMINISTRADOR / GESTÃO DE CATÁLOGO ---

exports.getAllOngs = async (req, res) => {
  try {
    // CORREÇÃO: Voltamos a usar 'ongs' em vez de 'oscs'
    const sql = "SELECT id, fantasy_name AS name FROM ongs ORDER BY fantasy_name ASC";
    
    const [ongs] = await db.query(sql);
    res.status(200).json(ongs);
  } catch (error) {
    console.error("Erro ao buscar OSCs na tabela correta:", error);
    
    const actorName = req.user?.name || 'Sistema';
    await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao carregar lista de OSCs: ${error.message}`, "error");
    
    res.status(500).json({ error: "Erro ao carregar a lista de organizações." });
  }
};

exports.getActivitiesByOng = async (req, res) => {
  const { ongId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM proof_activities WHERE ong_id = ? ORDER BY description ASC", [ongId]);
    res.status(200).json(rows);
  } catch (error) {
    const actorName = req.user?.name || 'Sistema';
    await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao carregar atividades da OSC ID ${ongId}: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

exports.createActivity = async (req, res) => {
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;

  try {
    const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!ong_id || ong_id === '0' || ong_id === '') {
      await registerSystemLog(actorId, actorOng, actorName, "Aviso de Validação", "Tentativa de criar atividade sem associar a uma OSC.", "warning");
      return res.status(400).json({ error: "Selecione uma OSC válida." });
    }

    const sql = `INSERT INTO proof_activities (description, seal_value, is_automatic, validation_method, image_url, ong_id) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.query(sql, [description, seal_value, is_automatic === 'true' || is_automatic == 1 ? 1 : 0, validation_method, image_url, ong_id]);

    // LOG DE SUCESSO
    await registerSystemLog(actorId, ong_id, actorName, "Nova Atividade Criada", `A atividade '${description}' (Valor: ${seal_value} selos) foi adicionada ao catálogo.`, "success");

    res.status(201).json({ message: "Atividade cadastrada com sucesso!" });
  } catch (error) {
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Criar Atividade", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const { description, seal_value, is_automatic, validation_method, ong_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';

  try {
    let sql = `UPDATE proof_activities SET description = ?, seal_value = ?, is_automatic = ?, validation_method = ?, ong_id = ?`;
    const params = [description, seal_value, is_automatic === 'true' || is_automatic == 1 ? 1 : 0, validation_method, ong_id];

    if (image_url) {
      sql += `, image_url = ?`;
      params.push(image_url);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    const [result] = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
        await registerSystemLog(actorId, ong_id, actorName, "Edição Inválida", `Tentativa de atualizar atividade ID ${id} não encontrada.`, "warning");
        return res.status(404).json({ error: "Atividade não encontrada." });
    }

    // LOG DE SUCESSO
    await registerSystemLog(actorId, ong_id, actorName, "Atividade Atualizada", `A atividade ID ${id} ('${description}') foi modificada.`, "success");

    res.status(200).json({ message: "Atividade atualizada com sucesso!" });
  } catch (error) {
    await registerSystemLog(actorId, ong_id, actorName, "Erro ao Atualizar Atividade", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

// Função atualizada com Exclusão em Cascata
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  const db = require('../config/db'); // Garanta que a importação do banco está correta
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';
  const actorOng = req.user?.ong_id || null;
  
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
      await registerSystemLog(actorId, actorOng, actorName, "Exclusão Inválida", `Tentativa de apagar atividade ID ${id} que não existe.`, "warning");
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    await connection.commit();
    
    // LOG DE SUCESSO
    await registerSystemLog(actorId, actorOng, actorName, "Atividade Excluída", `A atividade ID ${id} e todo o seu histórico de provas foram excluídos permanentemente.`, "success");
    
    res.status(200).json({ message: 'Atividade e histórico associado excluídos com sucesso!' });
    
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao excluir atividade:", error);
    await registerSystemLog(actorId, actorOng, actorName, "Erro ao Excluir Atividade", `Falha técnica ao excluir atividade ID ${id}: ${error.message}`, "error");
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
    
    const actorId = req.user?.id || userId;
    const actorName = req.user?.name || 'Beneficiário';

    if (!files || files.length === 0) {
      await registerSystemLog(actorId, ongId, actorName, "Aviso de Validação", "Utilizador tentou enviar prova sem anexos.", "warning");
      return res.status(400).json({ error: "Pelo menos um arquivo comprobatório é obrigatório." });
    }

    const [act] = await connection.query("SELECT description, is_automatic, seal_value FROM proof_activities WHERE id = ?", [activity_id]);
    if (act.length === 0) throw new Error("Atividade não encontrada.");

    const status = act[0].is_automatic ? 'approved' : 'pending';
    const fileUrls = JSON.stringify(files.map(f => `/uploads/${f.filename}`));
    
    // Converte os participantes para JSON válido (se vier vazio, salva um array vazio)
    const participantsJson = participants ? participants : '[]';

    const [insertResult] = await connection.query(
      "INSERT INTO social_proofs (description, user_id, ong_id, activity_id, file_urls, status, participants) VALUES (?,?,?,?,?,?,?)",
      [description, userId, ongId, activity_id, fileUrls, status, participantsJson]
    );

    if (act[0].is_automatic) {
      await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [act[0].seal_value, userId]);
      
      // Registo Financeiro
      await connection.query(
        "INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, 'credit', ?, ?)",
        [userId, ongId, act[0].seal_value, `Atividade Automática: ${act[0].description}`]
      );
      
      // LOG DE SUCESSO AUTOMÁTICO
      await registerSystemLog(actorId, ongId, actorName, "Prova Aprovada Automaticamente", `A atividade '${act[0].description}' rendeu ${act[0].seal_value} selos imediatos.`, "success");
    } else {
      // LOG DE SUCESSO PENDENTE
      await registerSystemLog(actorId, ongId, actorName, "Nova Prova Enviada", `Prova submetida para '${act[0].description}' e aguarda avaliação.`, "info");
    }
    
    await connection.commit();
    res.status(201).json({ message: "Prova enviada com sucesso!" });
  } catch (e) {
    if (connection) await connection.rollback();
    const actorName = req.user?.name || 'Sistema';
    await registerSystemLog(req.user?.id, req.body.ongId, actorName, "Erro ao Enviar Prova", `Falha técnica: ${e.message}`, "error");
    res.status(500).json({ error: e.message });
  } finally { 
    if (connection) connection.release(); 
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
  const actorId = req.user?.id || adminId;
  const actorName = req.user?.name || 'Administrador';
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const [p] = await connection.query("SELECT sp.user_id, sp.ong_id, pa.seal_value, pa.description FROM social_proofs sp JOIN proof_activities pa ON sp.activity_id = pa.id WHERE sp.id = ? AND sp.status = 'pending'", [proofId]);
    
    if (p.length === 0) throw new Error("Prova já processada ou inexistente.");

    await connection.query(
      "UPDATE social_proofs SET status = 'approved', evaluated_by = ?, evaluated_at = NOW() WHERE id = ?", 
      [adminId, proofId]
    );
    await connection.query("UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?", [p[0].seal_value, p[0].user_id]);
    
    // Registo Financeiro
    await connection.query(
        "INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, 'credit', ?, ?)",
        [p[0].user_id, p[0].ong_id, p[0].seal_value, `Avaliação de Prova: ${p[0].description}`]
    );
    
    await connection.commit();
    
    // LOG DE SUCESSO (Aprovação)
    await registerSystemLog(actorId, p[0].ong_id, actorName, "Prova Avaliada (Aprovada)", `Administrador aprovou a prova ID ${proofId}. Creditado ${p[0].seal_value} selos ao utilizador ID ${p[0].user_id}.`, "success");
    
    res.status(200).json({ message: "Prova aprovada e selos atribuídos!" });
  } catch (error) {
    await connection.rollback();
    await registerSystemLog(actorId, null, actorName, "Erro ao Aprovar Prova", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.rejectProof = async (req, res) => {
  const { proofId } = req.params;
  const { adminId, message } = req.body;
  const actorId = req.user?.id || adminId;
  const actorName = req.user?.name || 'Administrador';

  try {
    await db.query(
      "UPDATE social_proofs SET status = 'rejected', feedback_message = ?, evaluated_by = ?, evaluated_at = NOW() WHERE id = ?", 
      [message || null, adminId, proofId]
    );
    
    // LOG DE SUCESSO (Rejeição)
    await registerSystemLog(actorId, null, actorName, "Prova Avaliada (Rejeitada)", `Administrador rejeitou a prova ID ${proofId}. Motivo: ${message || 'Sem justificação'}`, "warning");

    res.status(200).json({ message: "Prova rejeitada com sucesso." });
  } catch (error) {
    await registerSystemLog(actorId, null, actorName, "Erro ao Rejeitar Prova", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

// ++ NOVA FUNÇÃO: DEVOLVER PARA CORREÇÃO (REENVIAR) ++
exports.requestResubmission = async (req, res) => {
  const { proofId } = req.params;
  const { adminId, message } = req.body;
  const actorId = req.user?.id || adminId;
  const actorName = req.user?.name || 'Administrador';

  try {
    await db.query(
      "UPDATE social_proofs SET status = 'needs_correction', feedback_message = ?, evaluated_by = ?, evaluated_at = NOW() WHERE id = ?", 
      [message || null, adminId, proofId]
    );
    
    // LOG DE INFORMAÇÃO (Devolução)
    await registerSystemLog(actorId, null, actorName, "Prova Devolvida para Correção", `Administrador solicitou correção na prova ID ${proofId}. Mensagem: ${message || 'Sem justificação'}`, "info");

    res.status(200).json({ message: "Prova devolvida para reenvio." });
  } catch (error) {
    await registerSystemLog(actorId, null, actorName, "Erro ao Devolver Prova", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Administrador';

  try {
    await db.query("UPDATE social_proofs SET feedback_message = ? WHERE id = ?", [req.body.message, req.params.proofId]);
    
    // LOG DE INFORMAÇÃO
    await registerSystemLog(actorId, null, actorName, "Feedback de Prova Editado", `O feedback da prova ID ${req.params.proofId} foi atualizado.`, "info");

    res.status(200).json({ message: "Feedback enviado com sucesso." });
  } catch (error) {
    await registerSystemLog(actorId, null, actorName, "Erro ao Enviar Feedback", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

// ++ NOVA FUNÇÃO DE RELATÓRIO DE AUDITORIA ++
exports.getEvaluationLog = async (req, res) => {
  const { ongId } = req.params;
  const actorId = req.user?.id || null;
  const actorName = req.user?.name || 'Sistema';

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
    
    // LOG DE INFORMAÇÃO: Meta-Auditoria
    await registerSystemLog(actorId, (ongId !== 'all' ? ongId : null), actorName, "Acesso ao Registo de Avaliações", "O administrador consultou o relatório específico de provas avaliadas.", "info");

    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro na Auditoria:", error);
    await registerSystemLog(actorId, null, actorName, "Erro no Relatório de Avaliações", `Falha técnica: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
};

// Retorna a lista de atividades para o formulário de envio de prova
exports.getActivitiesList = async (req, res) => {
    try {
        const db = require('../config/db');
        const [activities] = await db.query('SELECT id, description as title, seal_value FROM proof_activities ORDER BY description ASC');
        res.status(200).json(activities);
    } catch (error) {
        console.error("Erro ao buscar atividades:", error);
        res.status(500).json({ error: 'Erro ao buscar o catálogo de atividades' });
    }
};