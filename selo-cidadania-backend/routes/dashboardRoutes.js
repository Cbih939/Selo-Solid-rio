const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { admin } = require('../middlewares/authMiddleware');

// Rota protegida apenas para admins (Nível 1 e Nível 5)
router.get('/stats', admin, dashboardController.getAdminStats);

module.exports = router;