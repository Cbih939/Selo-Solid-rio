// Arquivo: src/pages/admin5/Admin5Dashboard/Admin5Dashboard.jsx

import React from 'react';
import styles from './Admin5Dashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';
import MaintenanceControl from '../../../components/admin/MaintenanceControl';

const Admin5Dashboard = ({ onNavigate, currentUser }) => {
  // Agrupamento lógico dos cartões para facilitar a navegação do Super Admin
  const actionGroups = [
    {
      groupTitle: "🏢 Gestão de Instituições (OSCs)",
      cards: [
        { id: 'create_ong', title: 'Cadastrar Nova OSC', icon: ICONS.ong },
        { id: 'list_ongs', title: 'Listar OSCs Ativas', icon: ICONS.list },
        { id: 'create_activity', title: 'Catálogo de Atividades', icon: ICONS.list },
      ]
    },
    {
      groupTitle: "👥 Gestão de Beneficiários",
      cards: [
        { id: 'list_users', title: 'Beneficiários por OSC', icon: ICONS.users || ICONS.list },
        { id: 'list_all_users', title: 'Base Global de Usuários', icon: ICONS.list },
      ]
    },
    {
      groupTitle: "⚙️ Administração e Sistema",
      cards: [
        { id: 'create_admin', title: 'Cadastrar Admin Nv.1', icon: ICONS.addAdmin },
        { id: 'list_admins', title: 'Listar Admins Nv.1', icon: ICONS.list },
        { id: 'reports', title: 'Relatórios Globais', icon: ICONS.chart },
      ]
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Cabeçalho de Boas-Vindas */}
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>
            Olá, {currentUser?.name?.split(' ')[0] || 'Super Admin'} 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Visão global e gestão completa do sistema Selo Cidadania.
          </p>
        </div>
      </div>

      {/* Bloco de Controlo de Manutenção (Destacado) */}
      <div className={styles.maintenanceSection}>
        <div className={styles.maintenanceHeader}>
          <h3 className={styles.maintenanceTitle}>🚧 Controlo de Manutenção</h3>
          <p className={styles.maintenanceDesc}>Ative ou desative o acesso global à plataforma para atualizações.</p>
        </div>
        <MaintenanceControl />
      </div>

      {/* Renderização Dinâmica dos Grupos de Ação */}
      <div className={styles.groupsContainer}>
        {actionGroups.map((group, index) => (
          <div key={index} className={styles.sectionGroup}>
            <h2 className={styles.sectionTitle}>{group.groupTitle}</h2>
            <div className={styles.grid}>
              {group.cards.map(card => (
                <DashboardCard
                  key={card.id}
                  title={card.title}
                  icon={card.icon}
                  onClick={() => onNavigate(card.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Admin5Dashboard;