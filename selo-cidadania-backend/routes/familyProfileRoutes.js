// Arquivo: routes/familyProfileRoutes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/familyProfileController');
const { protect } = require('../middlewares/authMiddleware');
const { privateUpload } = require('../middlewares/privateUpload');

// Erros do multer (tipo/tamanho) devolvidos como 400 em vez de 500
const singleFile = (req, res, next) => {
  privateUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo maior que 10MB.' : err.message });
    next();
  });
};

// Resumo para as listagens da equipe (deve vir antes de /:userId)
router.get('/summary', protect, controller.getSummary);

// Cadastro sociofamiliar (família, OSC e Admin - permissões validadas no controller)
router.get('/:userId', protect, controller.getFamilyProfile);
router.put('/:userId', protect, controller.saveFamilyProfile);

// Fotos da moradia e documentos
router.post('/:userId/files', protect, singleFile, controller.uploadFile);
router.get('/:userId/files/:fileId', protect, controller.downloadFile);
router.delete('/:userId/files/:fileId', protect, controller.deleteFile);

// Triagem socioeconômica (somente equipe autorizada)
router.get('/:userId/triages', protect, controller.listTriages);
router.post('/:userId/triages', protect, controller.createTriage);
router.put('/:userId/triages/:triageId', protect, controller.updateTriage);

module.exports = router;
