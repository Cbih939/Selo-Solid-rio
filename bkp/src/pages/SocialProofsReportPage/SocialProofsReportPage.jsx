// Arquivo: pages/SocialProofsReportPage/SocialProofsReportPage.jsx (Versão Corrigida e Traduzida)

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './SocialProofsReportPage.module.css'; // Lembre-se de criar este arquivo de estilo

// ### ATUALIZAÇÃO: Dicionário de traduções para os cabeçalhos da tabela e do PDF ###
const headerTranslations = {
  id: 'ID da Prova',
  user_id: 'ID do Usuário',
  user_name: 'Nome do Beneficiário',
  user_cpf: 'CPF do Beneficiário',
  submission_date: 'Data de Envio',
  activity_description: 'Atividade Realizada',
  seals_earned: 'Selos Ganhos',
  status: 'Status',
  feedback_message: 'Feedback'
};

// Função auxiliar para traduzir
const translateHeader = (headerKey) => headerTranslations[headerKey] || headerKey;

// ### ATUALIZAÇÃO: Dicionário para traduzir os status ###
const statusTranslations = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado'
};

const translateStatus = (statusKey) => statusTranslations[statusKey] || statusKey;

const SocialProofsReportPage = ({ user }) => {
  const [proofs, setProofs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProofsReport = async () => {
      setLoading(true);
      try {
        const params = {
          // Filtra pela ONG do usuário logado, se aplicável
          ongId: user && user.role === 'ong' ? user.ong_id : undefined,
          search: searchTerm || undefined,
        };
        // A rota está correta, conforme o controller que você me mostrou
        const response = await api.get('/reports/social-proofs', { params });
        setProofs(response.data);
      } catch (error) {
        console.error("Erro ao buscar relatório de provas sociais:", error);
        setProofs([]); // Garante que 'proofs' seja um array em caso de erro
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchProofsReport();
    }, 300);

    return () => clearTimeout(debounceFetch);
  }, [searchTerm, user]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Provas Sociais", 14, 16);

    // ### ATUALIZAÇÃO: Geração de PDF a partir dos dados, não do HTML, para consistência ###
    const tableHeaders = ['user_name', 'user_cpf', 'activity_description', 'submission_date', 'status', 'seals_earned'];
    const tableColumn = tableHeaders.map(translateHeader);
    
    const tableRows = proofs.map(proof => [
      proof.user_name,
      proof.user_cpf,
      proof.activity_description,
      new Date(proof.submission_date).toLocaleDateString('pt-BR'),
      translateStatus(proof.status),
      proof.seals_earned
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 24
    });
    return doc;
  };

  const handlePrint = () => {
    const doc = generatePDF();
    if (doc) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } else {
      alert("Não há dados para imprimir.");
    }
  };

  return (
    <ContentWrapper title="Relatório de Provas Sociais">
      <div className={styles.filters}>
        <InputField
          label="Pesquisar"
          placeholder="Nome, CPF ou atividade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handlePrint} variant="secondary">Imprimir Relatório</Button>
      </div>

      {loading ? <p>A carregar relatório...</p> : (
        <div className={styles.tableContainer}>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                {/* ### ATUALIZAÇÃO: Cabeçalhos traduzidos e adicionada a coluna 'Atividade' ### */}
                <th>{translateHeader('user_name')}</th>
                <th>{translateHeader('user_cpf')}</th>
                <th>{translateHeader('activity_description')}</th>
                <th>{translateHeader('submission_date')}</th>
                <th>{translateHeader('status')}</th>
                <th>{translateHeader('seals_earned')}</th>
              </tr>
            </thead>
            <tbody>
              {proofs.length > 0 ? proofs.map(proof => (
                <tr key={proof.id}>
                  <td>{proof.user_name}</td>
                  <td>{proof.user_cpf}</td>
                  <td>{proof.activity_description}</td>
                  <td>{new Date(proof.submission_date).toLocaleDateString('pt-BR')}</td>
                  {/* ### ATUALIZAÇÃO: Status traduzido para melhor UX ### */}
                  <td>{translateStatus(proof.status)}</td>
                  <td>{proof.seals_earned}</td>
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
