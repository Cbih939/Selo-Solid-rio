const db = require('../config/db');

exports.getAdminStats = async (req, res) => {
    try {
        // 1. Total de ONGs ativas
        const [ongs] = await db.query('SELECT COUNT(*) as total FROM ongs');
        
        // 2. Total de Beneficiários Válidos (Soma exata das ONGs)
        const [users] = await db.query(`
            SELECT COUNT(*) as total 
            FROM users 
            WHERE (role_id = 3 OR role = 'user') 
            AND ong_id IS NOT NULL 
            AND ong_id IN (SELECT id FROM ongs)
        `);
        
        // 3. Cadastros no mês atual
        const [monthlyUsers] = await db.query(`
            SELECT COUNT(*) as total 
            FROM users 
            WHERE (role_id = 3 OR role = 'user') 
            AND ong_id IS NOT NULL
            AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);

        // 4. Selos em Circulação (Saldo atual das carteiras de todos os beneficiários válidos)
        const [circulation] = await db.query(`
            SELECT SUM(seal_balance) as total 
            FROM users 
            WHERE (role_id = 3 OR role = 'user')
            AND ong_id IS NOT NULL
        `);
        
        // 5. Selos Resgatados (Soma total correta dos resgates efetuados)
        const [redeemed] = await db.query(`
            SELECT IFNULL(SUM(IF(r.seals_redeemed > 0, r.seals_redeemed, p.custo_selos)), 0) as total 
            FROM redemptions r
            LEFT JOIN prizes p ON r.prize_id = p.id
        `);

        // =========================================================================
        // CORREÇÃO AQUI: Enviando a resposta formatada de volta para o frontend
        // =========================================================================
        res.status(200).json({
            ongs: ongs[0].total || 0,
            users: users[0].total || 0,
            monthlyUsers: monthlyUsers[0].total || 0,
            circulation: circulation[0].total || 0,
            redeemed: redeemed[0].total || 0
        });

    } catch (error) {
        console.error("Erro nas estatísticas do Dashboard:", error);
        res.status(500).json({ error: 'Erro ao carregar estatísticas globais.' });
    }
};