import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './AcceptancePage.module.css';
import ProofDetailsModal from '../../../components/ui/ProofDetailsModal/ProofDetailsModal';
import { FaEye } from 'react-icons/fa';

const AcceptancePage = ({ user }) => {
  const [pendingProofs, setPendingProofs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  useEffect(() => {
    if (!user || !user.ong_id) {
      setError("Informações da OSC não encontradas.");
      setIsLoading(false);
      return;
    }

    const fetchPendingProofs = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/proofs/pending/${user.ong_id}`);
        setPendingProofs(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Erro ao buscar provas pendentes:", err);
        setError("Não foi possível carregar as provas pendentes.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingProofs();
  }, [user]);

  const handleViewDetails = (proof) => {
    setSelectedProof(proof);
    setIsModalOpen(true);
  };

  // =====================================================================
  // CORREÇÃO 1: Reimplementar a função handleApprove
  // =====================================================================
  const handleApprove = async (proofId) => {
    try {
      // Faz a chamada à API para aprovar a prova
      await api.put(`/proofs/${proofId}/approve`);
      // Remove a prova da lista local para atualizar a UI instantaneamente
      setPendingProofs(prevProofs => prevProofs.filter(p => p.id !== proofId));
      alert('Prova aprovada com sucesso!');
    } catch (err) {
      console.error("Erro ao aprovar prova:", err);
      alert('Não foi possível aprovar a prova.');
    }
  };

  // =====================================================================
  // CORREÇÃO 2: Reimplementar a função handleReject
  // =====================================================================
  const handleReject = async (proofId) => {
    // Opcional: Peça um motivo para a rejeição
    const reason = prompt("Por favor, insira o motivo da rejeição (opcional):");
    
    try {
      // Faz a chamada à API para rejeitar a prova
      await api.put(`/proofs/${proofId}/reject`, { reason: reason });
      // Remove a prova da lista local
      setPendingProofs(prevProofs => prevProofs.filter(p => p.id !== proofId));
      alert('Prova rejeitada com sucesso.');
    } catch (err) {
      console.error("Erro ao rejeitar prova:", err);
      alert('Não foi possível rejeitar a prova.');
    }
  };

  if (isLoading) {
    return <ContentWrapper title="Aceitação de Provas"><p>A carregar...</p></ContentWrapper>;
  }

  if (error) {
    return <ContentWrapper title="Aceitação de Provas"><p className={styles.error}>{error}</p></ContentWrapper>;
  }

  return (
    <>
      <ContentWrapper title="Aceitação de Provas">
        {pendingProofs.length === 0 ? (
          <p>Nenhuma prova pendente para análise no momento.</p>
        ) : (
          <div className={styles.proofsGrid}>
            {/* ===================================================================== */}
            {/* CORREÇÃO 3: Garante que o .map só rode se pendingProofs for um array */}
            {/* ===================================================================== */}
            {Array.isArray(pendingProofs) && pendingProofs.map((proof) => (
              <div key={proof.id} className={styles.proofCard}>
                <div className={styles.cardHeader}>
                  <h4>{proof.title}</h4>
                  <button onClick={() => handleViewDetails(proof)} className={styles.viewButton}>
                    <FaEye />
                  </button>
                </div>
                <p><strong>Enviado por:</strong> {proof.userName}</p>
                <p className={styles.description}>{proof.description || 'Nenhuma descrição fornecida.'}</p>
                <div className={styles.cardActions}>
                  {/* As funções agora existem e os botões funcionarão */}
                  <Button onClick={() => handleReject(proof.id)} variant="danger">Rejeitar</Button>
                  <Button onClick={() => handleApprove(proof.id)} variant="success">Aprovar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentWrapper>

      <ProofDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proof={selectedProof}
      />
    </>
  );
};

export default AcceptancePage;
