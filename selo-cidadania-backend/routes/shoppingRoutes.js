const express = require('express');
const router = express.Router();
const shoppingController = require('../controllers/shoppingController');
const { admin, protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuração básica do multer (ajuste conforme o seu middleware principal)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'product-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rotas públicas ou para usuários logados verem os produtos
router.get('/', protect, shoppingController.getAllProducts);
router.get('/:id', protect, shoppingController.getProductById);

// Rotas restritas aos administradores (Nível 5 e Nível 1)
router.post('/', admin, upload.single('image'), shoppingController.createProduct);
router.put('/:id', admin, upload.single('image'), shoppingController.updateProduct);
router.delete('/:id', admin, shoppingController.deleteProduct);

module.exports = router;