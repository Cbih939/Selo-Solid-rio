// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define o diretório de uploads de forma mais segura dentro de uma pasta 'public'
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

// Garante que o diretório de uploads exista. Se não, ele o cria.
// Isso evita erros caso a pasta seja deletada ou não exista no deploy.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Salva os arquivos no diretório definido
  },
  // Define um nome de arquivo único para evitar conflitos e sobreposições
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// --- CORREÇÃO PRINCIPAL ---
// Filtro de arquivos corrigido para aceitar imagens E PDFs.
const fileFilter = (req, file, cb) => {
  // Lista de tipos de arquivo permitidos
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Aceita o arquivo
  } else {
    // Rejeita o arquivo com uma mensagem de erro clara
    cb(new Error('Tipo de arquivo não suportado! Apenas imagens e PDFs são permitidos.'), false);
  }
};

// Cria a instância do Multer com as configurações aprimoradas
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // Limite de 10MB por arquivo
  },
  fileFilter: fileFilter
});

module.exports = upload;
