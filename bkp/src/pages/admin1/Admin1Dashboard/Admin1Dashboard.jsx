import React from 'react';
import styles from './Admin1Dashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';

const Admin1Dashboard = ({ onNavigate }) => {
  // O Admin Nível 1 não pode criar outros admins
  const cards = [
    { id: 'create_ong', title: 'Cadastrar OSC', icon: ICONS.ong },
    { id: 'list_ongs', title: 'Listar OSCs', icon: ICONS.list },
    { id: 'list_users', title: 'Listar Beneficiários', icon: ICONS.list },
    { id: 'reports', title: 'Relatórios', icon: ICONS.chart },
  ];

  return (
    <div>
      <h1 className={styles.title}>Painel do Administrador</h1>
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

export default Admin1Dashboard;