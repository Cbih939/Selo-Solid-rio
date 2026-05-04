// Arquivo: selo-cidadania-backend/routes/logRoutes.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/unified', verifyToken, logController.getUnifiedLogs);

module.exports = router;