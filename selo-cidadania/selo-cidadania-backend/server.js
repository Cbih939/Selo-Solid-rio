/*
  FICHEIRO: server.js (ATUALIZADO)
  Substitua o conteúdo do seu ficheiro 'server.js' por este para registar a nova rota.
*/
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
const reportsRoutes = require('./routes/reportsRoutes'); // Nova importação

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/ongs', ongRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/proofs', socialProofRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/reports', reportsRoutes); // Regista a nova rota

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend a rodar na porta ${PORT}`);
});