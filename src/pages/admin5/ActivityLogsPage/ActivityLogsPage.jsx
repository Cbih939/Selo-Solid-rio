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
  const [summary, setSummary] = useState({ pending_proofs: 0, pending_seals: 0 });
  const [ongs, setOngs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOng, setSelectedOng] = useState('all');
  const [logType, setLogType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sealAction, setSealAction] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ongsRes, logsRes] = await Promise.all([
          api.get('/ongs'),
          api.get('/logs/unified') 
        ]);
        setOngs(ongsRes.data);
        
        // Garante compatibilidade se o backend não tiver sido reiniciado ainda
        if (logsRes.data.logs) {
            setLogs(logsRes.data.logs);
            setSummary(logsRes.data.summary);
        } else {
            setLogs(logsRes.data);
        }
      } catch (error) {
        console.error("Erro ao carregar logs:", error);
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
          if (logType === 'errors' && log.status !== 'error') return false;
          if (logType !== 'errors' && log.type !== logType) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (log.author_name && log.author_name.toLowerCase().includes(term)) ||
            (log.target_user && log.target_user.toLowerCase().includes(term)) ||
            (log.details && log.details.toLowerCase().includes(term)) ||
            (log.action && log.action.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0); 
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); 
          if (logDate > end) return false;
        }
      }

      // NOVO FILTRO BLINDADO (Matemático)
      if (sealAction !== 'all') {
        const val = parseInt(log.impact);
        if (sealAction === 'added' && (isNaN(val) || val <= 0)) return false;
        if (sealAction === 'removed' && (isNaN(val) || val >= 0)) return false;
        if (sealAction === 'redeemed' && log.type !== 'redemption') return false;
      }

      return true;
    });
  }, [logs, selectedOng, logType, searchTerm, startDate, endDate, sealAction]);

  // Cálculos Inteligentes a partir do filtro atual
  const dynamicTotals = useMemo(() => {
    let added = 0;
    let removed = 0;
    filteredLogs.forEach(log => {
        const val = parseInt(log.impact);
        if (!isNaN(val)) {
            if (val > 0) added += val;
            if (val < 0) removed += Math.abs(val); // Converte para positivo para mostrar o total
        }
    });
    return { added, removed };
  }, [filteredLogs]);

  useEffect(() => setCurrentPage(1), [searchTerm, selectedOng, logType, startDate, endDate, sealAction]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <title>Relatório de Auditoria - Selo Cidadania</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-bottom: 20px; }
              h1 { margin: 0; color: #0f172a; font-size: 24px; }
              .filter-info { background: #f8fafc; padding: 10px; border-radius: 5px; border: 1px solid #e2e8f0; font-size: 12px; margin-bottom: 15px; }
              .stats-row { display: flex; gap: 20px; margin-bottom: 20px; }
              .stat-box { flex: 1; padding: 15px; border: 1px solid #cbd5e1; border-radius: 5px; text-align: center; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
              th { background-color: #f1f5f9; }
              .positive { color: #166534; font-weight: bold; }
              .negative { color: #b91c1c; font-weight: bold; }
              @media print { @page { margin: 1cm; } }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Relatório de Auditoria e Movimentações</h1>
              <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <div class="stats-row">
              <div class="stat-box" style="background:#f0fdf4;">Adicionados: +${dynamicTotals.added} Selos</div>
              <div class="stat-box" style="background:#fef2f2;">Retirados/Resgates: -${dynamicTotals.removed} Selos</div>
          </div>
          <table>
              <thead>
                  <tr>
                      <th>Data e Hora</th>
                      <th>Autor (Aprovador)</th>
                      <th>Beneficiário (Alvo)</th>
                      <th>Instituição</th>
                      <th>Operação</th>
                      <th>Impacto</th>
                  </tr>
              </thead>
              <tbody>
                  ${filteredLogs.map(log => `
                      <tr>
                          <td>${formatDateTime(log.timestamp)}</td>
                          <td>${log.author_name}</td>
                          <td>${log.target_user}</td>
                          <td>${log.ong_name || '-'}</td>
                          <td>${log.action} <br/><small>${log.details}</small></td>
                          <td class="${parseInt(log.impact) > 0 ? 'positive' : parseInt(log.impact) < 0 ? 'negative' : ''}">
                              ${parseInt(log.impact) > 0 ? '+' : ''}${log.impact !== '0' ? log.impact : '-'}
                          </td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getImpactBadgeClass = (impact) => {
    const val = parseInt(impact);
    if (val > 0) return styles.badgePositive;
    if (val < 0) return styles.badgeNegative;
    return styles.badgeNeutral;
  };

  return (
    <ContentWrapper title="Monitorização e Auditoria (Logs)">
      
      {/* NOVOS CARDS DE ESTATÍSTICA (Resumo do Filtro e Global) */}
      <div className={styles.summaryGrid}>
          <div className={styles.statCard} style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
              <h4>Total Adicionado (Filtro Atual)</h4>
              <p style={{ color: '#166534' }}>+{dynamicTotals.added}</p>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
              <h4>Total Retirado/Resgatado</h4>
              <p style={{ color: '#b91c1c' }}>-{dynamicTotals.removed}</p>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#fef08a', background: '#fefce8' }}>
              <h4>Provas em Análise (Global)</h4>
              <p style={{ color: '#a16207' }}>{summary.pending_proofs}</p>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#bae6fd', background: '#f0f9ff' }}>
              <h4>Selos Pendentes (Global)</h4>
              <p style={{ color: '#0369a1' }}>{summary.pending_seals}</p>
          </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchRow}>
          <div style={{ flex: 1.5 }}>
            <InputField label="🔍 Pesquisar" placeholder="Nome do Alvo, Autor, Ação..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="Instituição (OSC)" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
              <option value="all">Todas as Instituições</option>
              {ongs.map(ong => <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>)}
            </SelectField>
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="Tipo de Registo" value={logType} onChange={(e) => setLogType(e.target.value)}>
              <option value="all">Todas as Movimentações</option>
              <option value="financial">Movimentações Manuais</option>
              <option value="audit">Avaliação de Provas</option>
              <option value="system">Ações de Utilizadores</option>
              <option value="errors">🚨 Erros/Falhas</option>
            </SelectField>
          </div>
        </div>
        <div className={styles.searchRow} style={{ marginTop: '15px' }}>
          <div className={styles.filterGroup}>
            <InputField label="📅 Data Inicial" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className={styles.filterGroup}>
            <InputField label="📅 Data Final" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="💰 Filtro Matemático de Selos" value={sealAction} onChange={(e) => setSealAction(e.target.value)}>
              <option value="all">Ignorar (Todas)</option>
              <option value="added">📈 Apenas Entradas (+)</option>
              <option value="removed">📉 Apenas Saídas/Retiradas (-)</option>
              <option value="redeemed">🎁 Apenas Resgates (-)</option>
            </SelectField>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <p>A compilar inteligência de dados...</p>
        </div>
      ) : (
        <div className={styles.logContainer}>
          <div className={styles.toolbar}>
            <div className={styles.resultsCount}>
              A exibir <strong>{filteredLogs.length}</strong> registos.
            </div>
            <button className={styles.printButton} onClick={handlePrintPDF} disabled={filteredLogs.length === 0}>
               📄 Gerar Relatório PDF
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Autor da Ação (Quem Aprovou/Retirou)</th>
                  <th>Beneficiário Afetado (Alvo)</th>
                  <th>Instituição</th>
                  <th>Operação e Detalhes</th>
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
                  <tr key={log.id} className={log.status === 'error' ? styles.rowError : ''}>
                    <td className={styles.dateCell}>{formatDateTime(log.timestamp)}</td>
                    <td className={styles.authorCell}><strong>{log.author_name}</strong></td>
                    <td className={styles.authorCell}>{log.target_user}</td>
                    <td className={styles.ongCell}>{log.ong_name || '-'}</td>
                    <td className={styles.actionCell}>
                      <strong>{log.action}</strong><br/>
                      <small style={{ color: '#64748b' }}>{log.details}</small>
                    </td>
                    <td className={styles.impactCell}>
                      <span className={`${styles.impactBadge} ${getImpactBadgeClass(log.impact)}`}>
                        {parseInt(log.impact) > 0 ? '+' : ''}{log.impact !== '0' ? log.impact : '-'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className={styles.emptyMessage}>Nenhum registo encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageButton} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>&laquo; Anterior</button>
              <span className={styles.pageInfo}>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong></span>
              <button className={styles.pageButton} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Próxima &raquo;</button>
            </div>
          )}
        </div>
      )}
    </ContentWrapper>
  );
};

export default ActivityLogsPage;