import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
  // =====================================================================
  // CORREÇÃO: Declarar o estado 'reportData' que estava faltando.
  // O valor inicial é null para que possamos mostrar uma mensagem de "carregando"
  // ou "sem dados" de forma mais eficaz.
  // =====================================================================
  const [reportData, setReportData] = useState(null);

  // Seus outros estados (todos corretos)
  const [ongs, setOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [] });

  // Este hook busca a lista de ONGs para preencher o filtro (correto)
  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        setOngs(response.data);
      } catch (error) {
        console.error("Erro ao buscar ONGs:", error);
      }
    };
    fetchOngs();
  }, []);

  // Este hook busca os dados do relatório quando o filtro de ONG muda (correto)
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = { ongId: selectedOng === 'all' ? undefined : selectedOng };
        const response = await api.get('/reports', { params });
        // Agora a função setReportData existe e pode ser chamada
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios:", error);
        setReportData(null); // Limpa dados antigos em caso de erro
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedOng]);

  const handleViewDetails = (title, data) => {
    setModalContent({ title, data: data || [] }); // Garante que 'data' nunca seja undefined
    setModalOpen(true);
  };

  const handlePrint = (title, data) => {
    // Constrói os cabeçalhos da tabela a partir das chaves do primeiro item
    const headers = data.length > 0 ? Object.keys(data[0]).map(key => `<th>${key.replace(/_/g, ' ').toUpperCase()}</th>`).join('') : '';
    let tableContent = data.map(item => `<tr><td>${Object.values(item).join('</td><td>')}</td></tr>`).join('');
    
    let printContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${tableContent}</tbody>
          </table>
        </body>
      </html>`;
      
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Mensagem de carregamento aprimorada
  if (loading) {
    return <ContentWrapper title="Relatórios"><p>A carregar relatórios...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Relatórios">
      <div className={styles.filters}>
        <SelectField label="Filtrar por ONG" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
          <option value="all">Todas as ONGs</option>
          {ongs.map(ong => (
            <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>
          ))}
        </SelectField>
      </div>

      {/* 
        Verificação robusta: só renderiza o conteúdo se 'reportData' não for nulo 
        e se as sub-propriedades necessárias existirem.
      */}
      {reportData && reportData.sealsReport && reportData.usersReport ? (
        <>
          <ReportSection title="Relatório de Selos">
            <div className={styles.sectionHeader}>
              <div className={styles.statCard} style={{backgroundColor: '#fef9c3'}}><p>Selos em Circulação</p><span>{reportData.sealsReport.sealsInCirculation}</span></div>
              <div className={styles.statCard} style={{backgroundColor: '#fee2e2'}}><p>Selos Resgatados</p><span>{reportData.sealsReport.redeemedCount}</span></div>
              <InputField label="Data de Início" type="date" />
              <InputField label="Data de Fim" type="date" />
            </div>
            <div className={styles.listsGrid}>
              <div>
                <h4>Beneficiários com mais selos <button className={styles.detailsButton} onClick={() => handleViewDetails('Beneficiários com mais selos', reportData.sealsReport.topUsers)}>Ver todos</button></h4>
                <ul className={styles.list}>
                  {reportData.sealsReport.topUsers.map(user => (
                    <li key={user.name}><span>{user.name}</span><span>{user.seal_balance} selos</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Últimos Resgates <button className={styles.detailsButton} onClick={() => handleViewDetails('Últimos Resgates', reportData.sealsReport.latestRedemptions)}>Ver todos</button></h4>
                <ul className={styles.list}>
                  {reportData.sealsReport.latestRedemptions.map(item => (
                     <li key={item.user_name + item.prize_name}>
                       <span>{item.user_name} resgatou <strong>{item.prize_name}</strong></span>
                       <span className={styles.date}>{new Date(item.redemption_date).toLocaleDateString('pt-BR')}</span>
                     </li>
                  ))}
                </ul>
              </div>
            </div>
          </ReportSection>

          <ReportSection title="Beneficiários Cadastrados">
             <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{backgroundColor: '#dbeafe'}}><p>Total de Beneficiários</p><span>{reportData.usersReport.totalUsers}</span></div>
                <InputField label="Filtrar por nome" placeholder="Nome do Beneficiário..." />
             </div>
          </ReportSection>
        </>
      ) : (
        // Mensagem para quando não há dados a serem exibidos
        !loading && <p>Não foi possível carregar os dados do relatório ou não há dados para a seleção atual.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <table>
            {/* Adiciona um cabeçalho à tabela do modal para melhor contexto */}
            <thead>
              {modalContent.data.length > 0 && (
                <tr>
                  {Object.keys(modalContent.data[0]).map(key => <th key={key}>{key.replace(/_/g, ' ')}</th>)}
                </tr>
              )}
            </thead>
            <tbody>
              {modalContent.data.map((item, index) => (
                <tr key={index}>
                  {Object.values(item).map((val, i) => <td key={`${index}-${i}`}>{String(val)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.printButtonContainer}>
            <Button variant="secondary" onClick={() => handlePrint(modalContent.title, modalContent.data)}>Imprimir</Button>
          </div>
        </div>
      </Modal>
    </ContentWrapper>
  );
};

export default ReportsPage;
