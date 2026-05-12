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
    const isSuperAdmin = req.user?.role === 'admin5';

    // TRAVA DE SEGURANÇA: Se não for Super Admin, trava a consulta apenas para a ONG do usuário
    const ongFilter = (!isSuperAdmin && actorOng) ? ` AND u.ong_id = ${db.escape(actorOng)} ` : '';
    const sysOngFilter = (!isSuperAdmin && actorOng) ? ` AND sl.ong_id = ${db.escape(actorOng)} ` : '';

    try {
        const unifiedLogs = [];

        // 1. DADOS FINANCEIROS REAIS
        const [financeLogs] = await db.query(`
            SELECT bh.*, bh.created_at as timestamp, u.name as target_user, o.fantasy_name as ong_name, u.ong_id
            FROM balance_history bh
            LEFT JOIN users u ON bh.user_id = u.id
            LEFT JOIN ongs o ON u.ong_id = o.id
            WHERE 1=1 ${ongFilter}
            ORDER BY bh.created_at DESC LIMIT 500
        `);

        financeLogs.forEach(log => {
            unifiedLogs.push({
                id: `fin-${log.id}`,
                timestamp: log.timestamp,
                author_name: log.admin_name || 'Administrador / Coordenador', 
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
            WHERE sp.status != 'pending' ${ongFilter}
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
                WHERE 1=1 ${ongFilter}
                ORDER BY r.redemption_date DESC LIMIT 500
            `);

            redemptionLogs.forEach(log => {
                unifiedLogs.push({
                    id: `red-${log.id}`,
                    timestamp: log.timestamp,
                    author_name: log.admin_name || (log.prize_name ? 'Beneficiário (Automático)' : 'Administrador / Coordenador'),
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
            WHERE 1=1 ${sysOngFilter}
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

        // 5. ESTATÍSTICAS PENDENTES DA OSC
        let pending_proofs = 0;
        let pending_seals = 0;
        try {
            const [pendingData] = await db.query(`
                SELECT COUNT(sp.id) as pending_count, SUM(pa.seal_value) as pending_seals
                FROM social_proofs sp
                LEFT JOIN proof_activities pa ON sp.activity_id = pa.id
                LEFT JOIN users u ON sp.user_id = u.id
                WHERE sp.status = 'pending' ${ongFilter}
            `);

            pending_proofs = pendingData[0]?.pending_count || 0;
            pending_seals = pendingData[0]?.pending_seals || 0;
            
        } catch (e) {
            console.error("Erro ao buscar pendentes:", e.message);
        }

        await exports.registerSystemLog(actorId, actorOng, actorName, "Consulta de Auditoria", "Visualizou o histórico de auditoria.", "info");

        // Se for admin5 enviamos a estrutura anterior, se não, enviamos a simples para facilitar a nova página
        if (isSuperAdmin) {
            // Lógica antiga mantida para o admin5 funcionar perfeitamente
             let pendingStats = { global: { proofs: pending_proofs, seals: pending_seals } };
             res.status(200).json({ logs: unifiedLogs, summary: pendingStats });
        } else {
             // Estrutura direta para a página da OSC
             res.status(200).json({ 
                 logs: unifiedLogs, 
                 summary: { pending_proofs, pending_seals } 
             });
        }
        
    } catch (error) {
        res.status(500).json({ error: 'Erro ao compilar histórico.' });
    }
};