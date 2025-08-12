import React, { useState } from 'react';
import styles from './LoginScreen.module.css';
import Button from '../../ui/Button/Button';
import InputField from '../../ui/InputField/InputField';
import logoImage from '../../../assets/images/logo.png';
import api from '../../../api/api';
import Footer from '../../layout/Footer/Footer';

const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data) {
        onLoginSuccess(response.data);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Não foi possível conectar ao servidor.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.logoContainer}>
          <img src={logoImage} alt="Selo Cidadania Logo" className={styles.logo} />
          <h1 className={styles.title}>Selo Cidadania</h1>
          <p className={styles.subtitle}>Protótipo de Interface</p>
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
      
      {/* Adiciona o componente Footer no final da página */}
      <Footer />
    </div>
  );
};

export default LoginScreen;