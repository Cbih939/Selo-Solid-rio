// Arquivo: selo-cidadania-backend/controllers/logController.js

const db = require('../config/db');

// =========================================================================
// FUNÇÃO UTILITÁRIA DE AUDITORIA (O Coração do Sistema de Logs)
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

        // 3. RESGATES DE SELOS (CORRIGIDO COM AS COLUNAS REAIS)
        try {
            const [redemptionLogs] = await db.query(`
                SELECT r.id, r.redemption_date as timestamp, u.name as user_name, o.fantasy_name as ong_name, u.ong_id,
                       r.prize_name, r.seals_redeemed, r.status
                FROM redemptions r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN ongs o ON u.ong_id = o.id
                ORDER BY r.redemption_date DESC LIMIT 500
            `);

            redemptionLogs.forEach(log => {
                unifiedLogs.push({
                    id: `red-${log.id}`,
                    timestamp: log.timestamp,
                    user_name: log.user_name || 'Usuário Desconhecido',
                    ong_name: log.ong_name || 'Sistema',
                    ong_id: log.ong_id,
                    action: 'Resgate de Selos',
                    details: log.prize_name ? `Item resgatado: ${log.prize_name}` : 'Resgate efetuado pelo beneficiário.',
                    type: 'redemption',
                    status: log.status === 'completed' ? 'success' : 'warning',
                    impact: `-${log.seals_redeemed || 0} Selos`
                });
            });
        } catch (err) {
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
                status: log.status,
                impact: '-'
            });
        });

        // Ordenar tudo por data (mais recente primeiro)
        unifiedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        await exports.registerSystemLog(actorId, actorOng, actorName, "Consulta de Auditoria", "O histórico unificado global e de erros do sistema foi visualizado.", "info");

        res.status(200).json(unifiedLogs);
    } catch (error) {
        console.error("Erro ao gerar logs unificados:", error);
        await exports.registerSystemLog(actorId, actorOng, actorName, "Erro no Histórico", `Falha técnica ao tentar compilar os logs unificados: ${error.message}`, "error");
        res.status(500).json({ error: 'Erro ao compilar histórico do sistema.' });
    }
};