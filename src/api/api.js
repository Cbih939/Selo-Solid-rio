// src/api/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'https://selocidadania.redepapelsolidario.org.br'}/api`,
} );

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // =====================================================================
    // ++ INÍCIO DA CORREÇÃO CRÍTICA PARA UPLOADS ++
    // =====================================================================
    // Se a requisição contém dados do tipo FormData, é crucial deixar o
    // 'Content-Type' ser definido pelo navegador. O navegador/axios irá
    // adicioná-lo automaticamente junto com o 'boundary' correto.
    // Forçar um 'Content-Type' aqui quebra o upload de arquivos.
    if (config.data instanceof FormData) {
      // Remove qualquer 'Content-Type' que possa ter sido definido globalmente
      // ou pelo próprio interceptor, devolvendo o controle ao axios/navegador.
      delete config.headers['Content-Type'];
    }
    // =====================================================================
    // ++ FIM DA CORREÇÃO ++
    // =====================================================================

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
