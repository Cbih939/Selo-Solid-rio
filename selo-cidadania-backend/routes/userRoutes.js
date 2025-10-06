// Arquivo: selo-cidadania-backend/routes/userRoutes.js - VERSÃO DE TESTE MÍNIMO

console.log('--- [userRoutes.js] A iniciar o carregamento do ficheiro de teste ---');

try {
    const middleware = require('../middlewares/authMiddleware');
    console.log('--- [userRoutes.js] authMiddleware importado com SUCESSO. ---');
    console.log('Conteúdo do objeto middleware:', middleware);

    if (middleware && typeof middleware.protect === 'function') {
        console.log('+++ SUCESSO: A função "protect" foi encontrada e é uma função! +++');
    } else {
        console.error('!!! FALHA: A função "protect" NÃO foi encontrada ou não é uma função. Tipo encontrado:', typeof middleware.protect);
    }

} catch (e) {
    console.error('--- [userRoutes.js] CRASH CATASTRÓFICO ao importar authMiddleware! ---', e);
}

const express = require('express');
const router = express.Router();

// Todas as rotas estão desativadas para este teste. Apenas exportamos um router vazio.
console.log('--- [userRoutes.js] Ficheiro de teste carregado. Exportando router vazio. ---');

module.exports = router;