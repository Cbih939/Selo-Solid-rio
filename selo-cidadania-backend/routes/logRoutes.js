// Arquivo: selo-cidadania-backend/routes/logRoutes.js

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// Importa o middleware de autenticação
const authMiddleware = require('../middlewares/authMiddleware');

// Função de segurança genérica (fallback) para evitar que o servidor "crashe" com Undefined
let activeMiddleware = (req, res, next) => {
    console.warn("⚠️ AVISO: Função de autenticação não encontrada. Usando fallback temporário.");
    next();
};

// Detetive automático: Descobre qual é o nome real da função de autenticação no seu sistema
if (typeof authMiddleware === 'function') {
    activeMiddleware = authMiddleware;
} else if (authMiddleware !== null && typeof authMiddleware === 'object') {
    // Pega a primeira função exportada que encontrar dentro do arquivo
    const exportedFunctions = Object.values(authMiddleware).filter(val => typeof val === 'function');
    if (exportedFunctions.length > 0) {
        activeMiddleware = exportedFunctions[0];
    }
}

// Rota protegida utilizando o middleware detetado automaticamente
router.get('/unified', activeMiddleware, logController.getUnifiedLogs);

module.exports = router;