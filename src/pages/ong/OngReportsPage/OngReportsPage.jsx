// Arquivo: OngReportsPage.jsx (Versão Final Corrigida e Traduzida)

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './OngReportsPage.module.css';

// ### ATUALIZAÇÃO 1: Dicionário de traduções para os cabeçalhos ###
const headerTranslations = {
  id: 'ID',
  name: 'Nome',
  cpf: 'CPF',
  seal_balance: 'Saldo de Selos',
  used_seals: 'Selos Usados',
  user_id: 'ID do Usuário',
  user_name: 'Nome do Usuário',
  user_cpf: 'CPF do Usuário',
  redemption_date: 'Data do Resgate',
  prize_name: 'Prêmio Resgatado',
  seals_redeemed: 'Selos Resgatados',
  remaining_balance: 'Saldo Restante',
  dependents_count: 'Dependentes'
};

// Função auxiliar para traduzir os cabeçalhos
const translateHeader = (headerKey) => headerTranslations[headerKey] || headerKey;

const OngReportsPage = ({ user }) => {
  const [reportData, setReportData] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

  useEffect(() => {
    if (!user || !user.ong_id) {
      setLoading(false);
      return;
    }
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // ### ATUALIZAÇÃO 2: Corrigido o nome do parâmetro para 'search' para corresponder ao backend ###
        const params = {
          ongId: user.ong_id,
          search: userSearchTerm || undefined
        };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios da ONG:", error);
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };
    const debounceFetch = setTimeout(() => {
        fetchReportData();
    }, 300);
    return () => clearTimeout(debounceFetch);
  }, [user, userSearchTerm]);

  const handleViewDetails = (title, data, headers) => {
    setModalContent({ title, data: Array.isArray(data) ? data : [], headers });
    setModalOpen(true);
  };

  const generatePDF = () => {
    if (!modalContent.data || modalContent.data.length === 0) return null;
    const doc = new jsPDF();
    doc.text(modalContent.title, 14, 16);
    
    // ### ATUALIZAÇÃO 3: Usando o dicionário para traduzir os cabeçalhos do PDF ###
    const tableColumn = modalContent.headers.map(translateHeader);
    const tableRows = modalContent.data.map(item => modalContent.headers.map(header => {
        if (header === 'redemption_date') {
            return new Date(item[header]).toLocaleString('pt-BR');
        }
        return item[header] ?? '';
    }));
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 24 });
    return doc;
  };

  const handlePrint = () => {
    const doc = generatePDF();
    if (doc) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  const handleShare = async () => {
    const doc = generatePDF();
    if (!doc) return;
    const pdfFileName = `${modalContent.title.replace(/ /g, '_')}.pdf`;
    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      const shareData = { title: modalContent.title, text: `Confira o relatório: ${modalContent.title}`, files: [pdfFile] };
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        doc.save(pdfFileName);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      doc.save(pdfFileName);
    }
  };

  if (loading) {
    return <ContentWrapper title="Meus Relatórios"><p>A carregar relatórios...</p></ContentWrapper>;
  }

  // ### ATUALIZAÇÃO 4: Simplificado o acesso aos dados para corresponder à API ###
  const data = reportData;

  return (
    <ContentWrapper title="Meus Relatórios">
      {data ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title="Estatísticas de Selos">
              <div className={styles.grid}>
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}>
                  <p>Selos em Circulação</p>
                  <span>{data.generalStats?.totalSealsInCirculation || 0}</span>
                </div>
                
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}>
                  <p>Selos Resgatados</p>
                  <span>{data.generalStats?.totalSealsRedeemed || 0}</span>
                </div>

                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Beneficiários com mais selos</h4>
                    <Button variant="primary" onClick={() => handleViewDetails('Beneficiários com Mais Selos', data.topUsers, ['id', 'name', 'cpf', 'seal_balance', 'used_seals'])}>Ver todos</Button>
                  </div>
                  <ul className={styles.list}>
                    {data.topUsers?.map(user => (
                      <li key={user.id}><span>{user.name}</span><span className={styles.highlight}>{user.seal_balance} selos</span></li>
                    ))}
                  </ul>
                </div>

                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Últimos Resgates</h4>
                    <Button variant="primary" onClick={() => handleViewDetails('Histórico de Resgates', data.allRedemptions, ['user_id', 'user_name', 'user_cpf', 'redemption_date', 'prize_name', 'seals_redeemed', 'remaining_balance'])}>Ver todos</Button>
                  </div>
                  <ul className={styles.list}>
                    {data.latestRedemptions?.map(item => (
                      <li key={item.id} className={styles.redemptionItem}>
                        <span><strong>{item.user_name}</strong> resgatou <strong>{item.prize_name}</strong></span>
                        <span className={styles.date}>{new Date(item.redemption_date).toLocaleString('pt-BR')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ReportSection>
          </div>

          <div className={styles.reportBlock}>
            <ReportSection title="Beneficiários Cadastrados">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#dbeafe' }}>
                  <p>Total de Beneficiários</p>
                  <span>{data.generalStats?.totalUsers || 0}</span>
                </div>
                <InputField
                  label="Pesquisar Beneficiário"
                  placeholder="Nome ou CPF do beneficiário..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      {/* ### ATUALIZAÇÃO 5: Cabeçalhos da tabela principal traduzidos ### */}
                      <th>{translateHeader('id')}</th>
                      <th>{translateHeader('name')}</th>
                      <th>{translateHeader('cpf')}</th>
                      <th>{translateHeader('seal_balance')}</th>
                      <th>{translateHeader('dependents_count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.allUsers?.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.cpf}</td>
                        <td>{user.seal_balance}</td>
                        <td>{user.dependents_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          </div>
        </>
      ) : (
        <p>Não foi possível carregar as estatísticas.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <div className={styles.tableContainer}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  {/* ### ATUALIZAÇÃO 6: Cabeçalhos do modal traduzidos ### */}
                  {modalContent.headers.map(key => <th key={key}>{translateHeader(key)}</th>)}
                </tr>
              </thead>
              <tbody>
                {modalContent.data.map((item, index) => (
                  <tr key={index}>
                    {modalContent.headers.map(header => <td key={`${index}-${header}`}>
                      {header === 'redemption_date' ? new Date(item[header]).toLocaleString('pt-BR') : item[header]}
                    </td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.shareButtons}>
            <Button variant="secondary" onClick={handlePrint}>Imprimir</Button>
            <Button variant="primary" onClick={handleShare}>Compartilhar</Button>
          </div>
        </div>
      </Modal>
    </ContentWrapper>
  );
};

export default OngReportsPage;
