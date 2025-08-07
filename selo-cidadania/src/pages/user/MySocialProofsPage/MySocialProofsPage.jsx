import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import Icon from '../../../components/ui/Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS';
import api from '../../../api/api';
import styles from './MySocialProofsPage.module.css';

const MySocialProofsPage = ({ user }) => {
  const [proofs, setProofs] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);

  const fetchUserProofs = useCallback(async () => {
    if (user) {
      try {
        const response = await api.get(`/proofs/user/${user.id}`);
        setProofs(response.data);
      } catch (error) { console.error("Erro ao buscar provas:", error); }
    }
  }, [user]);

  useEffect(() => { fetchUserProofs(); }, [fetchUserProofs]);

  const getStatusClass = (status) => {
    if (status === 'approved') return styles.approved;
    if (status === 'rejected') return styles.rejected;
    return styles.pending;
  };

  return (
    <ContentWrapper title="Minhas Provas Sociais">
      <ul className={styles.list}>
        {proofs.length > 0 ? proofs.map(proof => (
          <li key={proof.id} className={styles.listItem}>
            <div>
              <p className={styles.title}>{proof.title}</p>
              <span className={`${styles.status} ${getStatusClass(proof.status)}`}>{proof.status}</span>
            </div>
            <div className={styles.actions}>
              {proof.feedback_message && (
                <button className={styles.iconButton} onClick={() => { setSelectedProof(proof); setMessageModalOpen(true); }}>
                  <Icon path={ICONS.message} />
                </button>
              )}
              {proof.status === 'pending' && (
                <button className={styles.iconButton}><Icon path={ICONS.edit} /></button>
              )}
            </div>
          </li>
        )) : <p>Você ainda não enviou nenhuma prova social.</p>}
      </ul>

      <Modal isOpen={isMessageModalOpen} onClose={() => setMessageModalOpen(false)} title="Feedback da ONG">
        {selectedProof && <p>{selectedProof.feedback_message}</p>}
      </Modal>
    </ContentWrapper>
  );
};

export default MySocialProofsPage;
