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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data) {
        const { token, user } = response.data;

        // Salva token e dados do usuário
        localStorage.setItem('token', token);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Chama callback para atualizar estado global
        onLoginSuccess(response.data);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Não foi possível conectar ao servidor.');
      }
    } finally {
      setLoading(false);
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
              required
            />
            <InputField 
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className={styles.error}>{error}</p>}
            
            <div className={styles.buttonGroup}>
              <Button type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginScreen;
