// Arquivo: src/pages/admin5/Admin5Dashboard/Admin5Dashboard.jsx

import React from 'react';
import styles from './Admin5Dashboard.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import MaintenanceControl from '../../../components/admin/MaintenanceControl';
import { ICONS } from '../../../assets/icons/ICONS';

const Admin5Dashboard = ({ onNavigate }) => {
  
  // Organizando as ações por categorias para facilitar a vida do Super Admin
  const systemActions = [
    { id: 'reports', title: 'Relatórios Gerais', icon: ICONS.chart },
    { id: 'create_activity', title: 'Gerenciar Atividades', icon: ICONS.list },
  ];

  const oscActions = [
    { id: 'create_ong', title: 'Cadastrar Nova OSC', icon: ICONS.ong },
    { id: 'list_ongs', title: 'Listar OSCs Ativas', icon: ICONS.list },
  ];

  const accountActions = [
    { id: 'create_admin', title: 'Cadastrar Admin Nv.1', icon: ICONS.addAdmin },
    { id: 'list_admins', title: 'Listar Admins Nv.1', icon: ICONS.list },
    { id: 'list_all_users', title: 'Todos os Utilizadores', icon: ICONS.list },
    { id: 'list_users', title: 'Apenas Beneficiários', icon: ICONS.list },
  ];

  return (
    <ContentWrapper title="Painel Central - Super Administrador">
      <div className={styles.dashboardContainer}>
        
        {/* ++ BLOCO DE CONTROLE DE MANUTENÇÃO (DESTAQUE) ++ */}
        <div className={styles.maintenanceBlock}>
          <div className={styles.maintenanceHeader}>
            <h3 className={styles.sectionTitle}>Controlo do Sistema</h3>
            <p className={styles.sectionSubtitle}>Ative ou desative o acesso global à plataforma.</p>
          </div>
          <div className={styles.maintenanceContent}>
            <MaintenanceControl />
          </div>
        </div>

        {/* ++ BLOCO: GESTÃO DO SISTEMA ++ */}
        <div className={styles.categoryBlock}>
          <h3 className={styles.categoryTitle}>📊 Sistema e Relatórios</h3>
          <div className={styles.cardsGrid}>
            {systemActions.map(card => (
              <DashboardCard
                key={card.id}
                title={card.title}
                icon={card.icon}
                onClick={() => onNavigate(card.id)}
              />
            ))}
          </div>
        </div>

        {/* ++ BLOCO: GESTÃO DE OSCs ++ */}
        <div className={styles.categoryBlock}>
          <h3 className={styles.categoryTitle}>🏢 Organizações Sociais (OSCs)</h3>
          <div className={styles.cardsGrid}>
            {oscActions.map(card => (
              <DashboardCard
                key={card.id}
                title={card.title}
                icon={card.icon}
                onClick={() => onNavigate(card.id)}
              />
            ))}
          </div>
        </div>

        {/* ++ BLOCO: GESTÃO DE CONTAS ++ */}
        <div className={styles.categoryBlock}>
          <h3 className={styles.categoryTitle}>👥 Gestão de Contas e Acessos</h3>
          <div className={styles.cardsGrid}>
            {accountActions.map(card => (
              <DashboardCard
                key={card.id}
                title={card.title}
                icon={card.icon}
                onClick={() => onNavigate(card.id)}
              />
            ))}
          </div>
        </div>

      </div>
    </ContentWrapper>
  );
};

export default Admin5Dashboard;