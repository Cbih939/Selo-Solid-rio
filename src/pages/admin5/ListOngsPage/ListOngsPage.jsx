import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import FormSection from '../../../components/ui/FormSection/FormSection';
import FileUpload from '../../../components/ui/FileUpload/FileUpload'; // Importe o FileUpload
import api from '../../../api/api';
import styles from './ListOngsPage.module.css';

const ListOngsPage = ({ onNavigate }) => {
  const [ongs, setOngs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para os modais
  const [editingOng, setEditingOng] = useState(null);
  const [deletingOng, setDeletingOng] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS PARA OS NOVOS ARQUIVOS ---
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [newAtaFile, setNewAtaFile] = useState(null);
  const [newStatuteFile, setNewStatuteFile] = useState(null);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'responsible_name', label: 'Responsável' },
    { key: 'contact_email', label: 'Email' },
  ];

  useEffect(() => {
    const fetchOngs = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/ongs', { params: { search: searchTerm } });
        setOngs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao buscar ONGs:", error);
        setOngs([]);
      } finally {
        setIsLoading(false);
      }
    };
    const delayDebounceFn = setTimeout(() => { fetchOngs(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Função para abrir o modal de edição e buscar os dados completos
  const handleEdit = async (ong) => {
    try {
      const response = await api.get(`/ongs/${ong.id}`);
      setEditingOng(response.data);
      // Limpa os estados de arquivo ao abrir o modal
      setNewLogoFile(null);
      setNewAtaFile(null);
      setNewStatuteFile(null);
      setEditModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes da ONG:", error);
      alert("Não foi possível carregar os dados para edição.");
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingOng(prev => ({ ...prev, [name]: value }));
  };

  // --- LÓGICA DE UPDATE ATUALIZADA PARA INCLUIR ARQUIVOS ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingOng) return;

    const formData = new FormData();

    // 1. Adiciona todos os campos de texto do objeto 'editingOng'
    for (const key in editingOng) {
      // Garante que não estamos enviando valores nulos que podem causar problemas
      if (editingOng[key] !== null && editingOng[key] !== undefined) {
        formData.append(key, editingOng[key]);
      }
    }

    // 2. Adiciona os novos arquivos, se eles foram selecionados
    if (newLogoFile) formData.append('logo_file', newLogoFile);
    if (newAtaFile) formData.append('ata_file', newAtaFile);
    if (newStatuteFile) formData.append('statute_file', newStatuteFile);

    try {
      // O backend precisa ser capaz de lidar com 'multipart/form-data' na rota PUT
      await api.put(`/ongs/${editingOng.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEditModalOpen(false);
      // Atualiza a lista principal
      setOngs(prevOngs => prevOngs.map(ong => 
        ong.id === editingOng.id 
        ? { ...ong, fantasy_name: editingOng.fantasy_name, responsible_name: editingOng.responsible_name, contact_email: editingOng.contact_email } 
        : ong
      ));
      setEditingOng(null);
    } catch (error) {
      console.error("Erro ao atualizar OSC:", error);
      alert("Ocorreu um erro ao atualizar a OSC.");
    }
  };

  const handleView = (ong) => onNavigate('ong_details', { ongId: ong.id });
  const handleDelete = (ong) => { setDeletingOng(ong); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!deletingOng) return;
    try {
      await api.delete(`/ongs/${deletingOng.id}`);
      setDeleteModalOpen(false);
      setOngs(prevOngs => prevOngs.filter(ong => ong.id !== deletingOng.id));
      setDeletingOng(null);
    } catch (error) {
      console.error("Erro ao excluir OSC:", error);
      alert("Ocorreu um erro ao excluir a OSC.");
    }
  };

  return (
    <ContentWrapper title="Listar OSCs">
      <InputField label="Pesquisar por nome, responsável ou e-mail" name="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      
      <Table headers={headers} data={ongs} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />

      {/* --- MODAL DE EDIÇÃO COM BARRA DE ROLAGEM E UPLOAD --- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Informações da OSC">
        {editingOng && (
          // Adicionamos a classe 'editForm' para habilitar a rolagem
          <form onSubmit={handleUpdate} className={styles.editForm}>
            
            <FormSection title="Documentos">
              <div className={styles.fileUploadContainer}>
                <FileUpload label="Alterar Logotipo" onFileSelect={(file) => setNewLogoFile(file)} accept="image/*" />
                {editingOng.logo_url && <a href={editingOng.logo_url} target="_blank" rel="noopener noreferrer" className={styles.currentFileLink}>Ver logotipo atual</a>}
              </div>
              <div className={styles.fileUploadContainer}>
                <FileUpload label="Alterar Última ATA (.pdf)" onFileSelect={(file) => setNewAtaFile(file)} accept="application/pdf" />
                {editingOng.ata_url && <a href={editingOng.ata_url} target="_blank" rel="noopener noreferrer" className={styles.currentFileLink}>Ver ATA atual</a>}
              </div>
              <div className={styles.fileUploadContainer}>
                <FileUpload label="Alterar Estatuto Social (.pdf)" onFileSelect={(file) => setNewStatuteFile(file)} accept="application/pdf" />
                {editingOng.statute_url && <a href={editingOng.statute_url} target="_blank" rel="noopener noreferrer" className={styles.currentFileLink}>Ver estatuto atual</a>}
              </div>
            </FormSection>

            <FormSection title="Informações da OSC">
              <InputField label="Nome Fantasia" name="fantasy_name" value={editingOng.fantasy_name} onChange={handleEditFormChange} required />
              <InputField label="Razão Social" name="corporate_name" value={editingOng.corporate_name} onChange={handleEditFormChange} required />
              <InputField label="CNPJ" name="cnpj" value={editingOng.cnpj} onChange={handleEditFormChange} mask="cnpj" required />
              <InputField label="Data de Fundação" name="foundation_date" type="date" value={editingOng.foundation_date ? editingOng.foundation_date.split('T')[0] : ''} onChange={handleEditFormChange} />
            </FormSection>

            <FormSection title="Contato e Mídias">
              <InputField label="E-mail de Contato" name="contact_email" type="email" value={editingOng.contact_email} onChange={handleEditFormChange} required />
              <InputField label="Telefone / WhatsApp" name="phone" type="tel" value={editingOng.phone} onChange={handleEditFormChange} mask="phone" />
              <InputField label="Website" name="website" type="url" value={editingOng.website} onChange={handleEditFormChange} />
              <InputField label="Instagram" name="instagram" value={editingOng.instagram} onChange={handleEditFormChange} />
            </FormSection>

            <FormSection title="Endereço">
              <InputField label="CEP" name="zip_code" value={editingOng.zip_code} onChange={handleEditFormChange} mask="cep" />
              <InputField label="Endereço" name="address" value={editingOng.address} onChange={handleEditFormChange} />
              <InputField label="Número" name="address_number" value={editingOng.address_number} onChange={handleEditFormChange} />
              <InputField label="Bairro" name="district" value={editingOng.district} onChange={handleEditFormChange} />
              <InputField label="Cidade" name="city" value={editingOng.city} onChange={handleEditFormChange} />
              <InputField label="Estado" name="state" value={editingOng.state} onChange={handleEditFormChange} />
            </FormSection>
            
            <FormSection title="Responsável Legal (Presidente)">
                <InputField label="Nome do Presidente" name="responsible_name" value={editingOng.responsible_name} onChange={handleEditFormChange} required />
                <InputField label="CPF do Presidente" name="responsible_cpf" value={editingOng.responsible_cpf} onChange={handleEditFormChange} mask="cpf" required />
            </FormSection>

            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {deletingOng && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir a ONG <strong>{deletingOng.fantasy_name}</strong>?</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>
    </ContentWrapper>
  );
};

export default ListOngsPage;
