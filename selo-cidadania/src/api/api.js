import axios from 'axios';
// src/api/api.js
const api = axios.create({
  baseURL: 'http://selocidadania.redepapelsolidario.org.br/api', 
});

export default api;
