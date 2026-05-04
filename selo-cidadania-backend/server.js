// Arquivo: selo-cidadania-backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const maintenanceMiddleware = require('./middlewares/maintenance');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

/* ✅ 1. CONFIGURAÇÃO DE CORS (Simples e Direta) */
const corsOptions = {
  origin: [
    'https://selocidadania.org.br',
    'https://www.selocidadania.org.br',
    'http://selocidadania.org.br',
    'http://www.selocidadania.org.br',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Aplica o CORS a todas as rotas
app.use(cors(corsOptions));

// Garante o preflight para todas as rotas
app.options('*', cors(corsOptions)); 

/* Middlewares base */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


/* ========================================================= */
/* ROTAS PÚBLICAS (ANTES DA MANUTENÇÃO E AUTENTICAÇÃO)       */
/* ========================================================= */

// Rota pública para o frontend checar o status da manutenção
// (TEM DE FICAR AQUI, antes do middleware, senão é bloqueada durante a manutenção)
app.get('/api/system-status', async (req, res) => {
  const db = require('./config/db'); 
  try {
    const [settings] = await db.query('SELECT maintenance_mode, estimated_return_at FROM system_settings LIMIT 1');
    if (settings.length === 0) {
        return res.json({ maintenance_mode: 0, estimated_return_at: null });
    }
    res.json(settings[0]);
  } catch (error) {
    console.error("Erro ao buscar status de manutenção:", error);
    res.status(500).json({ error: "Erro ao buscar status" });
  }
});


/* ✅ 2. APLICAR MIDDLEWARE DE MANUTENÇÃO GLOBAL */
app.use(maintenanceMiddleware);


/* ✅ 3. SERVIR UPLOADS DE IMAGENS */
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get('/uploads/*', (req, res) => {
  res.status(404).json({ error: "Arquivo de imagem não encontrado fisicamente no servidor." });
});


/* ========================================================= */
/* ROTAS DA APLICAÇÃO DE API                                 */
/* ========================================================= */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ongs', require('./routes/ongRoutes'));
app.use('/api/admins', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/prizes', require('./routes/prizeRoutes'));
app.use('/api/proofs', require('./routes/socialProofRoutes'));
app.use('/api/redemptions', require('./routes/redemptionRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/logs', logRoutes);

// NOVAS ROTAS (FASE 2: SHOPPING E EVENTOS)
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/shopping', require('./routes/shoppingRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

/* Fallback - Se não for nenhuma rota de API válida */
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});