// Arquivo: src/pages/admin5/Admin5Dashboard/Admin5Dashboard.jsx

import React, { useState, useEffect } from 'react';
import styles from './Admin5Dashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';
import MaintenanceControl from '../../../components/admin/MaintenanceControl';
import api from '../../../api/api';

const Admin5Dashboard = ({ onNavigate, currentUser }) => {
  const [stats, setStats] = useState({
    activeOngs: 0, totalUsers: 0, monthlyNewUsers: 0, distributedSeals: 0, redeemedSeals: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const actionGroups = [
    {
      groupTitle: "🏢 Gestão de Instituições (OSCs)",
      cards: [
        { id: 'create_ong', title: 'Cadastrar Nova OSC', icon: ICONS.ong },
        { id: 'list_ongs', title: 'Listar OSCs Ativas', icon: ICONS.chart },
        { id: 'create_activity', title: 'Catálogo de Atividades', icon: ICONS.chart },
        { id: 'admin_submit_proof', title: 'Envio Manual de Provas', icon: ICONS.check },
      ]
    },
    {
      groupTitle: "👥 Gestão de Beneficiários",
      cards: [
        { id: 'list_users', title: 'Beneficiários por OSC', icon: ICONS.ong },
        { id: 'list_all_users', title: 'Base Global de Usuários', icon: ICONS.chart },
        { id: 'online_users', title: 'Radar de Usuários Online', icon: ICONS.check }, // <-- AQUI ESTÁ O BOTÃO DO RADAR
      ]
    },
    {
      groupTitle: "🛍️ Shopping e Eventos",
      cards: [
        { id: 'manage_products', title: 'Shopping Cidadania', icon: ICONS.ong },
        { id: 'manage_events', title: 'Agendamentos/Eventos', icon: ICONS.chart },
      ]
    },
    {
      groupTitle: "⚙️ Administração e Sistema",
      cards: [
        { id: 'create_admin', title: 'Cadastrar Admin Nv.1', icon: ICONS.check },
        { id: 'list_admins', title: 'Listar Admins Nv.1', icon: ICONS.chart },
        { id: 'reports', title: 'Relatórios Globais', icon: ICONS.chart },
        { id: 'logs', title: 'Logs de Atividade', icon: ICONS.chart }, 
      ]
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>
            Olá, {currentUser?.name?.split(' ')[0] || 'Super Admin'} 👋
          </h1>
          <p className={styles.welcomeSubtitle}>Visão global e gestão completa do sistema.</p>
        </div>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Análise do Sistema em Tempo Real</h2>
        {loadingStats ? (
           <p className={styles.loadingText}>A sincronizar métricas...</p>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statBox} style={{ borderColor: '#bae6fd', backgroundColor: '#f0f9ff' }}>
              <span className={styles.statLabel}>OSCs Ativas</span>
              <strong className={styles.statNumber} style={{ color: '#0369a1' }}>{stats.activeOngs}</strong>
            </div>
            <div className={styles.statBox} style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
              <span className={styles.statLabel}>Total de Beneficiários</span>
              <strong className={styles.statNumber} style={{ color: '#15803d' }}>{stats.totalUsers}</strong>
            </div>
            <div className={styles.statBox} style={{ borderColor: '#fed7aa', backgroundColor: '#fff7ed' }}>
              <span className={styles.statLabel}>Selos em Circulação</span>
              <strong className={styles.statNumber} style={{ color: '#c2410c' }}>{stats.distributedSeals}</strong>
            </div>
            <div className={styles.statBox} style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
              <span className={styles.statLabel}>Selos Resgatados</span>
              <strong className={styles.statNumber} style={{ color: '#b91c1c' }}>{stats.redeemedSeals}</strong>
            </div>
          </div>
        )}
      </div>

      <div className={styles.maintenanceSection}>
        <div className={styles.maintenanceHeader}>
          <h3 className={styles.maintenanceTitle}>🚧 Controlo de Manutenção</h3>
        </div>
        <MaintenanceControl />
      </div>

      <div className={styles.groupsContainer}>
        {actionGroups.map((group, index) => (
          <div key={index} className={styles.sectionGroup}>
            <h2 className={styles.sectionTitle}>{group.groupTitle}</h2>
            <div className={styles.grid}>
              {group.cards.map(card => (
                <DashboardCard key={card.id} title={card.title} icon={card.icon} onClick={() => onNavigate(card.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin5Dashboard;