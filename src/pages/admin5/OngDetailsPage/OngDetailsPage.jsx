// Arquivo: src/pages/admin5/OngDetailsPage/OngDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './OngDetailsPage.module.css';
import { FaDownload, FaArrowLeft, FaBuilding, FaAddressCard, FaFileAlt } from 'react-icons/fa';

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

  const getDocumentUrl = (filePath) => {
    if (!filePath) return '';
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${filePath}`;
  };

  if (loading) {
    return (
      <ContentWrapper title="Detalhes da Organização">
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>A carregar dados da instituição...</p>
        </div>
      </ContentWrapper>
    );
  }

  if (!ong) {
    return (
      <ContentWrapper title="Detalhes da Organização">
        <div className={styles.errorState}>
          <p>Não foi possível carregar os dados desta OSC.</p>
          <Button onClick={() => onNavigate('list_ongs')} variant="secondary">Voltar para a Lista</Button>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Ficha da Instituição">
      
      {/* Barra de Navegação e Cabeçalho */}
      <div className={styles.topActions}>
        <Button onClick={() => onNavigate('list_ongs')} variant="secondary" className={styles.backButton}>
          <FaArrowLeft /> Voltar para a Lista
        </Button>
      </div>

      <div className={styles.headerBlock}>
        <div className={styles.headerTitleRow}>
          {ong.logo_url ? (
            <img src={getDocumentUrl(ong.logo_url)} alt="Logo" className={styles.headerLogo} />
          ) : (
            <div className={styles.headerLogoPlaceholder}><FaBuilding /></div>
          )}
          <div>
            <h2 className={styles.mainTitle}>{ong.fantasy_name}</h2>
            <p className={styles.subTitle}>CNPJ: {ong.cnpj} | Cadastrada no sistema Selo Cidadania</p>
          </div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        
        {/* CARTÃO 1: Informações Gerais */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <FaBuilding className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Informações Gerais</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.infoRow}><span>Nome Fantasia:</span> <strong>{ong.fantasy_name}</strong></div>
            <div className={styles.infoRow}><span>Razão Social:</span> <strong>{ong.corporate_name}</strong></div>
            <div className={styles.infoRow}><span>CNPJ:</span> <strong>{ong.cnpj}</strong></div>
            <div className={styles.infoRow}><span>Data de Fundação:</span> <strong>{ong.foundation_date ? new Date(ong.foundation_date).toLocaleDateString('pt-BR') : 'Não informada'}</strong></div>
            <div className={styles.infoRow}><span>Presidente/Responsável:</span> <strong>{ong.responsible_name || 'Não informado'}</strong></div>
            <div className={styles.infoBlock}>
              <span>Missão:</span>
              <p>{ong.mission || 'Missão não informada no registo inicial.'}</p>
            </div>
          </div>
        </div>

        {/* CARTÃO 2: Contato e Endereço */}
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <FaAddressCard className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Contato e Localização</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.infoRow}><span>E-mail Corporativo:</span> <strong>{ong.contact_email}</strong></div>
            <div className={styles.infoRow}><span>Telefone Institucional:</span> <strong>{ong.phone || 'N/A'}</strong></div>
            <div className={styles.infoRow}><span>Website:</span> 
              <strong>
                {ong.website ? <a href={ong.website} target="_blank" rel="noopener noreferrer" className={styles.linkBlue}>{ong.website}</a> : 'N/A'}
              </strong>
            </div>
            <div className={styles.infoRow}><span>Instagram:</span> <strong>{ong.instagram || 'N/A'}</strong></div>
            
            <div className={styles.addressBlock}>
              <span className={styles.addressLabel}>Endereço Completo:</span>
              <p className={styles.addressText}>
                {ong.address ? `${ong.address}, nº ${ong.address_number || 'S/N'}${ong.complemento ? ' - ' + ong.complemento : ''}` : 'Logradouro não informado'}
                <br />
                {ong.district ? `Bairro: ${ong.district}` : ''}
                <br />
                {ong.city && ong.state ? `${ong.city} / ${ong.state}` : 'Cidade/Estado não informados'}
                <br />
                {ong.zip_code ? `CEP: ${ong.zip_code}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* CARTÃO 3: Documentação Oficial */}
        <div className={`${styles.infoCard} ${styles.fullWidthCard}`}>
          <div className={styles.cardHeader}>
            <FaFileAlt className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Documentos Oficiais e Identidade</h3>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.documentList}>
              
              {/* LOGOTIPO */}
              <li className={styles.documentItem}>
                <div className={styles.docInfo}>
                  <span className={styles.docName}>🖼️ Logotipo da Instituição</span>
                  <span className={styles.docStatus}>{ong.logo_url ? 'Enviado' : 'Pendente'}</span>
                </div>
                {ong.logo_url && (
                  <a href={getDocumentUrl(ong.logo_url)} download target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                    <FaDownload /> Baixar Imagem
                  </a>
                )}
              </li>
              
              {/* ESTATUTO */}
              <li className={styles.documentItem}>
                <div className={styles.docInfo}>
                  <span className={styles.docName}>📄 Estatuto Social (.pdf)</span>
                  <span className={styles.docStatus}>{ong.statute_url ? 'Enviado' : 'Pendente'}</span>
                </div>
                {ong.statute_url && (
                  <a href={getDocumentUrl(ong.statute_url)} download target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                    <FaDownload /> Baixar Documento
                  </a>
                )}
              </li>

              {/* ATA */}
              <li className={styles.documentItem}>
                <div className={styles.docInfo}>
                  <span className={styles.docName}>📜 Última ATA (.pdf)</span>
                  <span className={styles.docStatus}>{ong.ata_url ? 'Enviado' : 'Pendente'}</span>
                </div>
                {ong.ata_url && (
                  <a href={getDocumentUrl(ong.ata_url)} download target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                    <FaDownload /> Baixar Documento
                  </a>
                )}
              </li>

            </ul>
          </div>
        </div>

      </div>
    </ContentWrapper>
  );
};

export default OngDetailsPage;