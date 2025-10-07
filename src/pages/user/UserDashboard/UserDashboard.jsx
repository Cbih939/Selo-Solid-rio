// Arquivo: pages/user/UserDashboard/UserDashboard.jsx (CORRIGIDO)

import React, { useState, useEffect } from 'react';
import styles from './UserDashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';
import api from '../../../api/api'; // Importa a instância do api

const UserDashboard = ({ onNavigate }) => {
  // Estados para guardar os dados do perfil e o estado de carregamento
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efeito para buscar os dados do perfil ao carregar a página
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me/profile');
        setProfileData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados do perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []); // Array vazio significa que executa apenas uma vez

  const cards = [
  { id: 'send_social_proof', title: 'Enviar Prova Social', icon: ICONS.send },
  { id: 'my_balance', title: 'Meu Saldo', icon: ICONS.wallet },
  { id: 'my_dependents', title: 'Meus Dependentes', icon: ICONS.profile},
 ];

  if (loading) {
    return <h1 className={styles.title}>A carregar o seu painel...</h1>;
  }

 return (
  <div>
      {/* Cabeçalho que mostra as informações da ONG */}
      {profileData && profileData.ong_logo_url && (
        <div className={styles.ongHeader}>
          <img src={profileData.ong_logo_url} alt={profileData.ong_name} className={styles.ongLogo} />
          <h2 className={styles.ongName}>{profileData.ong_name}</h2>
        </div>
      )}

   <h1 className={styles.title}>Meu Painel de Cidadania</h1>
   <div className={styles.grid}>
    {cards.map(card => (
     <DashboardCard
      key={card.id}
      title={card.title}
      icon={card.icon}
      onClick={() => onNavigate(card.id)}
     />         
    ))}
   </div>
  </div>
 );
};

export default UserDashboard;