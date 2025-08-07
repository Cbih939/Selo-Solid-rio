import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import TextareaField from '../../../components/ui/TextareaField/TextareaField';
import api from '../../../api/api';
import styles from './AcceptancePage.module.css';

const AcceptancePage = ({ user }) => {
  const [proofs, setProofs] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' ou 'message'
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
    setFeedbackMessage('');
  };

  const handleAction = async (action, proofId, data) => {
    try {
      if (action === 'approve') await api.put(`/proofs/${proofId}/approve`);
      if (action === 'reject') await api.put(`/proofs/${proofId}/reject`);
      if (action === 'message') await api.put(`/proofs/${proofId}/message`, data);
      fetchProofs();
      closeModal();
    } catch (error) { console.error(`Erro ao ${action}:`, error); }
  };

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Prova Social</title></head><body>
      <h1>Detalhes da Prova Social</h1><hr>
      <h3>${selectedProof.title}</h3>
      <p><strong>Enviado por:</strong> ${selectedProof.userName}</p>
      <p><strong>Descrição:</strong> ${selectedProof.description || 'Nenhuma descrição fornecida.'}</p>
      <img src="https://via.placeholder.com/400x200.png?text=Foto+da+Prova+Social" style="max-width: 100%;" />
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
            <h3>{selectedProof.title}</h3>
            <p><strong>Enviado por:</strong> {selectedProof.userName}</p>
            <p>{selectedProof.description}</p>
            <img src="https://via.placeholder.com/400x200.png?text=Foto+da+Prova+Social" alt="Prova Social" className={styles.proofImage} />
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
