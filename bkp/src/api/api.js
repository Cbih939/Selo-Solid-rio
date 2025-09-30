import axios from 'axios';

// A baseURL agora aponta para o caminho da API no seu domínio.
const api = axios.create({
  // =====================================================================
  // CORREÇÃO: Adicione '/api' ao final da baseURL.
  // =====================================================================
  baseURL: `${process.env.REACT_APP_API_URL || 'https://selocidadania.redepapelsolidario.org.br'}/api`,
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
