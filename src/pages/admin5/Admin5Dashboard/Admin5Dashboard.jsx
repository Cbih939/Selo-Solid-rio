// Arquivo: pages/admin5/Admin5Dashboard/Admin5Dashboard.jsx (ATUALIZADO)

import React from 'react';
import styles from './Admin5Dashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';
import MaintenanceControl from '../../../components/admin/MaintenanceControl';

const Admin5Dashboard = ({ onNavigate }) => {
  const cards = [
    { id: 'create_admin', title: 'Cadastrar Admin Nv.1', icon: ICONS.addAdmin },
    { id: 'list_admins', title: 'Listar Admins Nv.1', icon: ICONS.list },
    { id: 'create_ong', title: 'Cadastrar OSC', icon: ICONS.ong },
    { id: 'list_ongs', title: 'Listar OSCs', icon: ICONS.list },
    { id: 'list_users', title: 'Listar Beneficiários', icon: ICONS.list },
    { id: 'reports', title: 'Relatórios', icon: ICONS.chart },
    { id: 'list_all_users', title: 'Listar todos os usuários', icon: ICONS.list },
    { id: 'create_activity', title: 'Gerenciar Atividades', icon: ICONS.list },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Painel Super Admin</h1>
      
      {/* ++ BLOCO DE CONTROLE DE MANUTENÇÃO ++ */}
      <div className={styles.maintenanceSection}>
        <MaintenanceControl />
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

export default Admin5Dashboard;