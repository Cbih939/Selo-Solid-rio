// routes/ongRoutes.js

const express = require('express');
const router = express.Router();
const ongController = require('../controllers/ongController');
const upload = require('../middlewares/upload'); // Seu middleware Multer

// Rota GET para listar todas as ONGs
// A função no controller é 'getAllOngs'
router.get('/', ongController.getAllOngs);

// Rota GET para buscar uma ONG por ID
// A função no controller é 'getOngById'
// Este era o ponto mais provável do erro.
router.get('/:id', ongController.getOngById);

// Rota POST para criar uma nova ONG com upload de arquivos
router.post('/', 
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'ata_file', maxCount: 1 },
    { name: 'statute_file', maxCount: 1 }
  ]), 
  ongController.createOng
);

// Rota PUT para atualizar uma ONG com upload de arquivos
router.put('/:id', 
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'ata_file', maxCount: 1 },
    { name: 'statute_file', maxCount: 1 }
  ]), 
  ongController.updateOng
);

// Rota DELETE para excluir uma ONG
router.delete('/:id', ongController.deleteOng);

// Rota GET para listar os usuários de uma ONG
router.get('/:ongId/users', ongController.getOngUsers);

// Rota POST para debitar saldo de um usuário da ONG
router.post('/debit-balance', ongController.debitUserBalance); 

module.exports = router;
