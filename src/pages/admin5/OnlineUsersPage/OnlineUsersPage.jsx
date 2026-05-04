// Arquivo: src/pages/admin5/OnlineUsersPage/OnlineUsersPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import api from '../../../api/api';
import styles from './OnlineUsersPage.module.css';

const OnlineUsersPage = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchOnlineUsers = async () => {
    try {
      const response = await api.get('/users/online');
      setOnlineUsers(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar usuários online", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Busca inicial
    fetchOnlineUsers();

    // Atualiza automaticamente a cada 30 segundos
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const translateRole = (role) => {
    switch (role) {
      case 'admin5': return 'Super Admin';
      case 'admin1': return 'Admin Nível 1';
      case 'ong': return 'Coordenador OSC';
      case 'user': return 'Beneficiário';
      default: return role;
    }
  };

  return (
    <ContentWrapper title="Monitor de Usuários Online">
      
      <div className={styles.headerBlock}>
        <div className={styles.titleArea}>
          <h2 className={styles.mainTitle}>Radar em Tempo Real</h2>
          <div className={styles.pulseIndicator}>
            <span className={styles.pulseDot}></span>
            <span className={styles.onlineCount}>{onlineUsers.length} Online Agora</span>
          </div>
        </div>
        <p className={styles.introText}>
          Monitorize os utilizadores que estão ativamente a usar o aplicativo. A lista atualiza-se automaticamente a cada 30 segundos.
        </p>
        <small className={styles.lastUpdate}>Última verificação: {lastUpdate.toLocaleTimeString('pt-BR')}</small>
      </div>

      {loading ? (
        <div className={styles.loadingMessage}>A rastrear conexões ativas...</div>
      ) : (
        <div className={styles.grid}>
          {onlineUsers.length > 0 ? (
            onlineUsers.map(user => (
              <div key={user.id} className={styles.userCard}>
                <div className={styles.avatarArea}>
                  <div className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
                  <div className={styles.onlineBadge}></div>
                </div>
                <div className={styles.userInfo}>
                  <h4 className={styles.userName}>{user.name}</h4>
                  <span className={styles.userRole}>{translateRole(user.role)}</span>
                  <span className={styles.userOng}>{user.ong_name || 'Sistema Global'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>Nenhum utilizador online neste momento.</div>
          )}
        </div>
      )}

    </ContentWrapper>
  );
};

export default OnlineUsersPage;