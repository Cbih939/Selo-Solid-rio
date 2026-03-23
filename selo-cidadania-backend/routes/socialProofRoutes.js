const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const upload = require('../middlewares/upload');

// --- GESTÃO DE ATIVIDADES (Catálogo) ---

// Listar atividades (Filtro por ongId via query string: /activities?ongId=1)
router.get('/activities', socialProofController.getActivities);

// Criar nova atividade
router.post('/activities', upload.single('activity_image'), socialProofController.createActivity);

// Editar atividade
router.put('/activities/:id', upload.single('activity_image'), socialProofController.updateActivity);

// Deletar atividade
router.delete('/activities/:id', socialProofController.deleteActivity);


// --- GESTÃO DE ENVIOS (Provas dos Usuários) ---

// Listar provas por usuário e pendentes por ONG
router.get('/user/:userId', socialProofController.getUserProofs);
router.get('/pending/:ongId', socialProofController.getPendingProofs);

// Ações da ONG sobre as provas
router.put('/:proofId/approve', socialProofController.approveProof);
router.put('/:proofId/reject', socialProofController.rejectProof);
router.put('/:proofId/message', socialProofController.sendMessage);

// Enviar nova prova (Múltiplos arquivos)
router.post('/', upload.array('proof_files', 5), socialProofController.createSocialProof);

// Editar prova pendente
router.put('/:proofId', upload.array('proof_files', 5), socialProofController.updateProof);

module.exports = router;