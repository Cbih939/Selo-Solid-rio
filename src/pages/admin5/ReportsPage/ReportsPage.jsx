import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import ReportSection from '../../../components/ui/ReportSection/ReportSection';
import SelectField from '../../../components/ui/SelectField/SelectField';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ReportsPage.module.css';
import { ICONS } from '../../../assets/icons/ICONS'; // Importe seus ícones

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [filteredOngs, setFilteredOngs] = useState([]);
  const [selectedOng, setSelectedOng] = useState('all');
  const [ongSearchTerm, setOngSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

  // Busca a lista inicial de ONGs
  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        setOngs(response.data);
        setFilteredOngs(response.data);
      } catch (error) {
        console.error("Erro ao buscar ONGs:", error);
      }
    };
    fetchOngs();
  }, []);

  // Filtra a lista de ONGs com base na pesquisa
  useEffect(() => {
    const lowercasedFilter = ongSearchTerm.toLowerCase();
    const filtered = ongs.filter(ong =>
      ong.fantasy_name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredOngs(filtered);
  }, [ongSearchTerm, ongs]);

  // Busca os dados do relatório quando a ONG selecionada muda
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const params = { ongId: selectedOng === 'all' ? undefined : selectedOng };
        const response = await api.get('/reports', { params });
        setReportData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios:", error);
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedOng]);

  // ### CORREÇÃO: Função para abrir o modal com dados e cabeçalhos específicos ###
  const handleViewDetails = (title, data, headers) => {
    setModalContent({
      title,
      data: Array.isArray(data) ? data : [],
      headers: headers || (data && data.length > 0 ? Object.keys(data[0]) : [])
    });
    setModalOpen(true);
  };

  // Funções de compartilhamento (lógica de exemplo)
  const handlePrint = () => window.print();
  const handleShare = (platform) => {
    const text = `Confira este relatório: ${modalContent.title}`;
    const url = window.location.href;
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url )}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      case 'drive':
        // A integração com o Google Drive é mais complexa e requer a API do Google.
        // Por enquanto, podemos apenas simular ou abrir um link genérico.
        alert('A integração com o Google Drive requer configuração adicional da API.');
        return;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
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
        // ### CORREÇÃO: Adicionado um wrapper com fundo cinza para cada seção ###
        <>
          <div className={styles.reportBlock}>
            <ReportSection title="Relatório de Selos">
              <div className={styles.sectionHeader}>
                <div className={styles.statCard} style={{ backgroundColor: '#e0f2fe' }}><p>Selos em Circulação</p><span>{reportData.sealsReport?.sealsInCirculation || 0}</span></div>
                <div className={styles.statCard} style={{ backgroundColor: '#fee2e2' }}><p>Selos Resgatados</p><span>{reportData.sealsReport?.redeemedCount || 0}</span></div>
              </div>
              <div className={styles.listsGrid}>
                {/* ### CORREÇÃO: Card de Beneficiários com mais selos ### */}
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Beneficiários com mais selos</h4>
                    <Button variant="link" onClick={() => handleViewDetails(
                      'Beneficiários com Mais Selos',
                      reportData.sealsReport?.allTopUsers, // Supondo que a API retorne a lista completa aqui
                      ['id', 'name', 'cpf', 'seal_balance', 'used_seals']
                    )}>Ver todos</Button>
                  </div>
                  <ul className={styles.list}>
                    {reportData.sealsReport?.topUsers?.slice(0, 5).map(user => (
                      <li key={user.id}><span>{user.name}</span><span className={styles.highlight}>{user.seal_balance} selos</span></li>
                    ))}
                  </ul>
                </div>
                {/* ### CORREÇÃO: Card de Últimos Resgates com detalhes ### */}
                <div className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <h4>Últimos Resgates</h4>
                    <Button variant="link" onClick={() => handleViewDetails(
                      'Histórico de Resgates',
                      reportData.sealsReport?.allRedemptions, // Supondo que a API retorne a lista completa aqui
                      ['user_id', 'user_name', 'user_cpf', 'redemption_date', 'seals_redeemed', 'remaining_balance']
                    )}>Ver todos</Button>
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
              </div>
            </ReportSection>
          </div>
        </>
      ) : (
        !loading && <p>Não foi possível carregar os dados do relatório ou não há dados para a seleção atual.</p>
      )}

      {/* ### CORREÇÃO: Modal genérico e com botões de compartilhamento ### */}
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
            <Button onClick={handlePrint}>Imprimir</Button>
            <Button onClick={() => handleShare('drive')}>Google Drive</Button>
            <Button onClick={() => handleShare('email')}>Email</Button>
            <Button onClick={() => handleShare('whatsapp')}>WhatsApp</Button>
          </div>
        </div>
      </Modal>
    </ContentWrapper>
  );
};

export default ReportsPage;
