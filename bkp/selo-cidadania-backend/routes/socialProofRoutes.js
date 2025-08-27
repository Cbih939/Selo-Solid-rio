const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload'); // Importa o middleware

// Rotas GET e PUT (não precisam de upload)
router.get('/activities', socialProofController.getActivities);
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);
router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);

// Rota POST para criar uma nova prova social, agora com o middleware de upload
// O nome 'proof_file' deve corresponder ao que o frontend envia no FormData
router.post('/', upload.single('proof_file'), socialProofController.createSocialProof);

module.exports = router;