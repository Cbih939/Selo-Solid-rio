import axios from 'axios';
// src/api/api.js
const api = axios.create({
  baseURL: '/api', 
});

export default api;
