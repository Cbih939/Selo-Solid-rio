const multer = require('multer');
const path = require('path');

// Configura como os ficheiros são guardados
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Pasta onde os ficheiros serão guardados
  },
  filename: function (req, file, cb) {
    // Cria um nome de ficheiro único para evitar sobreposições
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para garantir que apenas imagens são enviadas
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas ficheiros de imagem são permitidos!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 } // Limite de 10MB
});

module.exports = upload;