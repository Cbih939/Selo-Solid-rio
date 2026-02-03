const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

/* ✅ 1. DEFINA allowedOrigins ANTES DE USAR */
const allowedOrigins = [
  'https://selocidadania.org.br',
  'https://www.selocidadania.org.br',
  'http://localhost:3000'
];

/* ✅ 2. CONFIGURAÇÃO DE CORS */
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('❌ CORS bloqueou a origem:', origin);
      return callback(new Error('Bloqueado pela política de CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ✅ 3. PRE-FLIGHT (OBRIGATÓRIO) */
app.options('*', cors());

/* Middlewares */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/* Rotas */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ongs', require('./routes/ongRoutes'));
app.use('/api/admins', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/prizes', require('./routes/prizeRoutes'));
app.use('/api/proofs', require('./routes/socialProofRoutes'));
app.use('/api/redemptions', require('./routes/redemptionRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));

/* Fallback */
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
