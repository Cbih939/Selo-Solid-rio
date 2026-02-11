import React, { useRef } from 'react';
import styles from './ProofDetailsModal.module.css';
import Button from '../Button/Button';
import { FaPrint, FaTimes } from 'react-icons/fa';

const ProofDetailsModal = ({ proof, isOpen, onClose }) => {
  const printRef = useRef(); 

  if (!isOpen || !proof) {
    return null;
  }

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>Detalhes da Prova</title>');
    printWindow.document.write(`
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .printHeader h1 { font-size: 24px; margin-bottom: 20px; color: #333; }
        .printSection { margin-bottom: 20px; }
        .printSection h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; color: #666; }
        .printSection p { line-height: 1.6; margin: 10px 0; }
        .printImages img { max-width: 100%; height: auto; border: 1px solid #ddd; margin-top: 10px; display: block; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    
    // Aguarda carregar imagens antes de abrir a janela de impressão
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  // =====================================================================
  // CORREÇÃO: Ajuste do caminho da URL da imagem
  // =====================================================================
  const getImageUrl = (filePath) => {
    if (!filePath) return '';
    
    // Se o backend já envia a URL completa começando com http, retorna ela
    if (filePath.startsWith('http')) return filePath;

    // Se o backend envia apenas o nome do arquivo ou um path relativo
    // Remove barras duplicadas e garante o caminho /api/uploads/
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    
    // Ajuste conforme a rota estática configurada no seu Express/Backend
    return `https://selocidadania.org.br/api/uploads${cleanPath}`;
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
        
        <div ref={printRef} className={styles.printContainer}>
          <div className={styles.printHeader}>
            <h1>Detalhes da Prova</h1>
          </div>
          
          <div className={styles.printSection}>
            <h2>Informações</h2>
            <p><strong>Beneficiário:</strong> {proof.userName}</p>
            <p><strong>Atividade Realizada:</strong> {proof.title}</p>
            {proof.description && <p><strong>Descrição:</strong> {proof.description}</p>}
          </div>

          <div className={styles.printSection}>
            <h2>Comprovante(s)</h2>
            <div className={styles.printImages}>
              {/* Verifica se existem file_urls ou se há um campo proof_file único */}
              {Array.isArray(proof.file_urls) && proof.file_urls.length > 0 ? (
                proof.file_urls.map((url, index) => (
                  <img key={index} src={getImageUrl(url)} alt={`Comprovante ${index + 1}`} />
                ))
              ) : (
                // Fallback caso o objeto venha com proof_file em vez de file_urls
                proof.proof_file && <img src={getImageUrl(proof.proof_file)} alt="Comprovante Único" />
              )}
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