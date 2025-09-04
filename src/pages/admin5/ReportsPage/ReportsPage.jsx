import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button'; // Certifique-se que seu componente Button está sendo importado
import api from '../../../api/api';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [filteredOngs, setFilteredOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('all');
  const [ongSearchTerm, setOngSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        setOngs(response.data);
        setFilteredOngs(response.data);
      } catch (error) { console.error("Erro ao buscar ONGs:", error); }
    };
    fetchOngs();
  }, []);

  useEffect(() => {
    const lowercasedFilter = ongSearchTerm.toLowerCase();
    const filtered = ongs.filter(ong => ong.fantasy_name.toLowerCase().includes(lowercasedFilter));
    setFilteredOngs(filtered);
  }, [ongSearchTerm, ongs]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = {
          ongId: selectedOng === 'all' ? undefined : selectedOng,
          userSearch: userSearchTerm || undefined
        };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios:", error);
        setReportData(null);
      } finally { setLoading(false); }
    };
    
    const debounceFetch = setTimeout(() => {
        fetchReportData();
    }, 300);

    return () => clearTimeout(debounceFetch);
  }, [selectedOng, userSearchTerm]);

  const handleViewDetails = (title, data, headers) => {
    setModalContent({
      title,
      data: Array.isArray(data) ? data : [],
      headers: headers || (data && data.length > 0 ? Object.keys(data[0]) : [])
    });
    setModalOpen(true);
  };

  const generateAndSharePDF = async () => {
    if (!modalContent.data || modalContent.data.length === 0) {
      alert("Não há dados para gerar o PDF.");
      return;
    }

    const doc = new jsPDF();
    doc.text(modalContent.title, 14, 16);
    
    const tableColumn = modalContent.headers.map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const tableRows = modalContent.data.map(item => modalContent.headers.map(header => item[header] ?? ''));

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 24,
    });

    const pdfFileName = `${modalContent.title.replace(/ /g, '_')}.pdf`;

    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      
      const shareData = {
        title: modalContent.title,
        text: `Confira o relatório: ${modalContent.title}`,
        files: [pdfFile],
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        console.log("Navegador não suporta compartilhamento de arquivos, iniciando download.");
        doc.save(pdfFileName);
      }
    } catch (error) {
      console.error('Erro ao compartilhar ou compartilhamento cancelado:', error);
      alert("Ocorreu um erro ao tentar compartilhar. O download do PDF será iniciado.");
      doc.save(pdfFileName);
    }
  };

  if (loading) {
    return <ContentWrapper title="Relatórios"><p>A carregar relatórios...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Relatórios">
      <div className={styles.filters}>
        <InputField
          label="Pesquisar ONG"
          placeholder="Digite o nome da ONG..."
          value={ongSearchTerm}
          onChange={(e) => setOngSearchTerm(e.target.value)}
        />
        <SelectField label="Filtrar por ONG" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
          <option value="all">Todas as ONGs</option>
          {filteredOngs.map(ong => (
            <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>
          ))}
        </SelectField>
      </div>

      {reportData ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title="Relatório de Selos">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}><p>Selos em Circulação</p><span>{reportData.sealsReport?.sealsInCirculation || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}><p>Selos Resgatados</p><span>{reportData.sealsReport?.redeemedCount || 0}</span></div>
              </div>
              <div className={styles.listsGrid}>
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Beneficiários com mais selos</h4>
                    {/* ### CORREÇÃO: Usando o componente Button com a variant correta ### */}
                    <Button 
                      variant="primary" 
                      onClick={() => handleViewDetails(
                        'Beneficiários com Mais Selos',
                        reportData.sealsReport?.allTopUsers,
                        ['id', 'name', 'cpf', 'seal_balance', 'used_seals']
                      )}
                    >
                      Ver todos
                    </Button>
                  </div>
                  <ul className={styles.list}>
                    {reportData.sealsReport?.topUsers?.slice(0, 5).map(user => (
                      <li key={user.id}><span>{user.name}</span><span className={styles.highlight}>{user.seal_balance} selos</span></li>
                    ))}
                  </ul>
                </div>
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Últimos Resgates</h4>
                    {/* ### CORREÇÃO: Usando o componente Button com a variant correta ### */}
                    <Button 
                      variant="primary" 
                      onClick={() => handleViewDetails(
                        'Histórico de Resgates',
                        reportData.sealsReport?.allRedemptions,
                        ['user_id', 'user_name', 'user_cpf', 'redemption_date', 'seals_redeemed', 'remaining_balance']
                      )}
                    >
                      Ver todos
                    </Button>
                  </div>
                  <ul className={styles.list}>
                    {reportData.sealsReport?.latestRedemptions?.slice(0, 5).map(item => (
                      <li key={item.id} className={styles.redemptionItem}>
                        <div className={styles.redemptionInfo}>
                          <span><strong>{item.user_name}</strong> (CPF: {item.user_cpf})</span>
                          <span className={styles.date}>{new Date(item.redemption_date).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className={styles.redemptionValues}>
                          <span>Resgatou: <strong className={styles.highlightRed}>-{item.seals_redeemed}</strong></span>
                          <span>Saldo: <strong>{item.remaining_balance}</strong></span>
                        </div>
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
                <div className={styles.statCard} style={{ backgroundColor: '#dbeafe' }}><p>Total de Beneficiários</p><span>{reportData.usersReport?.totalUsers || 0}</span></div>
                <InputField
                  label="Pesquisar Beneficiário"
                  placeholder="Nome ou CPF do beneficiário..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.tableContainer}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Selos em Circulação</th>
                      <th>Dependentes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.usersReport?.usersList?.map(user => (
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
        !loading && <p>Não foi possível carregar os dados do relatório ou não há dados para a seleção atual.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  {modalContent.headers.map(key => <th key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>)}
                </tr>
              </thead>
              <tbody>
                {modalContent.data.map((item, index) => (
                  <tr key={index}>
                    {modalContent.headers.map(header => <td key={`${index}-${header}`}>{item[header]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.shareButtons}>
            <Button variant="primary" onClick={generateAndSharePDF}>Compartilhar PDF</Button>
          </div>
        </div>
      </Modal>
    </ContentWrapper>
  );
};

export default ReportsPage;
