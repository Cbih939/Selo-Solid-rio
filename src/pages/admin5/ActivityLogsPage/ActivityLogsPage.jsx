// Arquivo: src/pages/admin5/ActivityLogsPage/ActivityLogsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import api from '../../../api/api';
import styles from './ActivityLogsPage.module.css';

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [ongs, setOngs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOng, setSelectedOng] = useState('all');
  const [logType, setLogType] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ongsRes, logsRes] = await Promise.all([
          api.get('/ongs'),
          api.get('/logs/unified') // Consome a nossa nova rota mágica
        ]);
        setOngs(ongsRes.data);
        setLogs(logsRes.data);
      } catch (error) {
        console.error("Erro ao carregar logs de sistema:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedOng !== 'all' && String(log.ong_id) !== String(selectedOng)) return false;
      if (logType !== 'all') {
          // Filtro customizado para identificar erros do sistema
          if (logType === 'errors' && log.status !== 'error') return false;
          if (logType !== 'errors' && log.type !== logType) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (log.user_name && log.user_name.toLowerCase().includes(term)) ||
            (log.details && log.details.toLowerCase().includes(term)) ||
            (log.action && log.action.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [logs, selectedOng, logType, searchTerm]);

  // Função para definir a cor da badge de impacto
  const getImpactBadgeClass = (impact) => {
    if (impact.startsWith('+')) return styles.badgePositive;
    if (impact.startsWith('-') && impact !== '-') return styles.badgeNegative;
    return styles.badgeNeutral;
  };

  // Função para destacar a linha inteira a vermelho se for um erro de sistema
  const getRowClass = (status) => {
      if (status === 'error') return styles.rowError;
      if (status === 'warning') return styles.rowWarning;
      return '';
  };

  return (
    <ContentWrapper title="Monitorização e Auditoria (Logs)">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Histórico Geral e Erros do Sistema</h2>
        <p className={styles.introText}>
          Acompanhe em tempo real o histórico financeiro, ações de utilizadores, avaliações de OSCs e tentativas de falha (erros do aplicativo).
        </p>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchRow}>
          <div style={{ flex: 1.5 }}>
            <InputField 
              label="🔍 Pesquisar no Histórico" 
              placeholder="Ex: Nome, erro, atividade..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="Filtrar por Instituição" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
              <option value="all">Todas as Instituições</option>
              {ongs.map(ong => <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>)}
            </SelectField>
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="Tipo de Registo" value={logType} onChange={(e) => setLogType(e.target.value)}>
              <option value="all">Todas as Movimentações</option>
              <option value="financial">Movimentações de Selos (Financeiro)</option>
              <option value="audit">Avaliação de Provas (OSC)</option>
              <option value="system">Ações de Utilizadores</option>
              <option value="errors">🚨 Mostrar Apenas Erros/Falhas</option>
            </SelectField>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>A sincronizar histórico e logs do banco de dados...</p>
        </div>
      ) : (
        <div className={styles.logContainer}>
          <div className={styles.resultsCount}>
            A exibir <strong>{filteredLogs.length}</strong> registos.
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Autor da Ação</th>
                  <th>Instituição (OSC)</th>
                  <th>Operação / Evento</th>
                  <th>Detalhes Técnicos</th>
                  <th>Impacto Financeiro</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log.id} className={getRowClass(log.status)}>
                    <td className={styles.dateCell}>{formatDateTime(log.timestamp)}</td>
                    <td className={styles.authorCell}><strong>{log.user_name}</strong></td>
                    <td className={styles.ongCell}>{log.ong_name}</td>
                    <td className={styles.actionCell}>
                      {log.status === 'error' && <span title="Falha/Erro">⚠️ </span>}
                      {log.action}
                    </td>
                    <td className={styles.detailsCell}>{log.details}</td>
                    <td className={styles.impactCell}>
                      <span className={`${styles.impactBadge} ${getImpactBadgeClass(log.impact)}`}>
                        {log.impact}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className={styles.emptyMessage}>
                      Nenhum registo encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </ContentWrapper>
  );
};

export default ActivityLogsPage;