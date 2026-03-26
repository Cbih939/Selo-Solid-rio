import React, { useState, useEffect } from 'react';
import styles from './RegisterPage.module.css'; // Pode usar o mesmo CSS do Login se preferir
import api from '../../../api/api';

const RegisterPage = ({ onNavigateToLogin }) => {
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

  // Captura o ID da ONG da URL (ex: meusaas.com/cadastro?ong=5)
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
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '50px auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#10b981' }}>✅ Cadastro Realizado!</h2>
        <p>A sua conta foi criada com sucesso e já está vinculada à sua instituição.</p>
        <button 
          onClick={() => window.location.href = '/'} 
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Fazer Login Agora
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Criar Conta</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Preencha os seus dados básicos para aderir ao Selo Cidadania.</p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome Completo *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome da Mãe *</label>
            <input type="text" name="mothers_name" required value={formData.mothers_name} onChange={handleChange} placeholder="Nome completo da sua mãe" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Data de Nascimento *</label>
                <input type="date" name="birth_date" required value={formData.birth_date} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Gênero *</label>
                <select name="gender" required value={formData.gender} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não informar">Prefiro não informar</option>
                </select>
              </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Telefone / WhatsApp</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>E-mail de Acesso *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Criar Senha *</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <button type="submit" disabled={loading || !ongId} style={{ marginTop: '10px', width: '100%', padding: '12px', backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: (loading || !ongId) ? 'not-allowed' : 'pointer', opacity: (loading || !ongId) ? 0.7 : 1 }}>
            {loading ? 'A criar conta...' : 'Concluir Cadastro'}
          </button>

        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
            <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Já tem uma conta? Voltar ao Login</a>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;