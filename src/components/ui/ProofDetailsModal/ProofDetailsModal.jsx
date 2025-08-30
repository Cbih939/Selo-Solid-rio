import React, { useRef } from 'react';
import styles from './ProofDetailsModal.module.css';
import Button from '../Button/Button';
import { FaPrint, FaTimes } from 'react-icons/fa';

const ProofDetailsModal = ({ proof, isOpen, onClose }) => {
  const printRef = useRef(); // Ref para a área que será impressa

  if (!isOpen || !proof) {
    return null;
  }

  // Função para acionar a impressão
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>Detalhes da Prova Social</title>');
    // Inclui estilos básicos para a impressão
    printWindow.document.write(`
      <style>
        body { font-family: sans-serif; }
        .printContainer { padding: 20px; }
        .printHeader h1 { font-size: 24px; margin-bottom: 20px; }
        .printSection { margin-bottom: 20px; }
        .printSection h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .printSection p { line-height: 1.6; }
        .printImages img { max-width: 100%; height: auto; border: 1px solid #ddd; margin-top: 10px; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus(); // Necessário para alguns navegadores
    
    // Atraso para garantir que as imagens carreguem antes de imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Função para construir a URL completa da imagem
  const getImageUrl = (filePath) => {
    // Assumindo que a baseURL do Axios está configurada para o domínio principal
    // e os arquivos estão em /public/uploads no backend.
    return `https://selocidadania.redepapelsolidario.org.br${filePath}`;
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
        
        {/* Área que será impressa */}
        <div ref={printRef} className={styles.printContainer}>
          <div className={styles.printHeader}>
            <h1>Detalhes da Prova Social</h1>
          </div>
          
          <div className={styles.printSection}>
            <h2>Informações</h2>
            <p><strong>Beneficiário:</strong> {proof.userName}</p>
            <p><strong>Atividade Realizada:</strong> {proof.title}</p>
            {proof.description && <p><strong>Descrição:</strong> {proof.description}</p>}
          </div>

          <div className={styles.printSection}>
            <h2>Comprovante(s )</h2>
            <div className={styles.printImages}>
              {/* Garante que file_urls é um array antes de mapear */}
              {Array.isArray(proof.file_urls) && proof.file_urls.map((url, index) => (
                <img key={index} src={getImageUrl(url)} alt={`Comprovante ${index + 1}`} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <Button onClick={handlePrint} variant="primary">
            <FaPrint /> Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProofDetailsModal;
