// Arquivo: selo-cidadania-backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Assumindo que seu middleware de autenticação se chama 'authMiddleware'
// Se o nome for diferente (ex: protect), ajuste aqui.
const { protect, admin, ongCoordinator } = require('../middlewares/authMiddleware');

// ==================================================================
// ROTAS PÚBLICAS (ou com autenticação própria, como o login)
// ==================================================================
// (Nenhuma rota pública neste arquivo, movido para authRoutes.js, o que é uma boa prática)


// ==================================================================
// ROTAS PROTEGIDAS (Acessíveis por diferentes tipos de usuários logados)
// ==================================================================

// --- Rotas para Coordenadores de ONG ---

// LISTAR todos os beneficiários de uma ONG (usado na página ListOngUsersPage)
// Esta rota foi movida para ongRoutes.js para melhor organização, mas pode ficar aqui se preferir.
// Exemplo: router.get('/', protect, ongCoordinator, userController.getAllUsersFromOng);

// CRIAR um novo beneficiário para a ONG do coordenador logado
router.post('/', protect, ongCoordinator, userController.createUser);

// ++ INÍCIO DA CORREÇÃO: Rota para buscar detalhes de um usuário específico ++
// Esta é a rota que estava faltando e causando o erro 404.
// Ela deve vir ANTES de rotas mais genéricas como /:id para ter prioridade.
router.get('/:id/details', protect, ongCoordinator, userController.getUserDetails);
// ++ FIM DA CORREÇÃO ++

// ATUALIZAR dados básicos de um beneficiário
router.put('/:id', protect, ongCoordinator, userController.updateUser);

// RESETAR a senha de um beneficiário
router.put('/:id/reset-password', protect, ongCoordinator, userController.resetPassword);

// DELETAR um beneficiário
router.delete('/:id', protect, ongCoordinator, userController.deleteUser);

// DEBITAR selos de um beneficiário
router.post('/:userId/debit-seals', protect, ongCoordinator, userController.debitSeals);


// --- Rotas para o Próprio Usuário (Beneficiário) ---

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


// --- Rotas de Admin (se necessário) ---
// Ex: router.get('/all', protect, admin, userController.getAllUsers);


module.exports = router;
