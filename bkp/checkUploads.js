// checkUploads.js
const fs = require('fs');
const path = require('path');

// Caminho da pasta de uploads
const uploadDir = path.join(__dirname, 'upload');

// Extensões de imagens que queremos verificar
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

fs.readdir(uploadDir, (err, files) => {
  if (err) {
    return console.error('Erro ao ler a pasta de uploads:', err);
  }

  // Filtra apenas arquivos com extensões de imagens
  const images = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));

  if (images.length === 0) {
    console.log('Nenhuma imagem encontrada na pasta de uploads.');
  } else {
    console.log(`Imagens encontradas (${images.length}):`);
    images.forEach(img => console.log('- ' + img));
  }
});
