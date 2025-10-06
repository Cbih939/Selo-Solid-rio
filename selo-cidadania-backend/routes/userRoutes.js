// Arquivo: selo-cidadania-backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {admin, ongCoordinator } = require('../middlewares/authMiddleware');

// ==================================================================
// ROTAS ORGANIZADAS POR FUNCIONALIDADE
// ==================================================================

// --- Rotas para Coordenadores de ONG ---
router.post('/', ongCoordinator, userController.createUser);
router.get('/:id/details', ongCoordinator, userController.getUserDetails);
router.put('/:id', ongCoordinator, userController.updateUser);
router.put('/:id/reset-password', ongCoordinator, userController.resetPassword);
router.delete('/:id', ongCoordinator, userController.deleteUser);
router.post('/:userId/debit-seals', ongCoordinator, userController.debitSeals);

// --- Rotas para o Próprio Usuário (Beneficiário Logado) ---
// ++ CORREÇÃO: Nomes das funções sincronizados com o controller ++
router.get('/me/dependents', userController.getMyDependents);
router.post('/me/dependents', userController.addMyDependent);
router.put('/me/dependents/:dependentId', userController.updateMyDependent);
router.delete('/me/dependents/:dependentId', userController.deleteMyDependent);
router.get('/me/profile', userController.getProfile);
router.put('/me/profile', userController.updateProfile);

// --- Rotas de Admin ---
// ++ CORREÇÃO: A rota GET para '/' foi movida para o final para não conflitar com /:id/details ou /me/profile ++
router.get('/', admin, userController.getAllUsers);

module.exports = router;
