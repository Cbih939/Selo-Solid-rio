import React from 'react';
import styles from './UserDashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';

const UserDashboard = ({ onNavigate }) => {
  const cards = [
    { id: 'send_social_proof', title: 'Enviar Prova Social', icon: ICONS.socialProof },
    { id: 'my_balance', title: 'Meu Saldo', icon: ICONS.wallet },
    { id: 'redeem_prizes', title: 'Resgatar Prêmios', icon: ICONS.redeem },
    { id: 'my_redemptions', title: 'Meus Resgates', icon: ICONS.receipt },
  ];

  return (
    <div>
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