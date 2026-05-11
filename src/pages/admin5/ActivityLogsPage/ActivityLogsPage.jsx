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
  
  // Estados de Filtro Principais
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOng, setSelectedOng] = useState('all');
  const [logType, setLogType] = useState('all');

  // Estados de Filtro (Datas e Selos)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sealAction, setSealAction] = useState('all');

  // Estados de Paginação
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
        setLogs(logsRes.data);
      } catch (error) {
        console.error("Erro ao carregar logs de sistema:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lógica de Filtragem Múltipla
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Filtro por Instituição
      if (selectedOng !== 'all' && String(log.ong_id) !== String(selectedOng)) return false;
      
      // 2. Filtro por Tipo de Log
      if (logType !== 'all') {
          if (logType === 'errors' && log.status !== 'error') return false;
          if (logType !== 'errors' && log.type !== logType) return false;
      }

      // 3. Filtro de Pesquisa em Texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (log.user_name && log.user_name.toLowerCase().includes(term)) ||
            (log.details && log.details.toLowerCase().includes(term)) ||
            (log.action && log.action.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // 4. Filtro por Intervalo de Datas
      if (startDate || endDate) {
        const logDate = new Date(log.timestamp);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0); // Começa à meia-noite
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Vai até ao final do dia
          if (logDate > end) return false;
        }
      }

      // 5. Filtro por Movimentação de Selos (Adições, Retiradas e Resgates)
      if (sealAction !== 'all') {
        const impactStr = String(log.impact || '-');
        
        if (sealAction === 'added' && !impactStr.startsWith('+')) return false;
        if (sealAction === 'removed' && (!impactStr.startsWith('-') || impactStr === '-')) return false;
        
        // NOVO: Lógica específica para identificar "Resgates"
        if (sealAction === 'redeemed') {
           const actionStr = String(log.action || '').toLowerCase();
           const detailsStr = String(log.details || '').toLowerCase();
           // Considera resgate se a ação/detalhe mencionar "resgate" ou se o tipo de log for categorizado assim
           const isRedemption = actionStr.includes('resgate') || detailsStr.includes('resgate') || log.type === 'redemption';
           if (!isRedemption) return false;
        }
      }

      return true;
    });
  }, [logs, selectedOng, logType, searchTerm, startDate, endDate, sealAction]);

  // Sempre que QUALQUER filtro mudar, voltamos para a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedOng, logType, startDate, endDate, sealAction]);

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Função para Gerar e Imprimir o PDF
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
              p { margin: 5px 0; font-size: 14px; color: #64748b; }
              .filter-info { background: #f8fafc; padding: 10px; border-radius: 5px; border: 1px solid #e2e8f0; font-size: 12px; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
              th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .error-row { color: #b91c1c; background-color: #fef2f2 !important; }
              .positive { color: #166534; font-weight: bold; }
              .negative { color: #b91c1c; font-weight: bold; }
              @media print {
                  @page { margin: 1cm; }
                  body { padding: 0; }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Relatório de Auditoria e Logs do Sistema</h1>
              <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="filter-info">
             <strong>Filtros Aplicados:</strong><br>
             Período: ${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'} | 
             Total de Registos Listados: <strong>${filteredLogs.length}</strong>
          </div>

          <table>
              <thead>
                  <tr>
                      <th>Data e Hora</th>
                      <th>Autor</th>
                      <th>Instituição (OSC)</th>
                      <th>Operação</th>
                      <th>Detalhes</th>
                      <th>Impacto</th>
                  </tr>
              </thead>
              <tbody>
                  ${filteredLogs.map(log => `
                      <tr class="${log.status === 'error' ? 'error-row' : ''}">
                          <td>${formatDateTime(log.timestamp)}</td>
                          <td>${log.user_name}</td>
                          <td>${log.ong_name}</td>
                          <td>${log.action}</td>
                          <td>${log.details}</td>
                          <td class="${String(log.impact).startsWith('+') ? 'positive' : String(log.impact).startsWith('-') && String(log.impact) !== '-' ? 'negative' : ''}">
                              ${log.impact}
                          </td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
          <script>
              window.onload = function() { window.print(); }
          </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getImpactBadgeClass = (impact) => {
    const impactStr = String(impact || '-');
    if (impactStr.startsWith('+')) return styles.badgePositive;
    if (impactStr.startsWith('-') && impactStr !== '-') return styles.badgeNegative;
    return styles.badgeNeutral;
  };

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
          Acompanhe em tempo real o histórico financeiro, ações de utilizadores, avaliações de OSCs e tentativas de falha.
        </p>
      </div>

      <div className={styles.filterSection}>
        {/* LINHA 1: Pesquisa e Instituição/Tipo */}
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
            <SelectField label="Instituição (OSC)" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
              <option value="all">Todas as Instituições</option>
              {ongs.map(ong => <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>)}
            </SelectField>
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="Tipo de Registo" value={logType} onChange={(e) => setLogType(e.target.value)}>
              <option value="all">Todas as Movimentações</option>
              <option value="financial">Movimentações de Selos</option>
              <option value="audit">Avaliação de Provas</option>
              <option value="system">Ações de Utilizadores</option>
              <option value="errors">🚨 Apenas Erros/Falhas</option>
            </SelectField>
          </div>
        </div>

        {/* LINHA 2: FILTROS DE DATAS E SELOS (AGORA COM RESGATE) */}
        <div className={styles.searchRow} style={{ marginTop: '15px' }}>
          <div className={styles.filterGroup}>
            <InputField 
              label="📅 Data Inicial" 
              type="date"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <InputField 
              label="📅 Data Final" 
              type="date"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <SelectField label="💰 Movimentação de Selos" value={sealAction} onChange={(e) => setSealAction(e.target.value)}>
              <option value="all">Ignorar (Todas)</option>
              <option value="added">📈 Apenas Adições (+)</option>
              <option value="removed">📉 Apenas Retiradas (-)</option>
              <option value="redeemed">🎁 Apenas Resgates de Selos</option>
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
          
          {/* Barra de Ferramentas: Contagem e Impressão */}
          <div className={styles.toolbar}>
            <div className={styles.resultsCount}>
              A exibir <strong>{filteredLogs.length}</strong> registos totais encontrados.
            </div>
            <button className={styles.printButton} onClick={handlePrintPDF} disabled={filteredLogs.length === 0}>
               📄 Imprimir / Salvar PDF
            </button>
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
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
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

          {/* Controlos de Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.pageButton} 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                &laquo; Anterior
              </button>
              <span className={styles.pageInfo}>
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
              </span>
              <button 
                className={styles.pageButton} 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima &raquo;
              </button>
            </div>
          )}

        </div>
      )}

    </ContentWrapper>
  );
};

export default ActivityLogsPage;