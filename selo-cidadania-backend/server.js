// server.js
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
const PORT = process.env.PORT || 3002;

// Middlewares principais
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta 'public/uploads'
// A URL será http://seuservidor.com/uploads/nome-do-arquivo.ext
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads' )));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/ongs', ongRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/proofs', socialProofRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor a rodar na porta ${PORT} em todas as interfaces IPv4`);
});