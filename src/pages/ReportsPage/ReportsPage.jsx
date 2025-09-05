// Arquivo: pages/ReportsPage/ReportsPage.jsx (Versão Final Unificada)

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

// Supondo que você tenha acesso ao usuário logado via props ou um hook de autenticação
const ReportsPage = ({ user }) => {
  const [reportData, setReportData] = useState(null);
  const [ongs, setOngs] = useState([]);
  const [filteredOngs, setFilteredOngs] = useState([]);
  
  // O ID da ONG a ser filtrado. Se for admin, começa com 'all'. Se for ONG, usa o ID da própria ONG.
  const [selectedOng, setSelectedOng] = useState(user.role === 'ong' ? user.ong_id : 'all');
  
  const [ongSearchTerm, setOngSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', data: [], headers: [] });

  // Admin busca a lista de todas as ONGs para o filtro
  useEffect(() => {
    if (user.role === 'admin5') { // Apenas o admin precisa buscar a lista de ONGs
      const fetchOngs = async () => {
        try {
          const response = await api.get('/ongs');
          setOngs(response.data);
          setFilteredOngs(response.data);
        } catch (error) { console.error("Erro ao buscar ONGs:", error); }
      };
      fetchOngs();
    }
  }, [user.role]);

  // Filtra a lista de ONGs quando o admin digita no campo de pesquisa
  useEffect(() => {
    if (user.role === 'admin5') {
      const lowercasedFilter = ongSearchTerm.toLowerCase();
      const filtered = ongs.filter(ong => ong.fantasy_name.toLowerCase().includes(lowercasedFilter));
      setFilteredOngs(filtered);
    }
  }, [ongSearchTerm, ongs, user.role]);

  // Busca os dados do relatório com base nos filtros
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // A API é chamada com o ID da ONG como parâmetro de query
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

  // Funções para o modal e geração de PDF (sem alterações)
  const handleViewDetails = (title, data, headers) => {
    setModalContent({ title, data: Array.isArray(data) ? data : [], headers });
    setModalOpen(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(modalContent.title, 14, 16);
    const tableColumn = modalContent.headers.map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const tableRows = modalContent.data.map(item => modalContent.headers.map(header => item[header] ?? ''));
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
    return <ContentWrapper title="Relatórios"><p>A carregar relatórios...</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Relatórios">
      {/* O filtro de ONGs só aparece para o admin */}
      {user.role === 'admin5' && (
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
      )}

      {/* O conteúdo do relatório é o mesmo, mas já estará filtrado para a ONG logada */}
      {reportData ? (
        <>
          {/* Seção de Relatório de Selos */}
          <div className={styles.reportBlock}>
            <ReportSection title="Relatório de Selos">
              {/* ... (código da seção de selos, sem alterações) ... */}
            </ReportSection>
          </div>

          {/* Seção de Beneficiários Cadastrados */}
          <div className={styles.reportBlock}>
            <ReportSection title="Beneficiários Cadastrados">
              {/* ... (código da seção de beneficiários, sem alterações) ... */}
            </ReportSection>
          </div>
        </>
      ) : (
        !loading && <p>Não foi possível carregar os dados do relatório.</p>
      )}

      {/* Modal (sem alterações) */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        {/* ... (código do modal, sem alterações) ... */}
      </Modal>
    </ContentWrapper>
  );
};

export default ReportsPage;
