import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import InputField from '../../../components/ui/InputField/InputField';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import api from '../../../api/api';
import styles from './AcceptancePage.module.css';

const AcceptancePage = ({ user }) => {
  const [proofs, setProofs] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'approve', 'message'
  const [sealsToAward, setSealsToAward] = useState(10);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchProofs = useCallback(async () => {
    if (user && user.ong_id) {
      try {
        const response = await api.get(`/proofs/pending/${user.ong_id}`);
        setProofs(response.data);
      } catch (error) { console.error("Erro ao buscar provas:", error); }
    }
  }, [user]);

  useEffect(() => { fetchProofs(); }, [fetchProofs]);

  const openModal = (type, proof) => {
    setSelectedProof(proof);
    setModalType(type);
  };
  const closeModal = () => {
    setModalType(null);
    setFeedbackMessage(''); // Limpa a mensagem ao fechar o modal
  };

  const handleAction = async (action, proofId, data) => {
    try {
      if (action === 'approve') await api.put(`/proofs/${proofId}/approve`, data);
      if (action === 'reject') await api.put(`/proofs/${proofId}/reject`);
      if (action === 'message') await api.put(`/proofs/${proofId}/message`, data);
      fetchProofs();
      closeModal();
    } catch (error) { console.error(`Erro ao ${action}:`, error); }
  };

  const handlePrint = () => {
    // A função de impressão agora gera HTML para múltiplas imagens
    const imagesHtml = JSON.parse(selectedProof.file_url)
      .map(url => `<img src="http://localhost:3001/${url.replace(/\\/g, '/')}" style="max-width: 100%; margin-bottom: 1rem;" />`)
      .join('');
    
    const printContent = `
      <html><head><title>Prova Social</title></head><body>
      <h1>Detalhes da Prova Social</h1><hr>
      <h3>${selectedProof.title}</h3>
      <p><strong>Enviado por:</strong> ${selectedProof.userName}</p>
      <p><strong>Descrição:</strong> ${selectedProof.description}</p>
      ${imagesHtml}
      </body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <ContentWrapper title="Tela de Aceite de Provas Sociais">
      <ul className={styles.list}>
        {proofs.length > 0 ? proofs.map(proof => (
          <li key={proof.id} className={styles.listItem}>
            <div>
              <p className={styles.userName}>{proof.userName}</p>
              <p className={styles.action}>{proof.title}</p>
            </div>
            <button onClick={() => openModal('view', proof)} className={styles.viewButton}>
              Ver Prova
            </button>
          </li>
        )) : <p>Nenhuma prova social pendente para análise.</p>}
      </ul>

      {/* Modal de Visualização */}
      <Modal isOpen={modalType === 'view'} onClose={closeModal} title="Detalhes da Prova Social">
        {selectedProof && (
          <div>
            {/* ... (detalhes da prova) ... */}
            <div className={styles.imageGallery}>
              {/* Mostra as imagens enviadas */}
              {JSON.parse(selectedProof.file_url).map((url, index) => (
                <img key={index} src={`http://localhost:3001/${url.replace(/\\/g, '/')}`} alt={`Prova ${index + 1}`} />
              ))}
            </div>
            <div className={styles.printButtonContainer}>
              <Button variant="secondary" onClick={handlePrint}>Imprimir Detalhes</Button>
            </div>
            <div className={styles.modalActions}>
              <Button variant="danger" onClick={() => handleAction('reject', selectedProof.id)}>Rejeitar</Button>
              <Button variant="secondary" onClick={() => openModal('message', selectedProof)}>Enviar Mensagem</Button>
              <Button onClick={() => handleAction('approve', selectedProof.id)}>Aprovar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Aprovação */}
      <Modal isOpen={modalType === 'approve'} onClose={closeModal} title="Aprovar Prova Social">
        {selectedProof && (
          <form onSubmit={(e) => { e.preventDefault(); handleAction('approve', selectedProof.id, { sealsToAward }); }}>
            <p>Quantos selos atribuir a <strong>{selectedProof.userName}</strong>?</p>
            <InputField label="Quantidade de Selos" type="number" value={sealsToAward} onChange={(e) => setSealsToAward(e.target.value)} />
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={closeModal}>Cancelar</Button>
              <Button type="submit">Confirmar</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Mensagem */}
      <Modal isOpen={modalType === 'message'} onClose={closeModal} title="Enviar Feedback">
        {selectedProof && (
          <form onSubmit={(e) => { e.preventDefault(); handleAction('message', selectedProof.id, { message: feedbackMessage }); }}>
            <TextareaField label={`Mensagem para ${selectedProof.userName}`} value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} />
            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={closeModal}>Cancelar</Button>
              <Button type="submit">Enviar</Button>
            </div>
          </form>
        )}
      </Modal>
    </ContentWrapper>
  );
};

export default AcceptancePage;