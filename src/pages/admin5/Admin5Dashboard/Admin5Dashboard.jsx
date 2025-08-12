import React from 'react';
import styles from './Admin5Dashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';

const Admin5Dashboard = ({ onNavigate }) => {
  const cards = [
    { id: 'create_admin', title: 'Cadastrar Admin Nv.1', icon: ICONS.addAdmin },
    { id: 'list_admins', title: 'Listar Admins Nv.1', icon: ICONS.list },
    { id: 'create_ong', title: 'Cadastrar ONG', icon: ICONS.ong },
    { id: 'list_ongs', title: 'Listar ONGs', icon: ICONS.list },
    { id: 'list_users', title: 'Listar Usuários', icon: ICONS.list },
    { id: 'reports', title: 'Relatórios', icon: ICONS.chart },
    { id: 'create_prize', title: 'Cadastrar Prêmio', icon: ICONS.gift },
    { id: 'list_prizes', title: 'Listar Prêmios', icon: ICONS.list },
  ];

  return (
    <div>
      <h1 className={styles.title}>Painel Super Admin</h1>
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

export default Admin5Dashboard;