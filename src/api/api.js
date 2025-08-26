import axios from 'axios';

// Cria uma instância do Axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://selocidadania.redepapelsolidario.org.br/api',
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // pega o token do storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
