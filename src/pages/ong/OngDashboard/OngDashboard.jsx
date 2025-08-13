import React from 'react';
import styles from './OngDashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';
import logoPlaceholder from '../../../assets/images/logo.png'; // Usa o logo da app como placeholder

// A página agora recebe o 'user' logado como propriedade
const OngDashboard = ({ user, onNavigate }) => {
  const cards = [
    { id: 'create_user', title: 'Cadastrar Usuário', icon: ICONS.addUser },
    { id: 'list_ong_users', title: 'Listar Usuários', icon: ICONS.list },
    { id: 'acceptance', title: 'Tela de Aceite', icon: ICONS.seal },
    { id: 'help', title: 'Ajuda', icon: ICONS.help },
  ];

  // O nome da ONG agora vem do objeto 'user' que recebemos no login
  const ongName = user?.ong_name || 'ONG';
  const ongLogo = user?.ong_logo_url || logoPlaceholder;

  return (
    <div>
      <div className={styles.header}>
        <img src={ongLogo} alt={`Logótipo da ${ongName}`} className={styles.logo} />
        <h1 className={styles.title}>Painel Administrativo - {ongName}</h1>
      </div>
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

export default OngDashboard;