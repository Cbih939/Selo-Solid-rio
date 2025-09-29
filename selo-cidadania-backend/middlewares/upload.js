// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define o diretório de uploads de forma segura
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

// Garante que o diretório de uploads exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtro de arquivos para aceitar imagens E PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado! Apenas imagens e PDFs são permitidos.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
  fileFilter: fileFilter
});

module.exports = upload;
