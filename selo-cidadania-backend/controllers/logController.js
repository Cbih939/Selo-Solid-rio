// Arquivo: selo-cidadania-backend/controllers/logController.js

const db = require('../config/db');

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

exports.getUnifiedLogs = async (req, res) => {
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    try {
        const unifiedLogs = [];

        // 1. DADOS FINANCEIROS REAIS
        const [financeLogs] = await db.query(`
            SELECT bh.*, bh.created_at as timestamp, u.name as target_user, o.fantasy_name as ong_name, u.ong_id
            FROM balance_history bh
            LEFT JOIN users u ON bh.user_id = u.id
            LEFT JOIN ongs o ON u.ong_id = o.id
            ORDER BY bh.created_at DESC LIMIT 500
        `);

        financeLogs.forEach(log => {
            unifiedLogs.push({
                id: `fin-${log.id}`,
                timestamp: log.timestamp,
                author_name: log.admin_name || 'Administrador (Anterior)', // Lê a nova coluna
                target_user: log.target_user || 'Usuário Removido',
                ong_name: log.ong_name || 'N/A',
                ong_id: log.ong_id,
                action: log.transaction_type === 'credit' ? 'Crédito Manual de Selos' : 'Débito Manual de Selos',
                details: log.reason || 'Movimentação na carteira',
                type: 'financial',
                status: 'success',
                impact: log.transaction_type === 'credit' ? `+${log.amount}` : `-${log.amount}`
            });
        });

        // 2. AUDITORIA DE PROVAS SOCIAIS
        const [proofLogs] = await db.query(`
            SELECT sp.id, sp.evaluated_at as timestamp, IFNULL(evaluator.name, sp.evaluator_name) as author_name, o.fantasy_name as ong_name, u.ong_id,
                   sp.status, pa.description as activity, u.name as target_user, sp.feedback_message, pa.seal_value
            FROM social_proofs sp
            LEFT JOIN users evaluator ON sp.evaluated_by = evaluator.id
            LEFT JOIN users u ON sp.user_id = u.id
            LEFT JOIN ongs o ON u.ong_id = o.id
            LEFT JOIN proof_activities pa ON sp.activity_id = pa.id 
            WHERE sp.status != 'pending'
            ORDER BY sp.evaluated_at DESC LIMIT 500
        `);

        proofLogs.forEach(log => {
            unifiedLogs.push({
                id: `proof-${log.id}`,
                timestamp: log.timestamp,
                author_name: log.author_name || 'Administrador Desconhecido',
                target_user: log.target_user || 'Usuário Desconhecido',
                ong_name: log.ong_name || 'N/A',
                ong_id: log.ong_id,
                action: log.status === 'approved' ? 'Aprovação de Prova' : 'Rejeição de Prova',
                details: `Atividade: ${log.activity} | Obs: ${log.feedback_message || '-'}`,
                type: 'audit',
                status: log.status === 'approved' ? 'success' : 'warning',
                impact: log.status === 'approved' ? `+${log.seal_value}` : '0'
            });
        });

        // 3. RESGATES DE SELOS
        try {
            const [redemptionLogs] = await db.query(`
                SELECT r.*, r.redemption_date as timestamp, u.name as target_user, o.fantasy_name as ong_name, u.ong_id
                FROM redemptions r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN ongs o ON u.ong_id = o.id
                ORDER BY r.redemption_date DESC LIMIT 500
            `);

            redemptionLogs.forEach(log => {
                unifiedLogs.push({
                    id: `red-${log.id}`,
                    timestamp: log.timestamp,
                    author_name: log.admin_name || (log.prize_name ? 'Beneficiário (Automático)' : 'Administrador (Anterior)'), // Lê a nova coluna
                    target_user: log.target_user || 'Desconhecido',
                    ong_name: log.ong_name || 'Sistema',
                    ong_id: log.ong_id,
                    action: 'Resgate de Selos',
                    details: log.prize_name ? `Item: ${log.prize_name}` : 'Resgate efetuado.',
                    type: 'redemption',
                    status: log.status === 'completed' ? 'success' : 'warning',
                    impact: `-${log.seals_redeemed || 0}`
                });
            });
        } catch (err) {
            console.error("Aviso: Falha ao carregar tabela redemptions:", err.message);
        }

        // 4. ERROS E AÇÕES DO SISTEMA
        const [sysLogs] = await db.query(`
            SELECT sl.id, sl.created_at as timestamp, sl.user_name as author_name, o.fantasy_name as ong_name, sl.ong_id,
                   sl.action, sl.details, sl.status
            FROM system_logs sl
            LEFT JOIN ongs o ON sl.ong_id = o.id
            ORDER BY sl.created_at DESC LIMIT 200
        `);

        sysLogs.forEach(log => {
            unifiedLogs.push({
                id: `sys-${log.id}`,
                timestamp: log.timestamp,
                author_name: log.author_name || 'Sistema',
                target_user: '-',
                ong_name: log.ong_name || 'N/A',
                ong_id: log.ong_id,
                action: log.action,
                details: log.details,
                type: 'system',
                status: log.status,
                impact: '0'
            });
        });

        unifiedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // 5. ESTATÍSTICAS PENDENTES (AGORA SEPARADAS POR ONG!)
        let pendingStats = { global: { proofs: 0, seals: 0 } };
        try {
            const [pendingData] = await db.query(`
                SELECT u.ong_id, COUNT(sp.id) as pending_count, SUM(pa.seal_value) as pending_seals
                FROM social_proofs sp
                LEFT JOIN proof_activities pa ON sp.activity_id = pa.id
                LEFT JOIN users u ON sp.user_id = u.id
                WHERE sp.status = 'pending'
                GROUP BY u.ong_id
            `);

            pendingData.forEach(row => {
                let count = parseInt(row.pending_count) || 0;
                let seals = parseInt(row.pending_seals) || 0;
                let ong = row.ong_id || 'unassigned';

                pendingStats.global.proofs += count;
                pendingStats.global.seals += seals;
                
                if (ong !== 'unassigned') {
                    pendingStats[ong] = { proofs: count, seals: seals };
                }
            });
        } catch (e) {
            console.error("Erro ao buscar pendentes:", e.message);
        }

        await exports.registerSystemLog(actorId, actorOng, actorName, "Consulta de Auditoria", "Visualizou o histórico unificado global.", "info");

        res.status(200).json({ logs: unifiedLogs, summary: pendingStats });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao compilar histórico.' });
    }
};