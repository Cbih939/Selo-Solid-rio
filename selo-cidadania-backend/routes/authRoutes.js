const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para login (POST /api/auth/login)
router.post('/login', authController.login);

// Nova Rota para cadastro via link de convite (POST /api/auth/register)
router.post('/register', authController.registerViaInvite);

module.exports = router;