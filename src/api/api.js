// Arquivo: src/api/api.js (ou o caminho onde ele estiver)

import axios from 'axios';

// Define a URL base da sua API.
// Use a URL de produção. Se estiver em desenvolvimento, pode usar:
// const baseURL = process.env.NODE_ENV === 'production'
//   ? 'https://selocidadania.redepapelsolidario.org.br/api'
//   : 'http://localhost:3001/api';

const baseURL = 'https://selocidadania.baygroups.com.br/api';

const api = axios.create({
  baseURL: baseURL,
});

// ==================================================================
// ++ INTERCEPTOR DE REQUISIÇÃO (A CORREÇÃO) ++
// ==================================================================
// Este é o código que adiciona o token em TODAS as requisições
api.interceptors.request.use(
  (config) => {
    // 1. Tenta pegar o token do localStorage
    const token = localStorage.getItem('token'); 

    // 2. Se o token existir, anexa-o ao cabeçalho de Autorização
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Em caso de erro ao configurar a requisição
    return Promise.reject(error);
  }
);

// ==================================================================
// ++ INTERCEPTOR DE RESPOSTA (BÓNUS RECOMENDADO) ++
// ==================================================================
// Este código verifica se o token expirou (erro 401) e faz o logout automático.
api.interceptors.response.use(
  (response) => {
    // Se a resposta for bem-sucedida, apenas a retorna
    return response;
  },
  (error) => {
    // 1. Verifica se o erro é 401 (Não Autorizado)
    if (error.response && error.response.status === 401) {
      // 2. Limpa o localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      
      // 3. Recarrega a página. O App.jsx vai ver que não há usuário
      // e vai redirecionar para a tela de Login.
      // Usamos location.href para forçar um recarregamento completo.
      if (window.location.pathname !== '/login') {
         window.location.href = '/'; 
      }
    }
    
    // Retorna o erro para que a chamada original (ex: no ProfilePage)
    // ainda possa tratar o erro (ex: mostrar "Erro ao buscar perfil").
    return Promise.reject(error);
  }
);

export default api;