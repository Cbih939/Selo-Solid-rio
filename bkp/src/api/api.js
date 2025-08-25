// selo-cidadania/src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // O Nginx vai capturar isso!
});

export default api;