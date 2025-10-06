// Arquivo: selo-cidadania-backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
// Apagámos o require do userController aqui
const { admin, ongCoordinator } = require('../middlewares/authMiddleware');

// ==================================================================
// ROTAS ORGANIZADAS POR FUNCIONALIDADE
// ==================================================================

// --- Rotas para Coordenadores de ONG ---
router.post('/', ongCoordinator, (req, res, next) => require('../controllers/userController').createUser(req, res, next));
router.get('/:id/details', ongCoordinator, (req, res, next) => require('../controllers/userController').getUserDetails(req, res, next));
router.put('/:id', ongCoordinator, (req, res, next) => require('../controllers/userController').updateUser(req, res, next));
router.put('/:id/reset-password', ongCoordinator, (req, res, next) => require('../controllers/userController').resetPassword(req, res, next));
router.delete('/:id', ongCoordinator, (req, res, next) => require('../controllers/userController').deleteUser(req, res, next));
router.post('/:userId/debit-seals', ongCoordinator, (req, res, next) => require('../controllers/userController').debitSeals(req, res, next));

// --- Rotas para o Próprio Usuário (Beneficiário Logado) ---
router.get('/me/dependents', (req, res, next) => require('../controllers/userController').getMyDependents(req, res, next));
router.post('/me/dependents', (req, res, next) => require('../controllers/userController').addMyDependent(req, res, next));
router.put('/me/dependents/:dependentId', (req, res, next) => require('../controllers/userController').updateMyDependent(req, res, next));
router.delete('/me/dependents/:dependentId', (req, res, next) => require('../controllers/userController').deleteMyDependent(req, res, next));
router.get('/me/profile', (req, res, next) => require('../controllers/userController').getProfile(req, res, next));
router.put('/me/profile', (req, res, next) => require('../controllers/userController').updateProfile(req, res, next));

// --- Rotas de Admin ---
router.get('/', admin, (req, res, next) => require('../controllers/userController').getAllUsers(req, res, next));

module.exports = router;