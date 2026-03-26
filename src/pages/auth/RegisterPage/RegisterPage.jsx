import React, { useState, useEffect } from 'react';
import styles from './RegisterPage.module.css';
import api from '../../../api/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    mothers_name: '',
    birth_date: '',
    gender: ''
  });
  
  const [ongId, setOngId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ong = params.get('ong');
    if (ong) {
      setOngId(ong);
    } else {
      setError("Link de convite inválido. Peça um novo link à sua instituição.");
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ongId) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', { ...formData, ong_id: ongId });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Ocorreu um erro ao criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successCard}>
        <h2>✅ Cadastro Realizado!</h2>
        <p>A sua conta foi criada com sucesso e já está vinculada à sua instituição.</p>
        <button 
          onClick={() => window.location.href = '/'} 
          className={styles.loginBtn}
        >
          Fazer Login Agora
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        
        <div className={styles.header}>
            <h2>Criar Conta</h2>
            <p>Preencha os seus dados básicos para aderir ao Selo Cidadania.</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.inputGroup}>
            <label>Nome Completo *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} />
          </div>

          <div className={styles.inputGroup}>
            <label>Nome da Mãe *</label>
            <input type="text" name="mothers_name" required value={formData.mothers_name} onChange={handleChange} placeholder="Nome completo da sua mãe" />
          </div>

          <div className={styles.row}>
              <div className={styles.col}>
                <label>Data de Nascimento *</label>
                <input type="date" name="birth_date" required value={formData.birth_date} onChange={handleChange} />
              </div>
              <div className={styles.col}>
                <label>Gênero *</label>
                <select name="gender" required value={formData.gender} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não informar">Prefiro não informar</option>
                </select>
              </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Telefone / WhatsApp</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" />
          </div>

          <div className={styles.inputGroup}>
            <label>E-mail de Acesso *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} />
          </div>

          <div className={styles.inputGroup}>
            <label>Criar Senha *</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} />
          </div>

          <button type="submit" disabled={loading || !ongId} className={styles.submitBtn}>
            {loading ? 'A criar conta...' : 'Concluir Cadastro'}
          </button>

        </form>

        <div className={styles.footer}>
            <a href="/">Já tem uma conta? Voltar ao Login</a>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;