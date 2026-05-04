// Arquivo: selo-cidadania-backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const maintenanceMiddleware = require('./middlewares/maintenance');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

/* ✅ 1. DEFINA allowedOrigins COM TODAS AS VARIANTES */
const allowedOrigins = [
  'https://selocidadania.org.br',
  'https://www.selocidadania.org.br',
  'http://selocidadania.org.br',
  'http://www.selocidadania.org.br',
  'http://localhost:3000'
];

/* ✅ 2. CONFIGURAÇÃO DE CORS */
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueou a origem:', origin);
      callback(new Error('Bloqueado pela política de CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ✅ 3. PRE-FLIGHT */
app.options('*', cors());

/* Middlewares base */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ++ ADIÇÃO: Aplicar o bloqueio de manutenção globalmente ++
// Ele deve vir ANTES das rotas e DEPOIS do express.json()
app.use(maintenanceMiddleware);

/* ✅ 4. SERVIR UPLOADS (CORRIGIDO PARA LER AS IMAGENS) */
// Servir a pasta padrão e permitir CORS apontando para a pasta "public/uploads"
app.use('/uploads', cors(), express.static(path.join(__dirname, 'public', 'uploads')));
// Rota de segurança caso o NGINX adicione o /api na frente apontando para "public/uploads"
app.use('/api/uploads', cors(), express.static(path.join(__dirname, 'public', 'uploads')));

// Se a requisição chegar até aqui procurando um upload, significa que o arquivo não existe no disco!
app.get('/uploads/*', (req, res) => {
  res.status(404).json({ error: "Arquivo de imagem não encontrado fisicamente no servidor." });
});

/* ========================================================= */
/* ROTAS DA APLICAÇÃO                                        */
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

// ++ NOVAS ROTAS (FASE 2: SHOPPING, EVENTOS E ESTATÍSTICAS) ++
// (Certifique-se de que criaremos estes ficheiros de rota no próximo passo)
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/shopping', require('./routes/shoppingRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

// Rota pública para o frontend checar o status da manutenção
app.get('/api/system-status', async (req, res) => {
  const db = require('./config/db'); // Ajuste conforme seu arquivo de conexão
  try {
    const [settings] = await db.query('SELECT maintenance_mode, estimated_return_at FROM system_settings LIMIT 1');
    res.json(settings[0]);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar status" });
  }
});

/* Fallback - Se não for nenhuma rota de API válida */
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});