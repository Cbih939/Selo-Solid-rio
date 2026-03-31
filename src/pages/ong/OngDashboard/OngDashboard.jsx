// Arquivo: src/pages/ong/OngDashboard/OngDashboard.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import api from '../../../api/api';
import styles from './OngDashboard.module.css';

const OngDashboard = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingProofs: 0,
    totalSeals: 0
  });
  const [loading, setLoading] = useState(true);

  // Busca algumas estatísticas rápidas para deixar a tela inicial rica
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const ongId = user?.ong_id || user?.id;
        
        // Chamadas simultâneas à API para poupar tempo
        const [usersRes, proofsRes, reportsRes] = await Promise.all([
          api.get(`/ongs/${ongId}/users`),
          api.get(`/proofs/pending/${ongId}`),
          api.get('/reports', { params: { ongId } })
        ]);

        setStats({
          totalUsers: usersRes.data.length || 0,
          pendingProofs: proofsRes.data.length || 0,
          totalSeals: reportsRes.data?.generalStats?.totalSealsInCirculation || 0
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Menu completo da OSC para a Grelha de Atalhos
  const quickActions = [
    { id: 'create_user', title: 'Cadastrar Beneficiário', icon: '👤+', desc: 'Inserir nova família e mapeamento' },
    { id: 'list_ong_users', title: 'Listar Beneficiários', icon: '📋', desc: 'Gerenciar dados e debitar selos' },
    { id: 'create_activity', title: 'Tipos de Prova', icon: '🎯', desc: 'Configurar catálogo de atividades' },
    { id: 'ong_reports', title: 'Relatórios', icon: '📊', desc: 'Métricas, PDF e auditorias' },
    { id: 'edit_ong_profile', title: 'Editar Info da OSC', icon: '🏢', desc: 'Atualizar dados da instituição' },
    { id: 'help', title: 'Ajuda e FAQ', icon: '❓', desc: 'Dúvidas sobre o Selo Cidadania' }
  ];

  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}/cadastro?ong=${user?.ong_id || user?.id}`;
    navigator.clipboard.writeText(inviteLink)
      .then(() => alert('✅ Link de convite copiado!\n\nCole no WhatsApp e envie para as famílias.'))
      .catch(() => alert('Erro ao copiar o link.'));
  };

  if (loading) {
    return (
      <ContentWrapper title="Painel da Instituição">
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>A preparar o seu painel...</p>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Painel da Instituição">
      <div className={styles.container}>
        
        {/* Cabeçalho */}
        <div className={styles.headerSection}>
            <div className={styles.welcomeText}>
                <h2 className={styles.greeting}>Olá, {user?.name || 'Coordenador'}! 👋</h2>
                <p className={styles.subtitle}>
                  Bem-vindo ao painel da sua OSC. Através das opções abaixo, faça a gestão das famílias cadastradas, valide provas e acompanhe o seu impacto na comunidade.
                </p>
            </div>
        </div>

        {/* Cards de Destaque (Estilo Top Cards) */}
        <div className={styles.topCardsGrid}>
          {/* Card 1: Provas Pendentes */}
          <div className={styles.balanceCard}>
            <div className={styles.cardIconBox} style={{ background: '#fef08a' }}>⏳</div>
            <div className={styles.balanceInfo}>
                <span className={styles.cardLabel}>Provas Pendentes</span>
                <h3 className={styles.balanceValue}>{stats.pendingProofs} <span className={styles.sealText}>Análises</span></h3>
            </div>
            <button className={styles.walletBtn} onClick={() => onNavigate('pending_proofs')}>
              Analisar Provas ➔
            </button>
          </div>
          
          {/* Card 2: Convite (Nova Ação) */}
          <div className={styles.actionCard}>
             <div className={styles.actionCardContent}>
                 <div className={styles.cardIconBoxAction}>🔗</div>
                 <div>
                    <h3 className={styles.actionTitle}>Convidar Famílias</h3>
                    <p className={styles.actionDesc}>Copie o link exclusivo e envie para as famílias se cadastrarem.</p>
                 </div>
             </div>
            <button className={styles.sendProofBtn} onClick={handleCopyInvite}>
              📋 Copiar Link de Convite
            </button>
          </div>
        </div>

        {/* Resumo Geral (Estilo Contact Section) */}
        <div className={styles.contactSection}>
          <div className={styles.contactHeader}>
            <h3>Resumo Geral da Instituição</h3>
            <p>Acompanhe os números totais de impacto gerado pela sua OSC até ao momento:</p>
          </div>
          
          <div className={styles.contactButtonsGrid}>
              <div className={styles.contactBtn} style={{ cursor: 'default' }}>
                <span className={styles.btnIcon}>👥</span> {stats.totalUsers} Famílias Cadastradas
              </div>
              <div className={styles.contactBtn} style={{ cursor: 'default' }}>
                <span className={styles.btnIcon}>🏅</span> {stats.totalSeals} Selos em Circulação
              </div>
          </div>
        </div>

        {/* Lista de Ações Rápidas (Estilo History Section) */}
        <div className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Acesso Rápido</h3>
          </div>

          <div className={styles.historyContent}>
            <div className={styles.proofsList}>
              {quickActions.map(action => (
                <div 
                  key={action.id} 
                  className={styles.proofListItem} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate(action.id)}
                >
                    <div className={styles.proofMainInfo}>
                        <h4 className={styles.proofTitle}>{action.icon} {action.title}</h4>
                        <span className={styles.proofDate}>
                            {action.desc}
                        </span>
                    </div>
                    <div className={`${styles.statusBadge} ${styles.statusPending}`}>
                        Acessar ➔
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </ContentWrapper>
  );
};

export default OngDashboard;