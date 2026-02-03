// /var/www/selo-solidario/selo-cidadania-backend/server.js

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
const PORT = process.env.PORT || 3002; // Mantendo a porta 3002 conforme o seu log mais recente

// 1. Configuração de CORS (Corrigida: Variável definida antes do uso)
const allowedOrigins = [
  'https://selocidadania.org.br',
  'https://www.selocidadania.org.br',
  'http://localhost:3000' // Para testes locais se necessário
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como ferramentas de teste ou sistemas internos)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS Bloqueou a origem:", origin);
      callback(new Error('Bloqueado pela política de CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Middlewares de Parsing (Aumentado para aceitar Base64 grande)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Servir arquivos estáticos (Uploads de fotos/comprovativos)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// 4. Definição das Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/ongs', ongRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/proofs', socialProofRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/reports', reportsRoutes);

// 5. Tratamento de erro global para rotas não encontradas (Opcional, mas recomendado)
app.use((req, res) => {
    res.status(404).json({ message: "Rota não encontrada no servidor backend." });
});

// Inicialização do Servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor online na porta ${PORT}`);
    console.log(`🚀 Aceitando requisições de: ${allowedOrigins.join(', ')}`);
});