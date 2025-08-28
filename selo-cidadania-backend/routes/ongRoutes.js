// routes/ongRoutes.js
const express = require('express');
const router = express.Router();
const ongController = require('../controllers/ongController');
const upload = require('../middlewares/upload'); // Importa o middleware Multer

// Rota GET para listar todas as ONGs (não precisa de upload)
router.get('/', ongController.getAllOngs);

// Rota GET para buscar uma ONG por ID
router.get('/:id', ongController.getOngById);

// Rota POST para criar uma nova ONG
// O middleware 'upload.fields' é aplicado AQUI. Ele processa os arquivos ANTES de chegar no controller.
router.post('/', 
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'ata_file', maxCount: 1 },
    { name: 'statute_file', maxCount: 1 }
  ]), 
  ongController.createOng
);

// Outras rotas...
router.put('/:id', ongController.updateOng);
router.delete('/:id', ongController.deleteOng);
router.get('/:ongId/users', ongController.getOngUsers);
router.post('/debit-balance', ongController.debitUserBalance); // Supondo que exista um authMiddleware aqui

module.exports = router;
