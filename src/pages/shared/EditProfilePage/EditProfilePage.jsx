// Arquivo: pages/shared/EditProfilePage/EditProfilePage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './EditProfilePage.module.css';

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const EditProfilePage = ({ user, onNavigate }) => {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/me/profile`);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setFormData(prev => ({ ...prev, profile_photo: base64 }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        profile_photo: formData.profile_photo
      };

      await api.put(`/users/me/profile`, payload);
      setSuccessMsg("Perfil atualizado com sucesso!");
      window.scrollTo(0, 0);
      
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Espera 2 segundos e manda de volta para o dashboard
      setTimeout(() => {
        onNavigate('dashboard');
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
          
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>1. Informações Pessoais e Acesso</h3>
            
            <div className={styles.profilePhotoSection}>
              <div className={styles.avatarPreview}>
                {formData.profile_photo ? (
                  <img src={formData.profile_photo} alt="Avatar" className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarPlaceholder}>📷</span>
                )}
              </div>
              <div className={styles.photoUploadControls}>
                <label className={styles.photoUploadLabel}>
                  Alterar Foto de Perfil
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className={styles.hiddenInput} />
                </label>
              </div>
            </div>

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
                <label>E-mail de Login <small>(Não pode ser alterado)</small></label>
                <input type="email" name="email" value={formData.email || ''} disabled className={styles.inputDisabled} />
              </div>
              <div className={styles.inputGroup}>
                <label>Nova Senha <small>(Deixe em branco para não alterar)</small></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="******" />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => onNavigate('dashboard')} disabled={saving}>
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