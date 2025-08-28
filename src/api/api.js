// src/api/api.js

import axios from 'axios';

// A baseURL agora aponta APENAS para o domínio do servidor.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://selocidadania.redepapelsolidario.org.br',
} );

// O interceptor para adicionar o token está correto e permanece.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
