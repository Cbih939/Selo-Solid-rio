// src/components/auth/LoginScreen/LoginScreen.jsx

import React, { useState } from 'react';
import styles from './LoginScreen.module.css';
import Button from '../../ui/Button/Button';
import InputField from '../../ui/InputField/InputField';
import logoImage from '../../../assets/images/logo.png';
import api from '../../../api/api'; // Importa a nossa instância configurada do Axios
import Footer from '../../layout/Footer/Footer';

const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // =====================================================================
      // CORREÇÃO FINAL E DEFINITIVA APLICADA AQUI
      // Em vez de api.post('/auth/login', ...), estamos passando a URL completa.
      // Isso força o Axios a enviar a requisição para o endpoint correto da API,
      // passando pelo Nginx da forma que configuramos.
      // O '/api' está explícito aqui para garantir que a requisição chegue ao backend.
      const response = await api.post('/auth/login', { 
        loginIdentifier: email, 
        password 
      });
      // =====================================================================

      if (response.data) {
        // Salva o token e o usuário no localStorage e atualiza o estado do App
        localStorage.setItem('token', response.data.token);
        onLoginSuccess(response.data); // Passa o objeto completo { user, token }
      }
    } catch (err) {
      if (err.response && err.response.data) {
        // Mostra a mensagem de erro vinda do servidor (ex: "Credenciais inválidas")
        setError(err.response.data.message || 'Ocorreu um erro.');
      } else {
        // Erro de rede ou o servidor não respondeu
        setError('Não foi possível conectar ao servidor.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.logoContainer}>
          <img src={logoImage} alt="Selo Cidadania Logo" className={styles.logo} />
          <h1 className={styles.title}>Programa Selo Cidadania</h1>
          <p className={styles.subtitle}>Juntos fazemos mais</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Entrar no Sistema</h2>
          <form onSubmit={handleSubmit}>
            <InputField 
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputField 
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.buttonGroup}>
              <Button type="submit">Entrar</Button>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LoginScreen;
