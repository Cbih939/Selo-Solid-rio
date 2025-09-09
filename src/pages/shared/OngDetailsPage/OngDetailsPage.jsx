// src/pages/shared/OngDetailsPage/OngDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './OngDetailsPage.module.css'; // Crie este arquivo de estilo

// A página recebe o ID da ONG e a função de navegação como propriedades
const OngDetailsPage = ({ ongId, onNavigate }) => {
  const [ong, setOng] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ongId) {
      setError('ID da OSC não fornecido.');
      setIsLoading(false);
      return;
    }

    const fetchOngDetails = async () => {
      try {
        const response = await api.get(`/ongs/${ongId}`);
        setOng(response.data);
      } catch (err) {
        console.error("Erro ao buscar detalhes da OSC:", err);
        setError('Não foi possível carregar os dados da OSC.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOngDetails();
  }, [ongId]);

  if (isLoading) {
    return <ContentWrapper title="Detalhes da OSC"><p>A carregar...</p></ContentWrapper>;
  }

  if (error) {
    return <ContentWrapper title="Erro"><p>{error}</p></ContentWrapper>;
  }

  if (!ong) {
    return <ContentWrapper title="Detalhes da OSC"><p>Nenhuma OSC encontrada.</p></ContentWrapper>;
  }

  // Constrói a URL completa para a logo e os documentos
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    // Usa a variável de ambiente para a URL base da API
    return `${process.env.REACT_APP_API_URL}${filePath}`;
  };

  const logoUrl = getFileUrl(ong.logo_url);
  const ataUrl = getFileUrl(ong.ata_url);
  const statuteUrl = getFileUrl(ong.statute_url);

  return (
    <ContentWrapper title={`Detalhes da ONG: ${ong.fantasy_name}`}>
      <div className={styles.detailsContainer}>
        
        {/* Seção da Logo */}
        {logoUrl && (
          <div className={styles.logoSection}>
            <img src={logoUrl} alt={`Logo da ${ong.fantasy_name}`} className={styles.logo} />
          </div>
        )}

        {/* Seção de Informações */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}><strong>ID:</strong> {ong.id}</div>
          <div className={styles.infoItem}><strong>Nome Fantasia:</strong> {ong.fantasy_name}</div>
          <div className={styles.infoItem}><strong>Razão Social:</strong> {ong.corporate_name}</div>
          <div className={styles.infoItem}><strong>CNPJ:</strong> {ong.cnpj}</div>
          <div className={styles.infoItem}><strong>Data de Fundação:</strong> {new Date(ong.foundation_date).toLocaleDateString()}</div>
          <div className={styles.infoItem}><strong>Email de Contato:</strong> {ong.contact_email}</div>
          <div className={styles.infoItem}><strong>Telefone:</strong> {ong.phone}</div>
          <div className={styles.infoItem}><strong>Website:</strong> <a href={ong.website} target="_blank" rel="noopener noreferrer">{ong.website}</a></div>
          <div className={styles.infoItem}><strong>Instagram:</strong> {ong.instagram}</div>
          <div className={styles.infoItem}><strong>Endereço:</strong> {`${ong.address}, ${ong.address_number} - ${ong.district}, ${ong.city} - ${ong.state}, ${ong.zip_code}`}</div>
        </div>

        {/* Seção de Documentos */}
        <div className={styles.documentsSection}>
          <h3>Documentos</h3>
          <div className={styles.documentLinks}>
            {ataUrl ? (
              <a href={ataUrl} target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Visualizar ATA</a>
            ) : (
              <span>ATA não enviada</span>
            )}
            {statuteUrl ? (
              <a href={statuteUrl} target="_blank" rel="noopener noreferrer" className={styles.documentLink}>Visualizar Estatuto</a>
            ) : (
              <span>Estatuto não enviado</span>
            )}
          </div>
        </div>

      </div>
      <div className={styles.actions}>
        <Button onClick={() => onNavigate('list_ongs')}>Voltar para a Lista</Button>
      </div>
    </ContentWrapper>
  );
};

export default OngDetailsPage;
