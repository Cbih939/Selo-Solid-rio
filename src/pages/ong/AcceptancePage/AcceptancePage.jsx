import React, { useState, useEffect } from 'react';
import api from '../../../api/api'; // Verifique se o caminho está correto
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './AcceptancePage.module.css'; // Supondo que você tem um CSS module
import Button from '../../../components/ui/Button/Button';

const AcceptancePage = ({ user }) => {
  // CORREÇÃO: Inicialize o estado como uma lista vazia `[]`
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Garante que só busca os dados se tivermos o ID da ONG
    if (user && user.ong_id) {
      const fetchPendingProofs = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/proofs/pending/${user.ong_id}`);
          
          // CORREÇÃO: Garante que estamos a guardar uma lista no estado
          if (Array.isArray(response.data)) {
            setProofs(response.data);
          } else {
            // Se a API não retornar uma lista, evitamos o erro
            console.error("A resposta da API não é uma lista:", response.data);
            setProofs([]); 
          }

        } catch (err) {
          setError('Não foi possível carregar as provas pendentes.');
          console.error('Erro ao buscar provas pendentes:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchPendingProofs();
    }
  }, [user]); // A dependência é o objeto 'user'

  const handleAction = async (proofId, action) => {
    const url = `/proofs/${proofId}/${action}`; // 'approve' ou 'reject'
    try {
      await api.put(url);
      // Remove a prova da lista local para atualizar a UI sem recarregar
      setProofs(currentProofs => currentProofs.filter(p => p.id !== proofId));
      alert(`Prova ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    } catch (err) {
      alert(`Ocorreu um erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} a prova.`);
      console.error(`Erro na ação ${action}:`, err);
    }
  };

  if (loading) {
    return <ContentWrapper title="Aceitação de Provas"><p>A carregar...</p></ContentWrapper>;
  }

  if (error) {
    return <ContentWrapper title="Aceitação de Provas"><p style={{ color: 'red' }}>{error}</p></ContentWrapper>;
  }

  return (
    <ContentWrapper title="Aceitação de Provas Sociais">
      <p>Aprove ou rejeite as provas sociais enviadas pelos beneficiários da sua ONG.</p>
      
      <div className={styles.proofsList}>
        {proofs.length === 0 ? (
          <p>Não há nenhuma prova social pendente no momento.</p>
        ) : (
          // O .map() agora é seguro porque 'proofs' é sempre uma lista
          proofs.map(proof => (
            <div key={proof.id} className={styles.proofCard}>
              <h3>{proof.title}</h3>
              <p><strong>Beneficiário:</strong> {proof.userName}</p>
              <p>{proof.description}</p>
              <div className={styles.actions}>
                <Button onClick={() => handleAction(proof.id, 'approve')} variant="success">
                  Aprovar
                </Button>
                <Button onClick={() => handleAction(proof.id, 'reject')} variant="danger">
                  Rejeitar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </ContentWrapper>
  );
};

export default AcceptancePage;
