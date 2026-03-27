// Arquivo: src/pages/admin5/CreateAdminPage/CreateAdminPage.jsx

import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './CreateAdminPage.module.css';

const CreateAdminPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

      await api.post('/users', payload);
      
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

        <p className={styles.introText}>
          Preencha os dados abaixo para conceder acesso a um novo Administrador de Nível 1. Estes utilizadores poderão gerenciar OSCs e emitir relatórios globais.
        </p>

        <form onSubmit={handleSubmit}>
          
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Dados de Acesso</h3>
            
            <div className={styles.inputGroup} style={{ marginBottom: '15px' }}>
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
                <label>Senha Provisória *</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="Defina uma senha segura"
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'A Cadastrar...' : 'Cadastrar Administrador'}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default CreateAdminPage;