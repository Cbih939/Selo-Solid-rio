// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

// Função base que verifica o token e adiciona o user ao req
const protect = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Acesso negado. Token não fornecido ou mal formatado." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adiciona o payload do token (id, role, etc) ao request
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

// Middleware específico para Coordenadores de ONG
const ongCoordinator = (req, res, next) => {
    protect(req, res, () => {
        // Verifique se o nome do role no seu token JWT é exatamente 'coordenador_ong'
        if (req.user && req.user.role === 'coordenador_ong') {
            next();
        } else {
            res.status(403).json({ error: "Acesso negado. Requer privilégios de Coordenador." });
        }
    });
};

// Middleware específico para Admins
const admin = (req, res, next) => {
    protect(req, res, () => {
        // Verifique se o nome do role no seu token JWT é exatamente 'admin5'
        if (req.user && req.user.role === 'admin5') {
            next();
        } else {
            res.status(403).json({ error: "Acesso negado. Requer privilégios de Administrador." });
        }
    });
};

// Exporta um objeto com as duas funções
module.exports = { admin, ongCoordinator, protect };