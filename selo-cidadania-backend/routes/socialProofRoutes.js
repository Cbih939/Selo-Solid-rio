// Arquivo: routes/socialProofRoutes.js (Versão Final com Rota de Edição)

const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
// Ajustei o nome do middleware para 'uploadMiddleware' para clareza, mas use o nome do seu arquivo.
const upload = require('../middlewares/uploadMiddleware'); 

// --- Rotas que NÃO precisam de upload de arquivos ---
router.get('/activities', socialProofController.getActivities);
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);
router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);

// --- Rotas que PRECISAM de upload de arquivos ---

// Rota POST para criar uma nova prova social
// O frontend deve enviar os arquivos no campo 'files'
router.post('/', upload.array('files', 5), socialProofController.createSocialProof);

// ### NOVA ROTA PARA ATUALIZAR UMA PROVA SOCIAL ###
// O frontend deve enviar os novos arquivos (opcionais) no campo 'files'
router.put('/:proofId', upload.array('files', 5), socialProofController.updateSocialProof);

module.exports = router;
