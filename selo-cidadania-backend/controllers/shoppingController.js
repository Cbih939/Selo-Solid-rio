const db = require('../config/db');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

// Listar todos os produtos
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM shopping_products ORDER BY created_at DESC');
        res.status(200).json(products);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        
        // LOG DE ERRO
        const actorName = req.user?.name || 'Sistema / Anônimo';
        await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao tentar listar os produtos do shopping: ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao carregar produtos.' });
    }
};

// Obter um produto por ID
exports.getProductById = async (req, res) => {
    try {
        const [product] = await db.query('SELECT * FROM shopping_products WHERE id = ?', [req.params.id]);
        if (product.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.status(200).json(product[0]);
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        
        // LOG DE ERRO
        const actorName = req.user?.name || 'Sistema / Anônimo';
        await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao tentar buscar o produto ID ${req.params.id}: ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao buscar o produto.' });
    }
};

// Criar um novo produto
exports.createProduct = async (req, res) => {
    const { name, description, seal_cost, stock } = req.body;
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    let image_url = null;

    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    if (!name || !seal_cost) {
        await registerSystemLog(actorId, actorOng, actorName, "Aviso de Validação", "Tentativa de cadastrar um produto no shopping sem nome ou custo em selos.", "warning");
        return res.status(400).json({ error: 'Nome e custo em selos são obrigatórios.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO shopping_products (name, description, seal_cost, stock, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, description, seal_cost, stock || 0, image_url]
        );
        
        // LOG DE SUCESSO
        await registerSystemLog(actorId, actorOng, actorName, "Novo Produto no Shopping", `O produto '${name}' foi adicionado ao catálogo com o custo de ${seal_cost} selos.`, "success");
        
        res.status(201).json({ message: 'Produto criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        
        // LOG DE ERRO CRÍTICO
        await registerSystemLog(actorId, actorOng, actorName, "Erro ao Criar Produto", `Falha técnica ao adicionar produto '${name}': ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao criar produto.' });
    }
};

// Atualizar um produto
exports.updateProduct = async (req, res) => {
    const { name, description, seal_cost, stock } = req.body;
    const productId = req.params.id;
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    try {
        let query = 'UPDATE shopping_products SET name = ?, description = ?, seal_cost = ?, stock = ?';
        let params = [name, description, seal_cost, stock];

        if (req.file) {
            query += ', image_url = ?';
            params.push(`/uploads/${req.file.filename}`);
        }

        query += ' WHERE id = ?';
        params.push(productId);

        const [result] = await db.query(query, params);
        
        if (result.affectedRows === 0) {
            await registerSystemLog(actorId, actorOng, actorName, "Edição Inválida", `Tentativa de atualizar o produto ID ${productId} que não existe.`, "warning");
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        // LOG DE SUCESSO
        await registerSystemLog(actorId, actorOng, actorName, "Produto Atualizado", `Os detalhes e o preço do produto ID ${productId} foram atualizados no shopping.`, "success");

        res.status(200).json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        
        // LOG DE ERRO CRÍTICO
        await registerSystemLog(actorId, actorOng, actorName, "Erro ao Atualizar Produto", `Falha técnica ao modificar produto ID ${productId}: ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
};

// Excluir um produto
exports.deleteProduct = async (req, res) => {
    const productId = req.params.id;
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    try {
        const [result] = await db.query('DELETE FROM shopping_products WHERE id = ?', [productId]);
        
        if (result.affectedRows === 0) {
            await registerSystemLog(actorId, actorOng, actorName, "Exclusão Inválida", `Tentativa de excluir o produto ID ${productId} que não existe no catálogo.`, "warning");
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        
        // LOG DE SUCESSO
        await registerSystemLog(actorId, actorOng, actorName, "Produto Excluído", `O produto ID ${productId} foi removido permanentemente do catálogo do shopping.`, "success");
        
        res.status(200).json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        
        // Proteção contra quebra de histórico (Se o produto já foi comprado/resgatado)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            await registerSystemLog(actorId, actorOng, actorName, "Exclusão Bloqueada", `Tentativa de excluir produto ID ${productId} bloqueada porque existem compras associadas a ele.`, "warning");
            return res.status(400).json({ error: 'Não é possível excluir este produto pois ele já possui histórico de compras.' });
        }
        
        // LOG DE ERRO CRÍTICO
        await registerSystemLog(actorId, actorOng, actorName, "Erro ao Excluir Produto", `Falha técnica ao tentar apagar o produto ID ${productId}: ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao excluir produto.' });
    }
};