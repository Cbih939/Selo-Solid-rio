// Arquivo: pages/user/UserDashboard/UserDashboard.jsx

import React, { useState, useEffect } from 'react';
import styles from './UserDashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';
import api from '../../../api/api';
import Button from '../../../components/ui/Button/Button'; // Importa o Botão

const UserDashboard = ({ onNavigate }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar a visibilidade do botão
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);

  // Efeito principal para buscar dados do perfil e verificar o bônus
  useEffect(() => {
    const fetchProfileAndCheckBonus = async () => {
      try {
        // 1. Busca dados do perfil (ONG logo, nome)
        const profileResponse = await api.get('/users/me/profile');
        setProfileData(profileResponse.data);

        // 2. Verifica se o bônus de primeiro login já foi resgatado
        try {
          // Tentativa de buscar provas sociais do usuário
          const proofsResponse = await api.get('/proofs/user/me'); 
          const isBonusRedeemed = proofsResponse.data.some(
              proof => proof.description === 'Realizar o login de acesso ao Programa Selo Cidadania' && proof.status === 'approved'
          );
          setShowWelcomeBonus(!isBonusRedeemed);
        } catch (proofError) {
          // Se a rota de provas falhar ou não existir, apenas ignoramos ou assumimos false
          console.warn("Não foi possível verificar status do bônus:", proofError);
          // Opcional: setShowWelcomeBonus(true) se quiser mostrar por padrão em caso de erro
        }

      } catch (error) {
        console.error("Erro ao buscar dados do perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndCheckBonus();
  }, []);

  // Função para resgatar o bônus de primeiro login
  // No UserDashboard.jsx, atualize a função:
const handleRedeemBonus = async () => {
  if (!window.confirm("Confirmar o resgate do seu bônus de 10 selos por primeiro login?")) return;

  try {
    const response = await api.post('/redemptions/redeem-first-login');

    alert(response.data.message || "Bônus resgatado com sucesso!");
    setShowWelcomeBonus(false);
    onNavigate('my_balance');

  } catch (error) {
    console.error("ERRO NO RESGATE:", error.response?.data || error.message);

    const msg = error.response?.data?.message || "Erro ao resgatar bônus.";
    alert(msg);
  }
};


  const cards = [
    { id: 'send_social_proof', title: 'Enviar Prova', icon: ICONS.send },
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

      {/* ++ BOTÃO DE BÔNUS DE PRIMEIRO LOGIN ++ */}
      {showWelcomeBonus && (
        <div className={styles.welcomeBonusContainer}>
          <p>🎁 Bônus de Boas-Vindas!</p>
          <Button onClick={handleRedeemBonus} variant="success">
            Resgatar 10 Selos de Primeiro Acesso
          </Button>
        </div>
      )}
      {/* ++ FIM DO BOTÃO ++ */}

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