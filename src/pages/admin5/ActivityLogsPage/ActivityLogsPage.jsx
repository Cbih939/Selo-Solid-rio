// Arquivo: src/pages/admin5/ActivityLogsPage/ActivityLogsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import api from '../../../api/api';
import styles from './ActivityLogsPage.module.css';

// Função para formatar data e hora
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
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOng, setSelectedOng] = useState('all');
  const [logType, setLogType] = useState('all');

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Carregar lista de ONGs para o filtro
        const ongsRes = await api.get('/ongs');
        setOngs(ongsRes.data);

        // 2. Carregar logs (Por enquanto vamos simular a busca dos logs da API de histórico e auditoria)
        // Nota: Idealmente, o backend deve ter uma rota única tipo /api/logs/all
        // Aqui, para já, vamos consolidar o que temos: Auditoria de provas e Histórico financeiro.
        
        const [proofsRes, financeRes] = await Promise.all([
            api.get('/proofs/log/all'), // Reutilizamos a rota de auditoria global
            api.get('/reports')         // Reutilizamos a rota de relatórios que traz as redemptions
        ]);

        const formattedLogs = [];

        // Adicionar Logs de Provas Sociais
        if (Array.isArray(proofsRes.data)) {
            proofsRes.data.forEach(proof => {
                formattedLogs.push({
                    id: `proof-${proof.id}`,
                    timestamp: proof.evaluated_at || proof.created_at,
                    user_name: proof.evaluator_name || 'Sistema',
                    ong_name: proof.ong_name || 'N/A',
                    ong_id: proof.ong_id,
                    action: proof.status === 'approved' ? 'Aprovação de Prova' : 'Rejeição de Prova',
                    details: `Atividade: ${proof.activity_title} | Beneficiário: ${proof.sender_name} | Obs: ${proof.feedback_message || '-'}`,
                    type: 'proof_eval',
                    impact: proof.status === 'approved' ? `+${proof.seal_value} Selos` : 'Nenhum'
                });
            });
        }

        // Adicionar Logs de Resgates (Financeiro)
        if (financeRes.data && Array.isArray(financeRes.data.allRedemptions)) {
            financeRes.data.allRedemptions.forEach(red => {
                // Descobrir a ONG do utilizador que resgatou
                const userOng = financeRes.data.allUsers?.find(u => u.id === red.user_id)?.ong_name || 'N/A';
                const userOngId = financeRes.data.allUsers?.find(u => u.id === red.user_id)?.ong_id;

                formattedLogs.push({
                    id: `red-${red.id}`,
                    timestamp: red.redemption_date,
                    user_name: red.user_name, // Quem fez o resgate
                    ong_name: userOng,
                    ong_id: userOngId,
                    action: 'Resgate de Produto',
                    details: `Produto resgatado: ${red.prize_name}`,
                    type: 'redemption',
                    impact: `-${red.seals_redeemed} Selos`
                });
            });
        }

        // Ordenar do mais recente para o mais antigo
        formattedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(formattedLogs);

      } catch (error) {
        console.error("Erro ao carregar logs de sistema:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Aplicar Filtros
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filtro de ONG
      if (selectedOng !== 'all' && String(log.ong_id) !== String(selectedOng)) return false;
      
      // Filtro de Tipo de Ação
      if (logType !== 'all' && log.type !== logType) return false;

      // Filtro de Texto (Pesquisa)
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

  // Função para definir a cor da badge consoante o tipo de impacto
  const getImpactBadgeClass = (impact) => {
    if (impact.startsWith('+')) return styles.badgePositive;
    if (impact.startsWith('-')) return styles.badgeNegative;
    return styles.badgeNeutral;
  };

  return (
    <ContentWrapper title="Monitorização e Auditoria (Logs)">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Histórico de Ações do Sistema</h2>
        <p className={styles.introText}>
          Acompanhe em tempo real todas as operações realizadas pelos Coordenadores de OSCs e pelos Beneficiários. Este ecrã é vital para auditoria e segurança.
        </p>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchRow}>
          <div style={{ flex: 1.5 }}>
            <InputField 
              label="🔍 Pesquisar no Histórico" 
              placeholder="Ex: Nome do utilizador, atividade, produto..." 
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
            <SelectField label="Tipo de Operação" value={logType} onChange={(e) => setLogType(e.target.value)}>
              <option value="all">Todas as Operações</option>
              <option value="proof_eval">Avaliação de Provas</option>
              <option value="redemption">Resgates no Shopping</option>
            </SelectField>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>A compilar logs de auditoria do banco de dados...</p>
        </div>
      ) : (
        <div className={styles.logContainer}>
          <div className={styles.resultsCount}>
            A exibir <strong>{filteredLogs.length}</strong> registos de auditoria.
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Autor da Ação</th>
                  <th>Instituição (OSC)</th>
                  <th>Operação</th>
                  <th>Detalhes</th>
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.dateCell}>{formatDateTime(log.timestamp)}</td>
                    <td className={styles.authorCell}><strong>{log.user_name}</strong></td>
                    <td className={styles.ongCell}>{log.ong_name}</td>
                    <td className={styles.actionCell}>
                      <span className={styles.actionText}>{log.action}</span>
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