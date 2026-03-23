const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload');

// --- ADMIN / SUPER ADMIN ---

// Rota para buscar todas as OSCs (usar no Select do formulário)
router.get('/ongs-list', socialProofController.getAllOngs);

// Listar atividades de uma OSC específica (para montar os blocos)
router.get('/activities/ong/:ongId', socialProofController.getActivitiesByOng);

// CRUD de Atividades
router.post('/activities', upload.single('activity_image'), socialProofController.createActivity);
router.put('/activities/:id', upload.single('activity_image'), socialProofController.updateActivity);
router.delete('/activities/:id', socialProofController.deleteActivity);


// --- BENEFICIÁRIOS E PROVAS ---

router.post('/', upload.array('proof_files', 5), socialProofController.createSocialProof);
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);
router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);

module.exports = router;