import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './OngDetailsPage.module.css';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';

// Recebe 'ongId' e 'onNavigate' como props
const OngDetailsPage = ({ ongId, onNavigate }) => {
  const [ong, setOng] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOngDetails = async () => {
      if (!ongId) return;
      setLoading(true);
      try {
        // Busca os dados completos da ONG específica
        const response = await api.get(`/ongs/${ongId}`);
        setOng(response.data);
      } catch (error) {
        console.error("Erro ao buscar detalhes da ONG:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOngDetails();
  }, [ongId]);

  if (loading) {
    return <ContentWrapper title="Detalhes da ONG"><p>A carregar...</p></ContentWrapper>;
  }

  if (!ong) {
    return <ContentWrapper title="Erro"><p>Não foi possível carregar os dados da ONG.</p></ContentWrapper>;
  }

  // Função para construir a URL completa do documento
  const getDocumentUrl = (filePath) => {
    // Se a URL da API já estiver configurada no 'api.js', o Axios a usará.
    // Caso contrário, construa a URL completa.
    // Exemplo: 'http://localhost:3001/uploads/logo.png'
    return `${api.defaults.baseURL.replace('/api', '' )}${filePath}`;
  };

  return (
    <ContentWrapper title={`Detalhes da ONG: ${ong.fantasy_name}`}>
      <Button onClick={() => onNavigate('list_ongs')} variant="secondary" className={styles.backButton}>
        <FaArrowLeft /> Voltar para a Lista
      </Button>

      <div className={styles.detailsGrid}>
        {/* Seção de Informações */}
        <div className={styles.infoSection}>
          <h3>Informações Gerais</h3>
          <p><strong>Nome Fantasia:</strong> {ong.fantasy_name}</p>
          <p><strong>Razão Social:</strong> {ong.corporate_name}</p>
          <p><strong>CNPJ:</strong> {ong.cnpj}</p>
          <p><strong>Data de Fundação:</strong> {new Date(ong.foundation_date).toLocaleDateString('pt-BR')}</p>
          <p><strong>Missão:</strong> {ong.mission}</p>
        </div>

        {/* Seção de Contato */}
        <div className={styles.infoSection}>
          <h3>Contato e Endereço</h3>
          <p><strong>Email:</strong> {ong.contact_email}</p>
          <p><strong>Telefone:</strong> {ong.phone}</p>
          <p><strong>Endereço:</strong> {`${ong.address}, ${ong.address_number} - ${ong.district}, ${ong.city}/${ong.state}`}</p>
          <p><strong>Website:</strong> <a href={ong.website} target="_blank" rel="noopener noreferrer">{ong.website}</a></p>
        </div>

        {/* Seção de Documentos */}
        <div className={styles.infoSection}>
          <h3>Documentos</h3>
          <ul className={styles.documentList}>
            {ong.logo_url && (
              <li>
                <span>Logotipo da ONG</span>
                <a href={getDocumentUrl(ong.logo_url)} download target="_blank" rel="noopener noreferrer" className={styles.downloadButton}>
                  <FaDownload /> Baixar
                </a>
              </li>
            )}
            {/* Adicione outros documentos aqui conforme necessário */}
            
            {ong.statute_url && (
              <li>
                <span>Estatuto Social</span>
                <a href={getDocumentUrl(ong.statute_url)} download className={styles.downloadButton}>
                  <FaDownload /> Baixar
                </a>
              </li>
            )}

            {ong.statute_url && (
              <li>
                <span>Última ATA</span>
                <a href={getDocumentUrl(ong.ata_url)} download className={styles.downloadButton}>
                  <FaDownload /> Baixar
                </a>
              </li>
            )}
          
          </ul>
        </div>
      </div>
    </ContentWrapper>
  );
};

export default OngDetailsPage;
