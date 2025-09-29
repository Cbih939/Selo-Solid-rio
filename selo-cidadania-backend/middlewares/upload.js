const multer = require('multer');
const path = require('path');

// Configuração do armazenamento dos arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads')); // pasta 'uploads' na raiz do backend
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // adiciona timestamp ao nome do arquivo
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem (jpeg, png, gif) são permitidos!'), false);
  }
};

// Cria o middleware do multer
const upload = multer({ storage, fileFilter });

module.exports = upload;
