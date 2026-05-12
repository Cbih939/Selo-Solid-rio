// Arquivo: src/pages/admin1/Admin1Dashboard/Admin1Dashboard.jsx

import React from 'react';
import styles from './Admin1Dashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';

const Admin1Dashboard = ({ onNavigate, currentUser }) => {
  // Agrupamento lógico dos cartões para o Administrador Nível 1
  const actionGroups = [
    {
      groupTitle: "🏢 Gestão de Instituições (OSCs)",
      cards: [
        { id: 'create_ong', title: 'Cadastrar Nova OSC', icon: ICONS.ong },
        { id: 'list_ongs', title: 'Listar OSCs Ativas', icon: ICONS.list },
        { id: 'pending_proofs', title: 'Validar Provas Sociais', icon: ICONS.check },
      ]
    },
    {
      groupTitle: "👥 Monitorização e Relatórios",
      cards: [
        { id: 'list_users', title: 'Diretório de Beneficiários', icon: ICONS.list },
        { id: 'reports', title: 'Relatórios Globais', icon: ICONS.chart },
        // NOVO BOTÃO DE LOGS ADICIONADO AQUI
        { id: 'osc_logs', title: 'Relatório de Auditoria (Logs)', icon: ICONS.chart },
      ]
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Cabeçalho de Boas-Vindas */}
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>
            Olá, {currentUser?.name?.split(' ')[0] || 'Administrador'} 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Acesso rápido à gestão de instituições e análise de dados do Selo Cidadania.
          </p>
        </div>
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

export default Admin1Dashboard;