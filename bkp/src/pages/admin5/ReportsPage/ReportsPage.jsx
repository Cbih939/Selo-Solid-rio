import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ReportsPage.module.css';

// ### ATUALIZAÇÃO: Dicionário de traduções para os cabeçalhos ###
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
  seals_redeemed: 'Selos Resgatados',
  remaining_balance: 'Saldo Restante',
  dependents_count: 'Dependentes'
};

// Função auxiliar para traduzir os cabeçalhos
const translateHeader = (headerKey) => headerTranslations[headerKey] || headerKey;


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
        // ### ATUALIZAÇÃO: Corrigido o nome do parâmetro para 'search' para corresponder ao backend ###
        const response = await api.get('/reports', { params: { ongId: params.ongId, search: params.userSearch } });
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

  const generatePDF = () => {
    if (!modalContent.data || modalContent.data.length === 0) {
      alert("Não há dados para gerar o PDF.");
      return null;
    }
    const doc = new jsPDF();
    doc.text(modalContent.title, 14, 16);
    
    // ### ATUALIZAÇÃO: Usando o dicionário para traduzir os cabeçalhos do PDF ###
    const tableColumn = modalContent.headers.map(translateHeader);
    const tableRows = modalContent.data.map(item => modalContent.headers.map(header => {
        // Formata a data se o campo for de data
        if (header === 'redemption_date' || header === 'submission_date') {
            return new Date(item[header]).toLocaleString('pt-BR');
        }
        return item[header] ?? '';
    }));
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 24,
    });
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

  // ### ATUALIZAÇÃO: Ajustado para usar os dados corretos da API (removido 'sealsReport' e 'usersReport') ###
  const data = reportData;

  return (
    <ContentWrapper title="Relatórios">
      <div className={styles.filters}>
        <InputField
          label="Pesquisar OSC"
          placeholder="Digite o nome da OSC..."
          value={ongSearchTerm}
          onChange={(e) => setOngSearchTerm(e.target.value)}
        />
        <SelectField label="Filtrar por OSC" value={selectedOng} onChange={(e) => setSelectedOng(e.target.value)}>
          <option value="all">Todas as OSCs</option>
          {filteredOngs.map(ong => (
            <option key={ong.id} value={ong.id}>{ong.fantasy_name}</option>
          ))}
        </SelectField>
      </div>

      {data ? (
        <>
          <div className={styles.reportBlock}>
            <ReportSection title="Estatísticas Gerais">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}><p>Total de Beneficiários</p><span>{data.generalStats?.totalUsers || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#d1fae5' }}><p>Selos em Circulação</p><span>{data.generalStats?.totalSealsInCirculation || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}><p>Selos Resgatados</p><span>{data.generalStats?.totalSealsRedeemed || 0}</span></div>
              </div>
              <div className={styles.listsGrid}>
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Beneficiários com mais selos</h4>
                    <Button 
                      variant="primary" 
                      onClick={() => handleViewDetails(
                        'Beneficiários com Mais Selos',
                        data.topUsers, // Usando o array completo para o modal
                        ['id', 'name', 'cpf', 'seal_balance', 'used_seals']
                      )}
                    >
                      Ver todos
                    </Button>
                  </div>
                  <ul className={styles.list}>
                    {data.topUsers?.slice(0, 5).map(user => (
                      <li key={user.id}><span>{user.name}</span><span className={styles.highlight}>{user.seal_balance} selos</span></li>
                    ))}
                  </ul>
                </div>
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Últimos Resgates</h4>
                    <Button 
                      variant="primary" 
                      onClick={() => handleViewDetails(
                        'Histórico de Resgates',
                        data.allRedemptions, // Usando o array completo para o modal
                        ['user_id', 'user_name', 'user_cpf', 'redemption_date', 'seals_redeemed', 'remaining_balance']
                      )}
                    >
                      Ver todos
                    </Button>
                  </div>
                  <ul className={styles.list}>
                    {data.latestRedemptions?.slice(0, 5).map(item => (
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
                      {/* ### ATUALIZAÇÃO: Cabeçalhos da tabela principal traduzidos ### */}
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
        !loading && <p>Não foi possível carregar os dados do relatório ou não há dados para a seleção atual.</p>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={styles.modalContent}>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  {/* ### ATUALIZAÇÃO: Cabeçalhos do modal traduzidos ### */}
                  {modalContent.headers.map(key => <th key={key}>{translateHeader(key)}</th>)}
                </tr>
              </thead>
              <tbody>
                {modalContent.data.map((item, index) => (
                  <tr key={index}>
                    {modalContent.headers.map(header => (
                      <td key={`${index}-${header}`}>
                        {/* ### ATUALIZAÇÃO: Formata a data diretamente na célula ### */}
                        {header === 'redemption_date' || header === 'submission_date'
                          ? new Date(item[header]).toLocaleString('pt-BR')
                          : item[header]}
                      </td>
                    ))}
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

export default ReportsPage;
