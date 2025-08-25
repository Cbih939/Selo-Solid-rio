const multer = require('multer');
const path = require('path');

// Configuração do armazenamento dos ficheiros
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Garante que os ficheiros são guardados na pasta 'uploads'
  },
  filename: function (req, file, cb) {
    // Cria um nome de ficheiro único para evitar conflitos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(new Error('Apenas ficheiros de imagem (jpeg, png, gif) são permitidos!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10 // Limite de 10MB por ficheiro
  }
});

module.exports = upload;