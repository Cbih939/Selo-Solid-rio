import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './OngDetailsPage.module.css';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';

const OngDetailsPage = ({ ongId, onNavigate }) => {
  const [ong, setOng] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOngDetails = async () => {
      if (!ongId) return;
      setLoading(true);
      try {
        const response = await api.get(`/ongs/${ongId}`);
        setOng(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados da OSC:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOngDetails();
  }, [ongId]);

  // Função para construir a URL completa do documento. Está correta!
  const getDocumentUrl = (filePath) => {
    if (!filePath) return '';
    // Constrói a URL base removendo '/api' para apontar para a raiz do domínio.
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    // Retorna a URL completa para o arquivo.
    return `${baseUrl}${filePath}`;
  };

  if (loading) {
    return <ContentWrapper title="Dados:"><p>A carregar...</p></ContentWrapper>;
  }

  if (!ong) {
    return <ContentWrapper title="Erro"><p>Não foi possível carregar os dados da OSC.</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title={`Detalhes da ONG: ${ong.fantasy_name}`}>
      <Button onClick={() => onNavigate('list_ongs')} variant="secondary" className={styles.backButton}>
        <FaArrowLeft /> Voltar para a Lista
      </Button>

      <div className={styles.detailsGrid}>
        <div className={styles.infoSection}>
          <h3>Informações Gerais</h3>
          <p><strong>Nome Fantasia:</strong> {ong.fantasy_name}</p>
          <p><strong>Razão Social:</strong> {ong.corporate_name}</p>
          <p><strong>CNPJ:</strong> {ong.cnpj}</p>
          <p><strong>Data de Fundação:</strong> {new Date(ong.foundation_date).toLocaleDateString('pt-BR')}</p>
          <p><strong>Missão:</strong> {ong.mission || 'Não informada'}</p>
        </div>

        <div className={styles.infoSection}>
          <h3>Contato e Endereço</h3>
          <p><strong>E-mail:</strong> {ong.contact_email}</p>
          <p><strong>Telefone:</strong> {ong.phone}</p>
          <p><strong>Endereço:</strong> {`${ong.address}, ${ong.address_number} - ${ong.district}, ${ong.city}/${ong.state}`}</p>
          <p><strong>Website:</strong> <a href={ong.website} target="_blank" rel="noopener noreferrer">{ong.website}</a></p>
        </div>

        {/* ===================================================================== */}
        {/* ++ INÍCIO DA CORREÇÃO DE EXIBIÇÃO ++ */}
        {/* ===================================================================== */}
        <div className={styles.infoSection}>
          <h3>Documentos e Logotipo</h3>
          
          {/* Exibe a imagem do logotipo diretamente na página */}
          {ong.logo_url ? (
            <div className={styles.logoContainer}>
              <img src={getDocumentUrl(ong.logo_url)} alt={`Logotipo da ${ong.fantasy_name}`} className={styles.logoImage} />
            </div>
          ) : (
            <p>Logotipo não enviado.</p>
          )}

          <ul className={styles.documentList}>
            {/* Link para baixar o logotipo */}
            {ong.logo_url && (
              <li>
                <span>Logotipo da OSC</span>
                <a href={getDocumentUrl(ong.logo_url)} download target="_blank" rel="noopener noreferrer" className={styles.downloadButton}>
                  <FaDownload /> Baixar
                </a>
              </li>
            )}
            
            {/* Verifica 'statute_url' e usa 'statute_url' */}
            {ong.statute_url ? (
              <li>
                <span>Estatuto Social</span>
                <a href={getDocumentUrl(ong.statute_url)} download target="_blank" rel="noopener noreferrer" className={styles.downloadButton}>
                  <FaDownload /> Baixar
                </a>
              </li>
            ) : (
              <li><span>Estatuto Social:</span> Não enviado</li>
            )}

            {/* Verifica 'ata_url' e usa 'ata_url' */}
            {ong.ata_url ? (
              <li>
                <span>Última ATA</span>
                <a href={getDocumentUrl(ong.ata_url)} download target="_blank" rel="noopener noreferrer" className={styles.downloadButton}>
                  <FaDownload /> Baixar
                </a>
              </li>
            ) : (
              <li><span>Última ATA:</span> Não enviado</li>
            )}
          </ul>
        </div>
        {/* ===================================================================== */}
        {/* ++ FIM DA CORREÇÃO ++ */}
        {/* ===================================================================== */}
      </div>
    </ContentWrapper>
  );
};

export default OngDetailsPage;
