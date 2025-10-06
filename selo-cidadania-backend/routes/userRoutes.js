// Arquivo: selo-cidadania-backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin, ongCoordinator } = require('../middlewares/authMiddleware');

// ==================================================================
// ROTAS ORGANIZADAS POR FUNCIONALIDADE
// ==================================================================

// --- Rotas para Coordenadores de ONG ---

// CRIAR um novo beneficiário para a ONG do coordenador logado
router.post('/', protect, ongCoordinator, userController.createUser);

// OBTER detalhes de um beneficiário específico (para o modal de visualização)
router.get('/:id/details', protect, ongCoordinator, userController.getUserDetails);

// ATUALIZAR dados básicos de um beneficiário (nome, email)
router.put('/:id', protect, ongCoordinator, userController.updateUser);

// RESETAR a senha de um beneficiário
router.put('/:id/reset-password', protect, ongCoordinator, userController.resetPassword);

// DELETAR um beneficiário
router.delete('/:id', protect, ongCoordinator, userController.deleteUser);

// DEBITAR selos de um beneficiário
router.post('/:userId/debit-seals', protect, ongCoordinator, userController.debitSeals);


// --- Rotas para o Próprio Usuário (Beneficiário Logado) ---

// OBTER os próprios dependentes
router.get('/me/dependents', protect, userController.getDependents);

// ADICIONAR um dependente a si mesmo
router.post('/me/dependents', protect, userController.addDependent);

// ATUALIZAR um dos seus próprios dependentes
router.put('/me/dependents/:dependentId', protect, userController.updateDependent);

// DELETAR um dos seus próprios dependentes
router.delete('/me/dependents/:dependentId', protect, userController.deleteDependent);

// OBTER o próprio perfil
router.get('/me/profile', protect, userController.getProfile);

// ATUALIZAR o próprio perfil
router.put('/me/profile', protect, userController.updateProfile);


// --- Rotas de Admin (Exemplos, se necessário) ---
// ++ CORREÇÃO: A rota GET para '/' foi restaurada para uso geral ou de admin ++
router.get('/', protect, admin, userController.getAllUsers);


module.exports = router;
