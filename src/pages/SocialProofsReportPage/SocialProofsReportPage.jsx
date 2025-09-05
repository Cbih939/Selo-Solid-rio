// Arquivo: pages/SocialProofsReportPage/SocialProofsReportPage.jsx (NOVO)

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './SocialProofsReportPage.module.css'; // Crie este arquivo de estilo

const SocialProofsReportPage = ({ user }) => {
  const [proofs, setProofs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProofsReport = async () => {
      setLoading(true);
      try {
        const params = {
          // Se for uma ONG, filtra automaticamente. Se for admin, pode pesquisar.
          ongId: user.role === 'ong' ? user.ong_id : undefined,
          search: searchTerm || undefined,
        };
        // Precisaremos criar esta nova rota na API
        const response = await api.get('/reports/social-proofs', { params });
        setProofs(response.data);
      } catch (error) {
        console.error("Erro ao buscar relatório de provas sociais:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchProofsReport();
    }, 300);

    return () => clearTimeout(debounceFetch);
  }, [searchTerm, user]);

  const handlePrint = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Provas Sociais", 14, 16);
    autoTable(doc, { html: '#proofs-report-table', startY: 24 });
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  // A função de compartilhar seria similar à da outra página de relatórios

  return (
    <ContentWrapper title="Relatório de Provas Sociais">
      <div className={styles.filters}>
        <InputField
          label="Pesquisar Beneficiário"
          placeholder="Nome ou CPF do usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handlePrint} variant="secondary">Imprimir Relatório</Button>
      </div>

      {loading ? <p>A carregar relatório...</p> : (
        <div className={styles.tableContainer}>
          <table id="proofs-report-table" className={styles.reportTable}>
            <thead>
              <tr>
                <th>ID Usuário</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Status da Prova</th>
                <th>Data de Envio</th>
                <th>Selos Ganhos</th>
              </tr>
            </thead>
            <tbody>
              {proofs.length > 0 ? proofs.map(proof => (
                <tr key={proof.id}>
                  <td>{proof.user_id}</td>
                  <td>{proof.user_name}</td>
                  <td>{proof.user_cpf}</td>
                  <td>{proof.status}</td>
                  <td>{new Date(proof.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>{proof.status === 'approved' ? proof.seal_value : 0}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">Nenhuma prova social encontrada para os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </ContentWrapper>
  );
};

export default SocialProofsReportPage;
