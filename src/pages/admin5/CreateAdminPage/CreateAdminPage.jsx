// Arquivo: src/pages/admin5/CreateAdminPage/CreateAdminPage.jsx

import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './CreateAdminPage.module.css';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const CreateAdminPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // O role_id 2 corresponde a 'admin1' no backend
      const payload = {
        ...formData,
        role_id: 2 
      };

      await api.post('/admins', payload);
      
      setSuccessMsg('Administrador Nível 1 cadastrado com sucesso!');
      setFormData({ name: '', email: '', password: '' });
      window.scrollTo(0,0);
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      console.error("Erro ao criar admin:", error);
      setErrorMsg(error.response?.data?.error || 'Ocorreu um erro ao cadastrar o administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWrapper title="Cadastrar Admin Nível 1">
      <div className={styles.formContainer}>
        
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <div className={styles.headerBlock}>
          <h2 className={styles.mainTitle}>Novo Administrador</h2>
          <p className={styles.introText}>
            Preencha os dados abaixo para conceder acesso a um novo Administrador de Nível 1. Estes utilizadores poderão gerenciar OSCs e emitir relatórios globais na plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>🛡️ Credenciais de Acesso</h3>
            
            <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
              <label>Nome Completo *</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Ex: Maria Antonieta"
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>E-mail Corporativo *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="admin@selocidadania.org.br"
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Senha Inicial (Provisória) *</label>
                <div className={styles.passwordWrapper}>
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password" 
                    required 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Defina uma senha segura"
                    className={styles.passwordInput}
                  />
                  <span 
                    className={styles.eyeIconBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', padding: '12px 24px', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'A Cadastrar...' : '✅ Cadastrar Administrador'}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default CreateAdminPage;