// server.js (CORRIGIDO)

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

// =====================================================================
// ++ INÍCIO DA CORREÇÃO CRÍTICA ++
// =====================================================================

// 1. Middlewares que não interferem com o corpo da requisição
app.use(cors());

// 2. Servir arquivos estáticos
// A URL será http://seuservidor.com/uploads/nome-do-arquivo.ext
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'  )));

// 3. REGISTRE AS ROTAS DE UPLOAD PRIMEIRO
// Rotas que usam 'multipart/form-data' (multer) devem vir antes do express.json()
app.use('/api/ongs', ongRoutes);

// 4. AGORA, registre os body-parsers globais.
// Eles vão processar as requisições para as rotas restantes que usam JSON.
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 5. Registre as rotas restantes que dependem de JSON
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/proofs', socialProofRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/reports', reportsRoutes);

// =====================================================================
// ++ FIM DA CORREÇÃO ++
// =====================================================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor a rodar na porta ${PORT} em todas as interfaces IPv4`);
});
