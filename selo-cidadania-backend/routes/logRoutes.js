// Arquivo: selo-cidadania-backend/routes/logRoutes.js

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// =========================================================================
// MIDDLEWARE DE AUTENTICAÇÃO (Importação Segura e Direta)
// =========================================================================
// Aqui assumimos que o seu authMiddleware exporta a função verifyToken.
// Se ele exportar com outro nome (ex: auth, checkAuth), basta alterar aqui.
const { verifyToken } = require('../middlewares/authMiddleware');

// =========================================================================
// ROTAS DE LOGS E AUDITORIA
// =========================================================================

// Rota protegida: Apenas utilizadores com token válido podem aceder ao histórico
router.get('/unified', verifyToken, logController.getUnifiedLogs);

module.exports = router;