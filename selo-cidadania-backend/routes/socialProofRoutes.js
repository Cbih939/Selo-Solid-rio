// Arquivo: routes/socialProofRoutes.js (Versão Final com a rota de update)

const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload');

// --- ROTAS EXISTENTES ---
router.get('/activities', socialProofController.getActivities);
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);
router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);

// Rota para criar uma nova prova (usa o middleware de upload)
router.post('/', upload.array('proof_files', 5), socialProofController.createSocialProof);

// --- NOVA ROTA ADICIONADA ---
// Rota para editar uma prova existente (também usa o middleware de upload)
router.put('/:proofId', upload.array('proof_files', 5), socialProofController.updateProof);

module.exports = router;
