import axios from 'axios';
// Cria uma instância do Axios com a URL base do nosso backend.
// O backend está a rodar em http://localhost:3001
const api = axios.create({
  baseURL: 'https://selo-cidadania-backend.onrender.com/api',
});

export default api;
