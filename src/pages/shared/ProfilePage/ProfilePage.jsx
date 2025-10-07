// Arquivo: pages/ProfilePage/ProfilePage.jsx (CORRIGIDO)

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import styles from './ProfilePage.module.css';
import api from '../../../api/api';

const ProfilePage = ({ user, onNavigate }) => {
 const [profileData, setProfileData] = useState(null);

 useEffect(() => {
  // A verificação 'user' foi removida do if porque o token já garante que há um usuário logado
  const fetchProfile = async () => {
   try {
        // === INÍCIO DA CORREÇÃO ===
        // O URL foi alterado para o endpoint correto do backend
    const response = await api.get(`/users/me/profile`);
        // === FIM DA CORREÇÃO ===
        
    setProfileData(response.data);
   } catch (error) {
    console.error("Erro ao buscar perfil:", error);
   }
  };
  fetchProfile();
 }, []); // O array de dependências foi ajustado para executar apenas uma vez

 if (!profileData) {
  return <ContentWrapper title="Meu Perfil"><p>A carregar dados do perfil...</p></ContentWrapper>;
 }

 return (
  <ContentWrapper title="Meu Perfil">
   {/* Secção de Informações Pessoais (Comum a todos) */}
   <div className={styles.section}>
    <h2 className={styles.sectionTitle}>Informações Pessoais</h2>
    <div className={styles.infoItem}><span className={styles.label}>Nome</span><span className={styles.value}>{profileData.name}</span></div>
    <div className={styles.infoItem}><span className={styles.label}>E-mail</span><span className={styles.value}>{profileData.email}</span></div>
    <div className={styles.infoItem}><span className={styles.label}>Cargo</span><span className={styles.value}>{profileData.role}</span></div>
   </div>

   {/* Secção de Informações da ONG (Apenas para o perfil 'ong') */}
   {profileData.role === 'ong' && profileData.ong_details && (
    <div className={styles.section}>
     <h2 className={styles.sectionTitle}>Informações da ONG</h2>
     <div className={styles.infoItem}><span className={styles.label}>Nome Fantasia</span><span className={styles.value}>{profileData.ong_details.fantasy_name}</span></div>
     <div className={styles.infoItem}><span className={styles.label}>CNPJ</span><span className={styles.value}>{profileData.ong_details.cnpj}</span></div>
     <div className={styles.infoItem}><span className={styles.label}>E-mail de Contato</span><span className={styles.value}>{profileData.ong_details.contact_email}</span></div>
    </div>
   )}

   <div className={styles.actions}>
    <Button onClick={() => onNavigate('edit_profile')}>Editar Perfil</Button>
   </div>
  </ContentWrapper>
 );
};

export default ProfilePage;



