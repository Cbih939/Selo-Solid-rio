// Arquivo: src/api/api.js

import axios from 'axios';

/**
 * CONFIGURAÇÃO DA URL BASE
 * Importante: O uso do 'www' deve ser idêntico ao endereço acessado no navegador
 * para evitar bloqueios de política CORS (Cross-Origin Resource Sharing).
 */
const baseURL = 'https://www.selocidadania.org.br/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==================================================================
// ++ INTERCEPTOR DE REQUISIÇÃO ++
// ==================================================================
// Garante que o Token JWT seja enviado em todas as chamadas à API
api.interceptors.request.use(
  (config) => {
    // 1. Recupera o token armazenado no navegador
    const token = localStorage.getItem('token'); 

    // 2. Se o token existir, injeta-o no Header de Autorização
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Trata erros antes da requisição ser enviada
    return Promise.reject(error);
  }
);

// ==================================================================
// ++ INTERCEPTOR DE RESPOSTA ++
// ==================================================================
// Monitora as respostas para tratar sessões expiradas automaticamente
api.interceptors.response.use(
  (response) => {
    // Retorna a resposta normalmente se não houver erro
    return response;
  },
  (error) => {
    /**
     * TRATAMENTO DE ERRO 401 (Unauthorized)
     * Ocorre quando o token expirou ou é inválido.
     */
    if (error.response && error.response.status === 401) {
      // 1. Limpa os dados de sessão do utilizador
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');

      // 2. Avisa o App para encerrar a sessão no estado do React.
      // A navegação é feita por estado (a URL fica em '/'), então apenas limpar o
      // localStorage deixava a tela "logada" e as próximas chamadas saíam sem token.
      window.dispatchEvent(new Event('auth:expired'));
    }
    
    // Retorna o erro para que o componente (ex: Login, Profile) possa tratar localmente
    return Promise.reject(error);
  }
);

export default api;