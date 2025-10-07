// Arquivo: pages/user/MySocialProofsPage/MySocialProofsPage.jsx (ATUALIZADO)

import React, { useState, useEffect, useCallback } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Modal from '../../../components/ui/Modal/Modal';
import Icon from '../../../components/ui/Icon/Icon';
import Button from '../../../components/ui/Button/Button';
import InputField from '../../../components/ui/InputField/InputField';
import { ICONS } from '../../../assets/icons/ICONS';
import api from '../../../api/api';
import styles from './MySocialProofsPage.module.css';

// ++ INÍCIO DA CORREÇÃO 1: Função de tradução ++
const translateStatus = (status) => {
  const translations = {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
  };
  return translations[status] || status;
};
// ++ FIM DA CORREÇÃO 1 ++

const MySocialProofsPage = ({ user }) => {
 const [proofs, setProofs] = useState([]);
 const [loading, setLoading] = useState(true);

 // Estados para os modais
 const [selectedProof, setSelectedProof] = useState(null);
 const [isMessageModalOpen, setMessageModalOpen] = useState(false);
 const [isEditModalOpen, setEditModalOpen] = useState(false);
 const [editingProof, setEditingProof] = useState(null);

 const fetchUserProofs = useCallback(async () => {
  if (user) {
   setLoading(true);
   try {
    const response = await api.get(`/proofs/user/${user.id}`);
    setProofs(response.data);
   } catch (error) {
    console.error("Erro ao buscar provas:", error);
   } finally {
    setLoading(false);
   }
  }
 }, [user]);

 useEffect(() => {
  fetchUserProofs();
 }, [fetchUserProofs]);

 const getStatusClass = (status) => {
  if (status === 'approved') return styles.approved;
  if (status === 'rejected') return styles.rejected;
  return styles.pending;
 };

 const handleEditClick = (proof) => {
  setEditingProof(proof);
  setEditModalOpen(true);
 };

 const handleUpdateProof = async (e) => {
  e.preventDefault();
  if (!editingProof) return;

  const formData = new FormData();
  formData.append('description', editingProof.description);
  
  const fileInput = e.target.elements.files;
  if (fileInput && fileInput.files.length > 0) {
   for (let i = 0; i < fileInput.files.length; i++) {
    formData.append('files', fileInput.files[i]);
   }
  }

  try {
   await api.put(`/proofs/${editingProof.id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
   });
   alert('Prova social atualizada com sucesso!');
   setEditModalOpen(false);
   fetchUserProofs();
  } catch (error) {
   console.error("Erro ao atualizar prova:", error);
   alert('Ocorreu um erro ao atualizar a prova.');
  }
 };

 if (loading) {
  return <ContentWrapper title="Minhas Provas Sociais"><p>A carregar...</p></ContentWrapper>;
 }

 return (
  <ContentWrapper title="Minhas Provas Sociais">
   <ul className={styles.list}>
    {proofs.length > 0 ? proofs.map(proof => (
     <li key={proof.id} className={styles.listItem}>
      <div className={styles.proofInfo}>
       <p className={styles.title}>{proof.title}</p>
              {/* ++ INÍCIO DA CORREÇÃO 2: Aplicando a tradução ++ */}
       <span className={`${styles.status} ${getStatusClass(proof.status)}`}>
                {translateStatus(proof.status)}
              </span>
              {/* ++ FIM DA CORREÇÃO 2 ++ */}
      </div>
      <div className={styles.actions}>
       {proof.feedback_message && (
        <button className={styles.iconButton} onClick={() => { setSelectedProof(proof); setMessageModalOpen(true); }}>
         <Icon path={ICONS.message} />
        </button>
       )}
       {proof.status === 'pending' && (
        <button className={styles.iconButton} onClick={() => handleEditClick(proof)}>
         <Icon path={ICONS.edit} />
        </button>
       )}
      </div>
     </li>
    )) : <p>Você ainda não enviou nenhuma prova social.</p>}
   </ul>

   {/* Modal de Feedback */}
   <Modal isOpen={isMessageModalOpen} onClose={() => setMessageModalOpen(false)} title="Feedback da ONG">
    {selectedProof && <p>{selectedProof.feedback_message}</p>}
   </Modal>

   {/* Modal de Edição */}
   <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Prova Social">
    {editingProof && (
     <form onSubmit={handleUpdateProof}>
      <InputField
       label="Descrição"
       name="description"
       value={editingProof.description}
       onChange={(e) => setEditingProof({ ...editingProof, description: e.target.value })}
       textarea
       rows={4}
      />
      <InputField
       label="Substituir Comprovantes (opcional)"
       name="files"
       type="file"
       multiple
      />
      <div className={styles.modalActions}>
       <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
       <Button type="submit" variant="primary">Salvar Alterações</Button>
      </div>
     </form>
    )}
   </Modal>
  </ContentWrapper>
 );
};

export default MySocialProofsPage;