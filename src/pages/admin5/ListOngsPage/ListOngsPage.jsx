import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import FormSection from '../../../components/ui/FormSection/FormSection';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import api from '../../../api/api';
import styles from './ListOngsPage.module.css';

const ListOngsPage = ({ onNavigate }) => {
  const [ongs, setOngs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para os modais e dados
  const [editingOng, setEditingOng] = useState(null);
  const [deletingOng, setDeletingOng] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para os novos arquivos selecionados no formulário de edição
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [newAtaFile, setNewAtaFile] = useState(null);
  const [newStatuteFile, setNewStatuteFile] = useState(null);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'responsible_name', label: 'Responsável' },
    { key: 'contact_email', label: 'Email' },
  ];

  // Busca a lista de ONGs
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

  // Abre o modal de edição e busca os dados completos da ONG
  const handleEdit = async (ong) => {
    try {
      const response = await api.get(`/ongs/${ong.id}`);
      setEditingOng(response.data);
      // Limpa os estados de arquivo ao abrir um novo modal
      setNewLogoFile(null);
      setNewAtaFile(null);
      setNewStatuteFile(null);
      setEditModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes da ONG para edição:", error);
      alert("Não foi possível carregar os dados para edição.");
    }
  };

  // Atualiza o estado do formulário de edição a cada mudança
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingOng(prev => ({ ...prev, [name]: value }));
  };

  // ===== FUNÇÃO DE ATUALIZAÇÃO (handleUpdate) CORRIGIDA E FINAL =====
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingOng) return;

    const dataToSubmit = new FormData();

    // 1. Adiciona todos os campos de texto EXPLICITAMENTE.
    // Isso evita enviar campos indesejados como 'logo_url', 'id', 'created_at', etc.
    // Usamos `|| ''` para garantir que um valor seja enviado mesmo que seja nulo, evitando que o backend o trate como 'undefined'.
    dataToSubmit.append('fantasy_name', editingOng.fantasy_name);
    dataToSubmit.append('corporate_name', editingOng.corporate_name);
    dataToSubmit.append('cnpj', editingOng.cnpj);
    dataToSubmit.append('foundation_date', editingOng.foundation_date || '');
    dataToSubmit.append('contact_email', editingOng.contact_email);
    dataToSubmit.append('phone', editingOng.phone || '');
    dataToSubmit.append('website', editingOng.website || '');
    dataToSubmit.append('instagram', editingOng.instagram || '');
    dataToSubmit.append('zip_code', editingOng.zip_code || '');
    dataToSubmit.append('address', editingOng.address || '');
    dataToSubmit.append('address_number', editingOng.address_number || '');
    dataToSubmit.append('district', editingOng.district || '');
    dataToSubmit.append('city', editingOng.city || '');
    dataToSubmit.append('state', editingOng.state || '');
    dataToSubmit.append('responsible_name', editingOng.responsible_name);
    dataToSubmit.append('responsible_cpf', editingOng.responsible_cpf || '');

    // 2. Adiciona os novos arquivos, se eles foram selecionados.
    // Estes são os únicos campos de arquivo que o backend verá.
    if (newLogoFile) dataToSubmit.append('logo_file', newLogoFile);
    if (newAtaFile) dataToSubmit.append('ata_file', newAtaFile);
    if (newStatuteFile) dataToSubmit.append('statute_file', newStatuteFile);

    try {
      // Envia a requisição PUT com o FormData
      await api.put(`/ongs/${editingOng.id}`, dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEditModalOpen(false);
      // Atualiza a lista na tela para refletir a mudança sem precisar recarregar a página
      setOngs(prevOngs => prevOngs.map(ong => 
        ong.id === editingOng.id 
        ? { ...ong, fantasy_name: editingOng.fantasy_name, responsible_name: editingOng.responsible_name, contact_email: editingOng.contact_email } 
        : ong
      ));
      setEditingOng(null); // Limpa o estado de edição
    } catch (error) {
      console.error("Erro ao atualizar OSC:", error.response?.data || error);
      alert("Ocorreu um erro ao atualizar a OSC. Verifique o console para mais detalhes.");
    }
  };

  // Funções de visualização e exclusão
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

      {/* Modal de Edição Completo */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Informações da OSC">
        {editingOng && (
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

      {/* Modal de Exclusão de OSC */}
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
