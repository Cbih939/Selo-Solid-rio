// Arquivo: selo-cidadania-backend/routes/logRoutes.js

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// =========================================================================
// CORREÇÃO AQUI: Importação direta (sem as chaves { })
// =========================================================================
const verifyToken = require('../middlewares/authMiddleware');

// =========================================================================
// ROTAS DE LOGS E AUDITORIA
// =========================================================================

// Rota protegida: Apenas utilizadores com token válido podem aceder ao histórico
router.get('/unified', verifyToken, logController.getUnifiedLogs);

module.exports = router;