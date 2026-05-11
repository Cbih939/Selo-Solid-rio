const db = require('../config/db');

// =========================================================================
// FUNÇÃO UTILITÁRIA DE AUDITORIA (O Coração do Sistema de Logs)
// Exportada para ser usada por todos os outros controllers do sistema.
// =========================================================================
exports.registerSystemLog = async (userId, ongId, userName, action, details, status = 'info') => {
    try {
        await db.query(
            `INSERT INTO system_logs (user_id, ong_id, user_name, action, details, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId || null, ongId || null, userName || null, action, details, status]
        );
    } catch (error) {
        console.error("Erro ao gravar log no banco de dados:", error);
    }
};

// =========================================================================
// Rota para o frontend buscar o Super Histórico Unificado
// =========================================================================
exports.getUnifiedLogs = async (req, res) => {
    // Coleta dos dados do autor da requisição (Admin acessando os logs)
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    try {
        const unifiedLogs = [];

        // 1. DADOS FINANCEIROS REAIS
        const [financeLogs] = await db.query(`
            SELECT bh.id, bh.created_at as timestamp, u.name as user_name, o.fantasy_name as ong_name, o.id as ong_id,
                   bh.transaction_type, bh.amount, bh.reason
            FROM balance_history bh
            LEFT JOIN users u ON bh.user_id = u.id
            LEFT JOIN ongs o ON u.ong_id = o.id
            ORDER BY bh.created_at DESC LIMIT 200
        `);

        financeLogs.forEach(log => {
            unifiedLogs.push({
                id: `fin-${log.id}`,
                timestamp: log.timestamp,
                user_name: log.user_name || 'Usuário Removido',
                ong_name: log.ong_name || 'N/A',
                ong_id: log.ong_id,
                action: log.transaction_type === 'credit' ? 'Crédito de Selos' : 'Débito / Resgate',
                details: log.reason || 'Movimentação na carteira',
                type: 'financial',
                status: 'success',
                impact: log.transaction_type === 'credit' ? `+${log.amount} Selos` : `-${log.amount} Selos`
            });
        });

        // 2. AUDITORIA DE PROVAS SOCIAIS
        const [proofLogs] = await db.query(`
            SELECT sp.id, sp.evaluated_at as timestamp, IFNULL(evaluator.name, sp.evaluator_name) as user_name, o.fantasy_name as ong_name, o.id as ong_id,
                   sp.status, pa.description as activity, u.name as target_user, sp.feedback_message, pa.seal_value
            FROM social_proofs sp
            LEFT JOIN users evaluator ON sp.evaluated_by = evaluator.id
            LEFT JOIN users u ON sp.user_id = u.id
            LEFT JOIN ongs o ON u.ong_id = o.id
            LEFT JOIN proof_activities pa ON sp.activity_id = pa.id 
            WHERE sp.status != 'pending'
            ORDER BY sp.evaluated_at DESC LIMIT 200
        `);

        proofLogs.forEach(log => {
            unifiedLogs.push({
                id: `proof-${log.id}`,
                timestamp: log.timestamp,
                user_name: log.user_name || 'Sistema',
                ong_name: log.ong_name || 'N/A',
                ong_id: log.ong_id,
                action: log.status === 'approved' ? 'Avaliação (Aprovada)' : 'Avaliação (Rejeitada)',
                details: `Beneficiário: ${log.target_user} | Atividade: ${log.activity} | Obs: ${log.feedback_message || '-'}`,
                type: 'audit',
                status: log.status === 'approved' ? 'success' : 'warning',
                impact: log.status === 'approved' ? `+${log.seal_value} Selos` : 'Nenhum'
            });
        });

        // 3. RESGATES DE SELOS (Trazendo os 1402 registros!)
        try {
            const [redemptionLogs] = await db.query(`
                SELECT r.id, r.created_at as timestamp, u.name as user_name, o.fantasy_name as ong_name, r.ong_id,
                       r.seal_value
                FROM redemptions r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN ongs o ON r.ong_id = o.id
                ORDER BY r.created_at DESC LIMIT 500
            `);

            redemptionLogs.forEach(log => {
                unifiedLogs.push({
                    id: `red-${log.id}`,
                    timestamp: log.timestamp,
                    user_name: log.user_name || 'Usuário Desconhecido',
                    ong_name: log.ong_name || 'Sistema',
                    ong_id: log.ong_id,
                    action: 'Resgate de Selos',
                    details: 'Resgate / Compra efetuada pelo beneficiário.',
                    type: 'redemption', // Esta flag faz o novo filtro do frontend puxar exatamente isto!
                    status: 'success',
                    impact: `-${log.seal_value || 0} Selos`
                });
            });
        } catch (err) {
            // Se as colunas tiverem nomes diferentes, o erro fica apenas no terminal e a tela não quebra
            console.error("Aviso: Falha ao carregar tabela redemptions:", err.message);
        }

        // 4. ERROS E AÇÕES DO SISTEMA
        const [sysLogs] = await db.query(`
            SELECT sl.id, sl.created_at as timestamp, sl.user_name, o.fantasy_name as ong_name, sl.ong_id,
                   sl.action, sl.details, sl.status
            FROM system_logs sl
            LEFT JOIN ongs o ON sl.ong_id = o.id
            ORDER BY sl.created_at DESC LIMIT 200
        `);

        sysLogs.forEach(log => {
            unifiedLogs.push({
                id: `sys-${log.id}`,
                timestamp: log.timestamp,
                user_name: log.user_name || 'Sistema / Anônimo',
                ong_name: log.ong_name || 'N/A',
                ong_id: log.ong_id,
                action: log.action,
                details: log.details,
                type: 'system',
                status: log.status, // pode ser 'error', 'success', 'warning' ou 'info'
                impact: '-'
            });
        });

        // Ordenar tudo por data (mais recente primeiro)
        unifiedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // LOG DE INFORMAÇÃO: Meta-Auditoria
        // Regista discretamente que o painel de auditoria foi consultado (e por quem)
        await exports.registerSystemLog(actorId, actorOng, actorName, "Consulta de Auditoria", "O histórico unificado global e de erros do sistema foi visualizado.", "info");

        res.status(200).json(unifiedLogs);
    } catch (error) {
        console.error("Erro ao gerar logs unificados:", error);
        
        // LOG DE ERRO CRÍTICO
        // Se houver falha de banco de dados na hora de compilar o histórico, avisa o sistema.
        await exports.registerSystemLog(actorId, actorOng, actorName, "Erro no Histórico", `Falha técnica ao tentar compilar os logs unificados: ${error.message}`, "error");

        res.status(500).json({ error: 'Erro ao compilar histórico do sistema.' });
    }
};