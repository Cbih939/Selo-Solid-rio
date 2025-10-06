const mysql = require('mysql2');
require('dotenv').config();

// ++ INÍCIO DO DEBUG ++
console.log("--- Verificando Variáveis de Ambiente ---");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("DB_PASSWORD existe?:", !!process.env.DB_PASSWORD); // Apenas verifica se existe, por segurança
console.log("-----------------------------------------");
// ++ FIM DO DEBUG ++

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();