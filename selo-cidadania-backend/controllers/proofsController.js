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
    console.error("Erro ao criar prova social:", error);
    res.status(500).json({ message: "Erro ao enviar prova social." });
  }
};
