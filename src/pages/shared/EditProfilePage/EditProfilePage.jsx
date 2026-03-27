// Arquivo: pages/shared/EditProfilePage/EditProfilePage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './EditProfilePage.module.css';

const EditProfilePage = ({ user, onNavigate }) => {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/me/profile`);
        // Adicionamos a chave de password vazia para podermos editar a senha sem erros
        setFormData({ ...response.data, password: '' });
      } catch (error) {
        console.error("Erro ao buscar perfil para edição:", error);
        setErrorMsg("Não foi possível carregar os dados do seu perfil.");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOngChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      ong_details: {
        ...prev.ong_details,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.put(`/users/me/profile`, formData);
      setSuccessMsg("Perfil atualizado com sucesso!");
      window.scrollTo(0, 0);
      
      // Limpa a senha do formulário após salvar e redireciona após 2 segundos
      setFormData(prev => ({ ...prev, password: '' }));
      setTimeout(() => {
        onNavigate('profile');
      }, 2000);

    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      setErrorMsg(error.response?.data?.error || "Ocorreu um erro ao atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (!formData) {
    return <ContentWrapper title="Editar Perfil"><p style={{padding: '20px'}}>A carregar dados do perfil...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Editar Meu Perfil">
      <div className={styles.formContainer}>
        
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <p className={styles.introText}>
          Atualize as suas informações de acesso e contacto. Mantenha a sua senha segura e não a partilhe com ninguém.
        </p>

        <form onSubmit={handleSubmit}>
          
          {/* SESSÃO 1: DADOS PESSOAIS E ACESSO */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>1. Informações Pessoais e Acesso</h3>
            
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome Completo *</label>
                <input type="text" name="name" required value={formData.name || ''} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefone / WhatsApp</label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>E-mail de Login *</label>
                <input type="email" name="email" required value={formData.email || ''} onChange={handleChange} />
              </div>
              <div className={styles.inputGroup}>
                <label>Nova Senha <small>(Deixe em branco para não alterar)</small></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="******" />
              </div>
            </div>
          </div>

          {/* SESSÃO 2: DADOS DA INSTITUIÇÃO (Apenas para contas ONG) */}
          {formData.role === 'ong' && formData.ong_details && (
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>2. Dados da Instituição (Atalho)</h3>
              
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>Nome Fantasia da OSC</label>
                  <input type="text" name="fantasy_name" value={formData.ong_details.fantasy_name || ''} onChange={handleOngChange} />
                </div>
                <div className={styles.inputGroup}>
                  <label>CNPJ <small>(Não pode ser alterado)</small></label>
                  <input type="text" name="cnpj" value={formData.ong_details.cnpj || ''} readOnly className={styles.inputDisabled} />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label>E-mail de Contato da OSC</label>
                  <input type="email" name="contact_email" value={formData.ong_details.contact_email || ''} onChange={handleOngChange} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Website da OSC</label>
                  <input type="text" name="website" value={formData.ong_details.website || ''} onChange={handleOngChange} placeholder="https://..." />
                </div>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => onNavigate('profile')} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'A Guardar...' : 'Salvar Alterações'}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default EditProfilePage;