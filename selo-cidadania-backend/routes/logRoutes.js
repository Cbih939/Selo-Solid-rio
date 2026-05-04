// Arquivo: selo-cidadania-backend/routes/logRoutes.js

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// Importação inteligente do middleware de autenticação
const authMiddleware = require('../middlewares/authMiddleware');
let verifyToken;

// Verifica como a sua aplicação exporta o middleware e adapta automaticamente
if (typeof authMiddleware === 'function') {
    verifyToken = authMiddleware; // Se foi exportado diretamente (module.exports = verifyToken)
} else if (authMiddleware && typeof authMiddleware.verifyToken === 'function') {
    verifyToken = authMiddleware.verifyToken; // Se foi exportado como objeto
} else {
    console.error("🚨 ERRO CRÍTICO: verifyToken não encontrado no authMiddleware.js");
}

// Rota protegida
router.get('/unified', verifyToken, logController.getUnifiedLogs);

module.exports = router;