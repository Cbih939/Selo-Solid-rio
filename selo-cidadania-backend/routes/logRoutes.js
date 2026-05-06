// Arquivo: selo-cidadania-backend/routes/logRoutes.js

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// =========================================================================
// CORREÇÃO DEFINITIVA: Importando a função 'protect' do objeto exportado
// =========================================================================
const { protect } = require('../middlewares/authMiddleware');

// =========================================================================
// ROTAS DE LOGS E AUDITORIA
// =========================================================================

// Rota protegida: Agora usando a função 'protect' que existe no seu middleware
router.get('/unified', protect, logController.getUnifiedLogs);

module.exports = router;