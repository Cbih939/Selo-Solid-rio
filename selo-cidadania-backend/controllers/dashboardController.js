const db = require('../config/db');

exports.getAdminStats = async (req, res) => {
    try {
        // 1. Total de ONGs cadastradas
        const [ongs] = await db.query('SELECT COUNT(*) as total FROM ongs');
        
        // 2. Total de Beneficiários (Contagem absoluta)
        const [users] = await db.query('SELECT COUNT(*) as total FROM users WHERE role_id = 3 OR role = "user"');
        
        // 3. Análise de cadastros no mês atual
        const [monthlyUsers] = await db.query(`
            SELECT COUNT(*) as total FROM users 
            WHERE (role_id = 3 OR role = "user") 
            AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);

        // 4. Selos em Circulação (CORREÇÃO: Soma real do saldo atual nas carteiras de todos os utilizadores)
        const [circulation] = await db.query('SELECT SUM(seal_balance) as total FROM users WHERE role_id = 3 OR role = "user"');
        
        // 5. Selos Resgatados (CORREÇÃO: Soma total do custo em selos de todos os resgates efetuados)
        const [redeemed] = await db.query('SELECT SUM(seals_redeemed) as total FROM redemptions');

        res.status(200).json({
            activeOngs: ongs[0].total || 0,
            totalUsers: users[0].total || 0,
            monthlyNewUsers: monthlyUsers[0].total || 0,
            distributedSeals: circulation[0].total || 0, // Agora reflete a circulação real!
            redeemedSeals: redeemed[0].total || 0
        });
    } catch (error) {
        console.error("Erro nas estatísticas do Dashboard:", error);
        res.status(500).json({ error: 'Erro ao carregar estatísticas globais.' });
    }
};