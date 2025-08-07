import React from 'react';
import styles from './OngDashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';

const OngDashboard = ({ onNavigate }) => {
  const cards = [
    { id: 'create_user', title: 'Cadastrar Usuário', icon: ICONS.addUser },
    { id: 'list_ong_users', title: 'Listar Usuários', icon: ICONS.list },
    { id: 'acceptance', title: 'Tela de Aceite', icon: ICONS.seal },
    { id: 'help', title: 'Ajuda', icon: ICONS.help },
  ];

  return (
    <div>
      <h1 className={styles.title}>Painel da ONG</h1>
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