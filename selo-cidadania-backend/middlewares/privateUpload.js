// middlewares/privateUpload.js
// Upload de documentos e fotos do cadastro sociofamiliar.
// Os arquivos ficam FORA da pasta pública: só são servidos por rota autenticada.

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PRIVATE_DIR = path.join(__dirname, '..', 'private_uploads', 'family');

if (!fs.existsSync(PRIVATE_DIR)) {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRIVATE_DIR),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de arquivo não suportado! Envie imagens (JPG, PNG, WEBP) ou PDF.'), false);
};

const privateUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
  fileFilter
});

module.exports = { privateUpload, PRIVATE_DIR };
