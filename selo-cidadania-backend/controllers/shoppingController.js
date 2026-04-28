const db = require('../config/db');

// Listar todos os produtos
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM shopping_products ORDER BY created_at DESC');
        res.status(200).json(products);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
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
        res.status(500).json({ error: 'Erro ao buscar o produto.' });
    }
};

// Criar um novo produto
exports.createProduct = async (req, res) => {
    const { name, description, seal_cost, stock } = req.body;
    let image_url = null;

    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    if (!name || !seal_cost) {
        return res.status(400).json({ error: 'Nome e custo em selos são obrigatórios.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO shopping_products (name, description, seal_cost, stock, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, description, seal_cost, stock || 0, image_url]
        );
        res.status(201).json({ message: 'Produto criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        res.status(500).json({ error: 'Erro ao criar produto.' });
    }
};

// Atualizar um produto
exports.updateProduct = async (req, res) => {
    const { name, description, seal_cost, stock } = req.body;
    const productId = req.params.id;

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
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        res.status(200).json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
};

// Excluir um produto
exports.deleteProduct = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM shopping_products WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.status(200).json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        res.status(500).json({ error: 'Erro ao excluir produto.' });
    }
};