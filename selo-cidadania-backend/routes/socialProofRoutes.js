// Arquivo: routes/socialProofRoutes.js (Versão Final com a Importação Corrigida)

const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
// ### CORREÇÃO DEFINITIVA: Voltando a usar o nome original do seu middleware ###
const upload = require('../middlewares/upload'); 

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

// Rota PUT para atualizar uma prova social
// O frontend deve enviar os novos arquivos (opcionais) no campo 'files'
router.put('/:proofId', upload.array('proof_files', 5), socialProofController.updateProof);

module.exports = router;
