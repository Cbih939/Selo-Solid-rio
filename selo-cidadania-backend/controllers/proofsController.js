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

// =========================================================================
// ENVIO MANUAL POR ADMINISTRADOR (Aprova e credita selos automaticamente)
// =========================================================================
exports.adminSubmitProof = async (req, res) => {
    // A rota deve ser protegida para garantir que quem chama é admin1 ou admin5
    if (!req.user || (req.user.role_id !== 1 && req.user.role_id !== 5)) {
        return res.status(403).json({ error: 'Apenas Administradores podem usar esta funcionalidade.' });
    }

    const { user_id, activity_id, proof_base64 } = req.body;
    const evaluatorName = req.user.name;

    if (!user_id || !activity_id) {
        return res.status(400).json({ error: 'É necessário selecionar um beneficiário e uma atividade.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Processar e guardar a imagem (se existir)
        let proofUrl = null;
        if (proof_base64) {
            const path = require('path');
            const fs = require('fs');
            const matches = proof_base64.match(/^data:(.+);base64,(.+)$/);
            
            if (matches && matches.length === 3) {
                const fileExtension = matches[1].split('/')[1] || 'jpg';
                const fileBuffer = Buffer.from(matches[2], 'base64');
                const filename = `admin-proof-${Date.now()}.${fileExtension}`;
                const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
                
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                fs.writeFileSync(path.join(uploadDir, filename), fileBuffer);
                proofUrl = `/uploads/${filename}`;
            }
        }

        // 2. Procurar o valor da atividade em selos
        const [activity] = await connection.query('SELECT seal_value, description FROM proof_activities WHERE id = ?', [activity_id]);
        if (activity.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'A atividade selecionada não existe no catálogo.' });
        }
        
        const sealValue = activity[0].seal_value;
        const feedbackMsg = `Submetida e Aprovada automaticamente pelo Administrador: ${evaluatorName}`;

        // 3. Inserir a Prova Social já com o status "approved"
        await connection.query(
            `INSERT INTO social_proofs 
             (user_id, activity_id, proof_url, status, evaluator_id, evaluator_name, evaluated_at, feedback_message) 
             VALUES (?, ?, ?, 'approved', ?, ?, NOW(), ?)`,
            [user_id, activity_id, proofUrl, req.user.id, evaluatorName, feedbackMsg]
        );

        // 4. Creditar os selos na carteira do beneficiário
        const [updateResult] = await connection.query(
            'UPDATE users SET seal_balance = seal_balance + ? WHERE id = ?',
            [sealValue, user_id]
        );

        if (updateResult.affectedRows === 0) {
             await connection.rollback();
             return res.status(404).json({ error: 'O beneficiário selecionado não foi encontrado.' });
        }

        // 5. Registar no Histórico Financeiro
        // Primeiro precisamos saber o ID da ONG do beneficiário
        const [user] = await connection.query('SELECT ong_id FROM users WHERE id = ?', [user_id]);
        const ongId = user.length > 0 ? user[0].ong_id : null;

        await connection.query(
            'INSERT INTO balance_history (user_id, ong_id, transaction_type, amount, reason) VALUES (?, ?, ?, ?, ?)',
            [user_id, ongId, 'credit', sealValue, `Prova Social via Administrador (${activity[0].description})`]
        );

        await connection.commit();
        res.status(200).json({ 
            message: `Prova enviada! ${sealValue} selos foram creditados na conta do beneficiário.` 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Erro no adminSubmitProof:", error);
        res.status(500).json({ error: 'Erro interno ao submeter a prova manual.' });
    } finally {
        if (connection) connection.release();
    }
};