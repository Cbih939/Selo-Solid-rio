const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importa as rotas
const adminRoutes = require('./routes/adminRoutes');
const ongRoutes = require('./routes/ongRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const prizeRoutes = require('./routes/prizeRoutes');
const socialProofRoutes = require('./routes/socialProofRoutes');
const redemptionRoutes = require('./routes/redemptionRoutes');
const reportsRoutes = require('./routes/reportsRoutes'); 

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares principais
app.use(cors());
app.use(express.json()); // Este é o nosso principal suspeito

// =====================================================================
// NOVO "ESPIÃO" DE DEPURACÃO (agora posicionado aqui)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Requisição passou pelos middlewares principais.`);
    console.log('Corpo da Requisição (req.body):', req.body);
    next();
});
// =====================================================================

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/ongs', ongRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/proofs', socialProofRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});