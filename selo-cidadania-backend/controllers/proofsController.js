const db = require('../config/db');
const path = require('path');

// POST: Criar uma nova prova social
exports.createProof = async (req, res) => {
  try {
    const { userId, ongId, activity_id, description } = req.body;

    if (!userId || !ongId || !activity_id) {
      return res.status(400).json({ message: "Dados obrigatórios estão faltando." });
    }

    // Verifica se existem arquivos enviados
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    // Extrai os nomes dos arquivos e salva os caminhos relativos
    const filePaths = req.files.map(file => `/uploads/${file.filename}`);

    // Salva no banco de dados
    const query = `
      INSERT INTO proofs (user_id, ong_id, activity_id, description, file_paths, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.query(query, [
      userId,
      ongId,
      activity_id,
      description || null,
      JSON.stringify(filePaths) // salva como JSON
    ]);

    res.status(201).json({
      message: "Prova social enviada com sucesso!",
      proofId: result.insertId,
      files: filePaths
    });

  } catch (error) {
    console.error("Erro ao criar prova:", error);
    res.status(500).json({ message: "Erro ao enviar prova." });
  }
};

// ++ NOVA FUNÇÃO: USUÁRIO REENVIAR A PROVA CORRIGIDA ++
exports.updateSocialProof = async (req, res) => {
  const proofId = req.params.proofId || req.params.id;
  const { description } = req.body;
  const files = req.files;

  try {
    const db = require('../config/db');
    // Começamos por mudar o status de volta para 'pending' e limpar o avaliador
    let query = "UPDATE social_proofs SET status = 'pending', evaluated_by = NULL, evaluated_at = NULL, feedback_message = NULL";
    const params = [];

    // Se o utilizador mandou um novo comentário, atualiza
    if (description !== undefined && description !== null) {
        query += ", description = ?";
        params.push(description);
    }

    // Se o utilizador mandou novas fotos, atualiza os links
    if (files && files.length > 0) {
        const fileUrls = JSON.stringify(files.map(f => `/uploads/${f.filename}`));
        query += ", file_urls = ?";
        params.push(fileUrls);
    }

    query += " WHERE id = ?";
    params.push(proofId);

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Prova não encontrada." });
    }

    res.status(200).json({ message: "Prova atualizada e reenviada para análise!" });
  } catch (error) {
    console.error("Erro ao atualizar prova:", error);
    res.status(500).json({ error: error.message });
  }
};