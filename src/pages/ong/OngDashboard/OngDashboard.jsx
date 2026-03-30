// Arquivo: src/pages/ong/OngDashboard/OngDashboard.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button'; // <-- Import adicionado
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
    { id: 'pending_proofs', title: 'Analisar Provas', icon: '✅', desc: 'Aprovar ou rejeitar envios' },
    { id: 'ong_reports', title: 'Relatórios', icon: '📊', desc: 'Métricas, PDF e auditorias' },
    { id: 'edit_ong_profile', title: 'Editar Info da OSC', icon: '🏢', desc: 'Atualizar dados da instituição' },
    { id: 'help', title: 'Ajuda e FAQ', icon: '❓', desc: 'Dúvidas sobre o Selo Cidadania' }
  ];

  return (
    <ContentWrapper title={`Olá, ${user?.name || 'Coordenador'}! 👋`}>
      <div className={styles.dashboardContainer}>
        
        <p className={styles.welcomeText}>
          Bem-vindo ao painel de controlo da sua OSC. Através das opções abaixo, você pode gerenciar as famílias cadastradas, validar provas sociais e acompanhar o impacto que a sua instituição está gerando na comunidade.
        </p>

        {/* ++ BLOCO DE CONVITE ADICIONADO AQUI ++ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.1rem' }}>🔗 Convide novas famílias</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>Copie e envie o link exclusivo da sua OSC para que os beneficiários façam o próprio cadastro pelo telemóvel.</p>
          </div>
          <Button 
            onClick={() => {
              const inviteLink = `${window.location.origin}/cadastro?ong=${user?.ong_id || user?.id}`;
              navigator.clipboard.writeText(inviteLink)
                .then(() => alert('✅ Link de convite copiado!\n\nCole no WhatsApp e envie para as famílias.'))
                .catch(() => alert('Erro ao copiar o link.'));
            }}
            style={{ backgroundColor: '#10b981', borderColor: '#10b981', whiteSpace: 'nowrap' }}
          >
            📋 Copiar Link de Convite
          </Button>
        </div>

        {/* Estatísticas */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <h3>{loading ? '...' : stats.totalUsers}</h3>
              <p>Famílias</p>
            </div>
          </div>
          <div className={styles.statCard} onClick={() => onNavigate('pending_proofs')} style={{cursor: 'pointer'}}>
            <div className={styles.statIcon} style={{ background: '#fef08a' }}>⏳</div>
            <div className={styles.statInfo}>
              <h3>{loading ? '...' : stats.pendingProofs}</h3>
              <p>Provas Pendentes</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#dcfce7' }}>🏅</div>
            <div className={styles.statInfo}>
              <h3>{loading ? '...' : stats.totalSeals}</h3>
              <p>Selos Ativos</p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas (O menu inteiro) */}
        <h3 className={styles.sectionTitle}>Acesso Rápido</h3>
        
        <div className={styles.actionsGrid}>
          {quickActions.map(action => (
            <div 
              key={action.id} 
              className={styles.actionCard} 
              onClick={() => onNavigate(action.id)}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </ContentWrapper>
  );
};

export default OngDashboard;