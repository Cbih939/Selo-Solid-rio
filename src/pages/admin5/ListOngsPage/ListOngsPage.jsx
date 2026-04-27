// Arquivo: src/pages/admin5/ListOngsPage/ListOngsPage.jsx

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

// Função auxiliar para formatar a data
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return dateString.split('T')[0];
  } catch (e) {
    return '';
  }
};

// Função auxiliar para converter um arquivo para Base64
const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});


const ListOngsPage = ({ onNavigate }) => {
  const [ongs, setOngs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOng, setSelectedOng] = useState(null);
  
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para ficheiros Base64
  const [logoFile, setLogoFile] = useState(null);
  const [ataFile, setAtaFile] = useState(null);
  const [statuteFile, setStatuteFile] = useState(null);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'responsible_name', label: 'Responsável Legal' },
    { key: 'contact_email', label: 'E-mail Corporativo' },
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

  const handleFileSelect = async (selected, type) => {
    if (!selected) return;
    const file = Array.isArray(selected) ? selected[0] : selected;
    if (!file) return;

    try {
        const base64String = await toBase64(file);
        if (type === 'logo') setLogoFile(base64String);
        if (type === 'ata') setAtaFile(base64String);
        if (type === 'statute') setStatuteFile(base64String);
    } catch (error) {
        console.error("Erro ao converter arquivo para Base64:", error);
        alert("Ocorreu um erro ao processar o arquivo.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOng) return;
    setIsSubmitting(true);

    const dataToSubmit = { ...selectedOng };

    if (logoFile) dataToSubmit.logo_base64 = logoFile;
    if (ataFile) dataToSubmit.ata_base64 = ataFile;
    if (statuteFile) dataToSubmit.statute_base64 = statuteFile;

    try {
        await api.put(`/ongs/${selectedOng.id}`, dataToSubmit);
        setEditModalOpen(false);
        const response = await api.get('/ongs', { params: { search: searchTerm } });
        setOngs(response.data);
        alert("OSC atualizada com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar OSC:", error.response ? error.response.data : error);
        alert("Ocorreu um erro ao atualizar a OSC.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedOng) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/ongs/${selectedOng.id}`);
      setDeleteModalOpen(false);
      setOngs(prevOngs => prevOngs.filter(ong => ong.id !== selectedOng.id));
      alert("OSC excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir OSC:", error);
      alert("Ocorreu um erro ao excluir a OSC.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentWrapper title="Listar Organizações (OSCs)">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Gestão de OSCs</h2>
        <p className={styles.introText}>
          Abaixo encontra-se a lista de todas as Organizações da Sociedade Civil parceiras. Utilize a barra de pesquisa para filtrar e gerir os dados institucionais e documentos.
        </p>
      </div>

      <div className={styles.filterSection}>
        <InputField 
          label="🔍 Pesquisar Organização" 
          name="search" 
          placeholder="Digite o nome fantasia, e-mail ou responsável..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>
      
      <div className={styles.tableContainer}>
        <Table 
          headers={headers} 
          data={ongs} 
          onView={handleView}
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      </div>

      {/* MODAL DE EDIÇÃO */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Editar OSC: ${selectedOng?.fantasy_name || ''}`}>
        <div className={styles.modalBody}>
          {selectedOng && (
             <form onSubmit={handleUpdate} className={styles.editForm}>
              
              <FormSection number="1" title="Informações da OSC">
                <div className={styles.grid2}>
                  <InputField label="Nome Fantasia" name="fantasy_name" value={selectedOng.fantasy_name || ''} onChange={(e) => setSelectedOng({...selectedOng, fantasy_name: e.target.value})} required />
                  <InputField label="Razão Social" name="corporate_name" value={selectedOng.corporate_name || ''} onChange={(e) => setSelectedOng({...selectedOng, corporate_name: e.target.value})} required />
                </div>
                <div className={styles.grid2}>
                  <InputField label="CNPJ" name="cnpj" value={selectedOng.cnpj || ''} onChange={(e) => setSelectedOng({...selectedOng, cnpj: e.target.value})} mask="cnpj" required />
                  <InputField label="Data de Fundação" name="foundation_date" type="date" value={formatDate(selectedOng.foundation_date)} onChange={(e) => setSelectedOng({...selectedOng, foundation_date: e.target.value})} />
                </div>
              </FormSection>

              <FormSection number="2" title="Documentos Oficiais">
                <div className={styles.grid3}>
                  <div className={styles.fileUploadContainer}>
                    <FileUpload label="Atualizar Logotipo" onFileSelect={(file) => handleFileSelect(file, 'logo')} accept="image/*" />
                    {selectedOng.logo_url && <a href={selectedOng.logo_url} target="_blank" rel="noopener noreferrer" className={styles.currentFileLink}>📎 Ver Logo Atual</a>}
                  </div>
                  <div className={styles.fileUploadContainer}>
                    <FileUpload label="Atualizar ATA (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'ata')} accept="application/pdf" />
                    {selectedOng.ata_url && <a href={selectedOng.ata_url} target="_blank" rel="noopener noreferrer" className={styles.currentFileLink}>📎 Ver ATA Atual</a>}
                  </div>
                  <div className={styles.fileUploadContainer}>
                    <FileUpload label="Atualizar Estatuto (.pdf)" onFileSelect={(file) => handleFileSelect(file, 'statute')} accept="application/pdf" />
                    {selectedOng.statute_url && <a href={selectedOng.statute_url} target="_blank" rel="noopener noreferrer" className={styles.currentFileLink}>📎 Ver Estatuto Atual</a>}
                  </div>
                </div>
              </FormSection>

              <FormSection number="3" title="Contato e Endereço">
                <div className={styles.grid3}>
                  <InputField label="E-mail de Contato" name="contact_email" type="email" value={selectedOng.contact_email || ''} onChange={(e) => setSelectedOng({...selectedOng, contact_email: e.target.value})} required />
                  <InputField label="Telefone" name="phone" type="tel" value={selectedOng.phone || ''} onChange={(e) => setSelectedOng({...selectedOng, phone: e.target.value})} mask="phone" />
                  <InputField label="Website" name="website" type="url" value={selectedOng.website || ''} onChange={(e) => setSelectedOng({...selectedOng, website: e.target.value})} />
                </div>
                
                <div className={styles.grid3}>
                  <InputField label="Instagram" name="instagram" value={selectedOng.instagram || ''} onChange={(e) => setSelectedOng({...selectedOng, instagram: e.target.value})} />
                  <InputField label="CEP" name="zip_code" value={selectedOng.zip_code || ''} onChange={(e) => setSelectedOng({...selectedOng, zip_code: e.target.value})} />
                  <InputField label="País" name="country" value={selectedOng.country || ''} onChange={(e) => setSelectedOng({...selectedOng, country: e.target.value})} />
                </div>
                
                <div className={styles.grid3}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <InputField label="Endereço / Rua" name="address" value={selectedOng.address || ''} onChange={(e) => setSelectedOng({...selectedOng, address: e.target.value})} />
                  </div>
                  <InputField label="Número" name="address_number" value={selectedOng.address_number || ''} onChange={(e) => setSelectedOng({...selectedOng, address_number: e.target.value})} />
                </div>

                <div className={styles.grid3}>
                  <InputField label="Bairro" name="district" value={selectedOng.district || ''} onChange={(e) => setSelectedOng({...selectedOng, district: e.target.value})} />
                  <InputField label="Cidade" name="city" value={selectedOng.city || ''} onChange={(e) => setSelectedOng({...selectedOng, city: e.target.value})} />
                  <InputField label="Estado (UF)" name="state" value={selectedOng.state || ''} onChange={(e) => setSelectedOng({...selectedOng, state: e.target.value})} />
                </div>
              </FormSection>

              <FormSection number="4" title="Responsável Legal (Presidente)">
                <div className={styles.grid2}>
                  <InputField label="Nome do Responsável" name="responsible_name" value={selectedOng.responsible_name || ''} onChange={(e) => setSelectedOng({...selectedOng, responsible_name: e.target.value})} required />
                  <InputField label="CPF do Responsável" name="responsible_cpf" value={selectedOng.responsible_cpf || ''} onChange={(e) => setSelectedOng({...selectedOng, responsible_cpf: e.target.value})} mask="cpf" required />
                </div>
              </FormSection>

              <div className={styles.modalActions}>
                <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} disabled={isSubmitting}>
                  {isSubmitting ? 'A Guardar...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* MODAL DE EXCLUSÃO */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {selectedOng && (
          <div className={styles.modalContent}>
            <p className={styles.warningText}>Tem a certeza de que deseja excluir a OSC <strong>{selectedOng.fantasy_name}</strong>?</p>
            <p className={styles.subWarningText}>Esta ação é permanente e removerá o acesso da instituição ao ecossistema.</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'A Excluir...' : 'Sim, Excluir OSC'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ContentWrapper>
  );
};

export default ListOngsPage;