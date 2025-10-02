// src/pages/admin5/ListOngsPage/ListOngsPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import FileUpload from '../../../components/ui/FileUpload/FileUpload';
import FormSection from '../../../components/ui/FormSection/FormSection';
import api from '../../../api/api';
import styles from './ListOngsPage.module.css';

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return dateString.split('T')[0];
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return '';
  }
};

const ListOngsPage = ({ onNavigate }) => {
  const [ongs, setOngs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOng, setSelectedOng] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'responsible_name', label: 'Responsável' },
    { key: 'contact_email', label: 'Email' },
  ];

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs', { params: { search: searchTerm } });
        setOngs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao buscar ONGs:", error);
        setOngs([]);
      }
    };
    const delayDebounceFn = setTimeout(fetchOngs, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleView = (ong) => {
    onNavigate('ong_details', { ongId: ong.id });
  };

  const handleEdit = async (ong) => {
    try {
      const response = await api.get(`/ongs/${ong.id}`);
      setSelectedOng(response.data);
      setLogoFile(null);
      setAtaFile(null);
      setStatuteFile(null);
      setEditModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes da ONG para edição:", error);
      alert("Não foi possível carregar os dados para edição.");
    }
  };

  const handleDelete = (ong) => {
    setSelectedOng(ong);
    setDeleteModalOpen(true);
  };

// =====================================================================
// ++ CÓDIGO DE TESTE PARA ISOLAR O PROBLEMA DE UPLOAD ++
// =====================================================================
const handleUpdate = async (e) => {
    e.preventDefault();
    if (!logoFile) {
        alert("Por favor, selecione um LOGOTIPO para testar o upload.");
        return;
    }

    const dataToSubmit = new FormData();
    dataToSubmit.append('logo_file', logoFile); // Envia APENAS o logotipo

    alert("Enviando APENAS o logotipo para teste. Outros dados não serão salvos.");

    try {
        // Envia para a mesma rota de update
        await api.put(`/ongs/${selectedOng.id}`, dataToSubmit);
        
        alert("Requisição de teste enviada! Verifique os logs do backend.");
        setEditModalOpen(false);

    } catch (error) {
        console.error("Erro no teste de upload:", error.response ? error.response.data : error);
        alert("Ocorreu um erro no teste de upload. Verifique o console.");
    }
};

// =====================================================================
// ++ CÓDIGO DE TESTE PARA ISOLAR O PROBLEMA DE UPLOAD ++
// =====================================================================

  const confirmDelete = async () => {
    if (!selectedOng) return;
    try {
      await api.delete(`/ongs/${selectedOng.id}`);
      setDeleteModalOpen(false);
      setOngs(prevOngs => prevOngs.filter(ong => ong.id !== selectedOng.id));
      alert("OSC excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir OSC:", error);
      alert("Ocorreu um erro ao excluir a OSC.");
    }
  };

  const handleFileSelect = (file, type) => {
    if (type === 'logo') setLogoFile(file);
    if (type === 'ata') setAtaFile(file);
    if (type === 'statute') setStatuteFile(file);
  };

  return (
    <ContentWrapper title="Listar OSCs">
      <InputField label="Pesquisar por nome, responsável ou e-mail" name="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      
      <Table 
        headers={headers} 
        data={ongs} 
        onView={handleView}
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar OSC">
        <div className={styles.modalBody}>
          {selectedOng && (
             <form onSubmit={handleUpdate} className={styles.editForm}>
              <FormSection number="1" title="Informações da OSC">
                <InputField label="Nome Fantasia" name="fantasy_name" value={selectedOng.fantasy_name || ''} onChange={(e) => setSelectedOng({...selectedOng, fantasy_name: e.target.value})} required />
                <InputField label="Razão Social" name="corporate_name" value={selectedOng.corporate_name || ''} onChange={(e) => setSelectedOng({...selectedOng, corporate_name: e.target.value})} required />
                <InputField label="CNPJ" name="cnpj" value={selectedOng.cnpj || ''} onChange={(e) => setSelectedOng({...selectedOng, cnpj: e.target.value})} mask="cnpj" required />
                <InputField label="Data de Fundação" name="foundation_date" type="date" value={formatDate(selectedOng.foundation_date)} onChange={(e) => setSelectedOng({...selectedOng, foundation_date: e.target.value})} />
              </FormSection>

              <FormSection number="2" title="Documentos">
                <FileUpload label="Novo Logotipo" onFileSelect={(file) => handleFileSelect(file, 'logo')} accept="image/*" />
                <FileUpload label="Nova ATA (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'ata')} accept="application/pdf" />
                <FileUpload label="Novo Estatuto Social (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'statute')} accept="application/pdf" />
              </FormSection>

              <FormSection number="3" title="Contato e Endereço">
                <InputField label="E-mail de Contato" name="contact_email" type="email" value={selectedOng.contact_email || ''} onChange={(e) => setSelectedOng({...selectedOng, contact_email: e.target.value})} required />
                <InputField label="Telefone" name="phone" type="tel" value={selectedOng.phone || ''} onChange={(e) => setSelectedOng({...selectedOng, phone: e.target.value})} mask="phone" />
                <InputField label="Website" name="website" type="url" value={selectedOng.website || ''} onChange={(e) => setSelectedOng({...selectedOng, website: e.target.value})} />
                <InputField label="Instagram" name="instagram" value={selectedOng.instagram || ''} onChange={(e) => setSelectedOng({...selectedOng, instagram: e.target.value})} />
                <InputField label="CEP" name="zip_code" value={selectedOng.zip_code || ''} onChange={(e) => setSelectedOng({...selectedOng, zip_code: e.target.value})} />
                <InputField label="Endereço" name="address" value={selectedOng.address || ''} onChange={(e) => setSelectedOng({...selectedOng, address: e.target.value})} />
                <InputField label="Número" name="address_number" value={selectedOng.address_number || ''} onChange={(e) => setSelectedOng({...selectedOng, address_number: e.target.value})} />
                <InputField label="Bairro" name="district" value={selectedOng.district || ''} onChange={(e) => setSelectedOng({...selectedOng, district: e.target.value})} />
                <InputField label="Cidade" name="city" value={selectedOng.city || ''} onChange={(e) => setSelectedOng({...selectedOng, city: e.target.value})} />
                <InputField label="Estado" name="state" value={selectedOng.state || ''} onChange={(e) => setSelectedOng({...selectedOng, state: e.target.value})} />
                <InputField label="País" name="country" value={selectedOng.country || ''} onChange={(e) => setSelectedOng({...selectedOng, country: e.target.value})} />
              </FormSection>

              <FormSection number="4" title="Responsável Legal (Presidente)">
                <InputField label="Nome do Responsável" name="responsible_name" value={selectedOng.responsible_name || ''} onChange={(e) => setSelectedOng({...selectedOng, responsible_name: e.target.value})} required />
                <InputField label="CPF do Responsável" name="responsible_cpf" value={selectedOng.responsible_cpf || ''} onChange={(e) => setSelectedOng({...selectedOng, responsible_cpf: e.target.value})} mask="cpf" required />
              </FormSection>

              <div className={styles.modalActions}>
                <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {selectedOng && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir a ONG <strong>{selectedOng.fantasy_name}</strong>?</p>
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
