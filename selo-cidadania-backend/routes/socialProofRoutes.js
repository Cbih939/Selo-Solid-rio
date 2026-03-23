// Arquivo: routes/socialProofRoutes.js (ATUALIZADO)

const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload');

// --- GESTÃO DE ATIVIDADES (O Catálogo de Provas) ---

// Listar todas as atividades disponíveis
router.get('/activities', socialProofController.getActivities);

// Criar nova atividade (Com imagem de auxílio/exemplo)
// Usamos o middleware de upload para a 'image_url' da atividade
router.post('/activities', upload.single('activity_image'), socialProofController.createActivity);

// Editar uma atividade existente
router.put('/activities/:id', upload.single('activity_image'), socialProofController.updateActivity);

// Deletar uma atividade
router.delete('/activities/:id', socialProofController.deleteActivity);


// --- GESTÃO DE ENVIOS (Provas enviadas pelos usuários) ---

router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);
router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);

// Rota para o beneficiário enviar a prova
router.post('/', upload.array('proof_files', 5), socialProofController.createSocialProof);

// Rota para editar uma prova enviada
router.put('/:proofId', upload.array('proof_files', 5), socialProofController.updateProof);

module.exports = router;