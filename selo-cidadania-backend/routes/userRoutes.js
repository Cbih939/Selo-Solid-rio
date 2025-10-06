// Arquivo: selo-cidadania-backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin, ongCoordinator } = require('../middlewares/authMiddleware');

// ==================================================================
// ROTAS ORGANIZADAS POR FUNCIONALIDADE
// ==================================================================

// --- Rotas para Coordenadores de ONG ---
router.post('/', protect, ongCoordinator, userController.createUser);
router.get('/:id/details', protect, ongCoordinator, userController.getUserDetails);
router.put('/:id', protect, ongCoordinator, userController.updateUser);
router.put('/:id/reset-password', protect, ongCoordinator, userController.resetPassword);
router.delete('/:id', protect, ongCoordinator, userController.deleteUser);
router.post('/:userId/debit-seals', protect, ongCoordinator, userController.debitSeals);

// --- Rotas para o Próprio Usuário (Beneficiário Logado) ---
router.get('/me/dependents', protect, userController.getMyDependents);
// ++ CORREÇÃO: A rota agora chama a função correta 'addMyDependent' ++
router.post('/me/dependents', protect, userController.addMyDependent);
router.put('/me/dependents/:dependentId', protect, userController.updateMyDependent);
router.delete('/me/dependents/:dependentId', protect, userController.deleteMyDependent);
router.get('/me/profile', protect, userController.getProfile);
router.put('/me/profile', protect, userController.updateProfile);

// --- Rotas de Admin ---
router.get('/', protect, admin, userController.getAllUsers);

module.exports = router;
