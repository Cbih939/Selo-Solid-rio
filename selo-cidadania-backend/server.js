// selo-cidadania-backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importa as rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ongRoutes = require('./routes/ongRoutes');
const adminRoutes = require('./routes/adminRoutes');
const prizeRoutes = require('./routes/prizeRoutes');
const socialProofRoutes = require('./routes/socialProofRoutes');
const redemptionRoutes = require('./routes/redemptionRoutes');
const reportsRoutes = require('./routes/reportsRoutes'); 

const app = express();
const PORT = process.env.PORT || 3001; // Usando a porta 3001

// Middlewares principais
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true
}));

// Aumenta o limite do express.json() para aceitar as strings Base64, que são grandes.
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir arquivos estáticos da pasta 'public/uploads'
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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
