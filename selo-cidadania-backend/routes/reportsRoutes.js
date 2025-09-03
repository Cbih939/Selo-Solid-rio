// Arquivo: routes/reportsRoutes.js

const express = require('express');
const router = express.Router();

// Importa o objeto 'reportsController' que contém a função 'getReports'
const reportsController = require('../controllers/reportsController');

// Define a rota GET para o caminho raiz ('/')
// A função passada para a rota é 'reportsController.getReports'
// Se 'reportsController.getReports' for 'undefined', o erro acontece aqui.
router.get('/', reportsController.getReports);

// Exporta o router configurado para ser usado no server.js
module.exports = router;
