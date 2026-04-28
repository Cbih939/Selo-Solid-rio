// Arquivo: src/pages/admin5/ListUsersPage/ListUsersPage.jsx

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListUsersPage.module.css';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const ListUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [ongs, setOngs] = useState([]); 
  const [selectedOngId, setSelectedOngId] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingUser, setEditingUser] = useState(null); 
  const [userToDelete, setUserToDelete] = useState(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome Completo' },
    { key: 'email', label: 'E-mail' },
    { key: 'cpf', label: 'CPF' },
    { key: 'seal_balance', label: 'Saldo de Selos' }
  ];

  useEffect(() => {
    const fetchOngs = async () => {
      try {
        const response = await api.get('/ongs');
        setOngs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao buscar OSCs:", error);
      }
    };
    fetchOngs();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const endpoint = selectedOngId === 'all' ? '/users' : `/ongs/${selectedOngId}/users`;
        const response = await api.get(endpoint, {
          params: { search: searchTerm }
        });
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        setUsers([]);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedOngId]);

  // Calcula o total de selos dos utilizadores que estão a ser exibidos na tela
  const totalSealsOnScreen = users.reduce((acc, user) => acc + (parseInt(user.seal_balance) || 0), 0);

  // Função para Imprimir a Lista atual em PDF
  const handlePrintUserList = () => {
    if (users.length === 0) return alert("Não há utilizadores para imprimir.");
    
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setTextColor(234, 88, 12);
    doc.text("SELO CIDADANIA - Diretório de Beneficiários", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const filterText = selectedOngId === 'all' ? 'Visão Global (Todas as OSCs)' : `Filtrado por Instituição`;
    doc.text(`Filtro: ${filterText} | Total de Selos: ${totalSealsOnScreen}`, 14, 22);

    const tableData = users.map(u => [
      u.id, 
      u.name, 
      u.cpf || 'N/A', 
      u.ong_name || 'N/A', 
      `${u.seal_balance} Selos`
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Nome Completo', 'CPF', 'Instituição (OSC)', 'Saldo Atual']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 }
    });

    doc.save('Lista_Beneficiarios_SeloCidadania.pdf');
  };

  const handleEdit = async (user) => {
    try {
      const response = await api.get(`/users/${user.id}/details`);
      
      setEditingUser({
        ...response.data.usuario,
        dependents: response.data.dependentes || [],
        new_password: ''
      });
      setShowPassword(false);
      setEditModalOpen(true);
    } catch (error) {
      console.error(`Erro ao buscar detalhes do usuário ${user.id}:`, error);
      alert("Não foi possível carregar os dados completos do usuário para edição.");
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);

    const dataToUpdate = {
      name: editingUser.name,
      email: editingUser.email,
      cpf: editingUser.cpf,
      phone: editingUser.phone,
    };

    if (editingUser.new_password) {
      dataToUpdate.password = editingUser.new_password;
    }

    try {
      await api.put(`/users/${editingUser.id}`, dataToUpdate);
      setEditModalOpen(false);
      alert("Usuário atualizado com sucesso!");
      
      const endpoint = selectedOngId === 'all' ? '/users' : `/ongs/${selectedOngId}/users`;
      const response = await api.get(endpoint, { params: { search: searchTerm } });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Ocorreu um erro ao atualizar. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setDeleteModalOpen(false);
      alert("Usuário excluído com sucesso!");
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Ocorreu um erro ao excluir o usuário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentWrapper title="Base Global de Beneficiários">
      
      <div className={styles.headerBlock}>
        <h2 className={styles.mainTitle}>Gestão de Beneficiários</h2>
        <p className={styles.introText}>
          Abaixo encontra-se a lista central de todos os utilizadores (beneficiários) cadastrados na plataforma. Selecione uma OSC específica para filtrar os dados.
        </p>
      </div>

      {/* --- BARRA DE FILTROS AVANÇADOS E IMPRESSÃO --- */}
      <div className={styles.filterSection}>
        <div className={styles.searchRow}>
          <div style={{ flex: 1.5 }}>
            <InputField 
              label="🔍 Pesquisa Direta" 
              name="search" 
              placeholder="Pesquisar por nome, CPF, e-mail ou ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className={styles.filterGroup}>
             <label className={styles.filterLabel}>Filtrar por Instituição (OSC)</label>
             <select 
                className={styles.filterSelect} 
                value={selectedOngId} 
                onChange={(e) => setSelectedOngId(e.target.value)}
             >
                <option value="all">🌐 Todas as OSCs (Visão Global)</option>
                {ongs.map(ong => (
                  <option key={ong.id} value={ong.id}>
                    {ong.fantasy_name || ong.corporate_name}
                  </option>
                ))}
             </select>
          </div>
        </div>
        
        {/* ++ NOVA BARRA DE RESUMO E IMPRESSÃO ++ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ fontSize: '0.95rem', color: '#475569' }}>
              A exibir: <strong>{users.length}</strong> beneficiário(s)
            </span>
            <span style={{ fontSize: '0.95rem', color: '#ea580c', fontWeight: 'bold' }}>
              🪙 Total em Selos: {totalSealsOnScreen}
            </span>
          </div>
          
          <Button onClick={handlePrintUserList} style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', padding: '8px 16px', fontSize: '0.85rem' }}>
            🖨️ Imprimir Lista (PDF)
          </Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <Table headers={headers} data={users} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {/* MODAL DE EDIÇÃO */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Beneficiário">
        {editingUser && (
          <form onSubmit={handleUpdate} className={styles.modalForm}>
            
            <div className={styles.sectionBlock}>
              <h3 className={styles.formSectionTitle}>Identificação do Titular</h3>
              <div className={styles.grid2}>
                <div style={{ gridColumn: 'span 2' }}>
                  <InputField label="Nome Completo" name="name" value={editingUser.name || ''} onChange={handleFormChange} required />
                </div>
                <InputField label="CPF" name="cpf" value={editingUser.cpf || ''} onChange={handleFormChange} />
                <InputField label="Telefone / WhatsApp" name="phone" value={editingUser.phone || ''} onChange={handleFormChange} />
              </div>
              
              <div className={styles.grid2}>
                <InputField label="E-mail de Login" name="email" type="email" value={editingUser.email || ''} onChange={handleFormChange} />
                
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Nova Senha de Acesso</label>
                  <div className={styles.passwordWrapper}>
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="new_password" 
                      value={editingUser.new_password || ''} 
                      onChange={handleFormChange} 
                      placeholder="Deixe em branco para não alterar"
                      className={styles.passwordInput}
                    />
                    <span 
                      className={styles.eyeIconBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO DE DEPENDENTES */}
            {editingUser.dependents && editingUser.dependents.length > 0 && (
              <div className={styles.sectionBlock}>
                <h3 className={styles.formSectionTitle}>Dependentes Cadastrados</h3>
                <div className={styles.dependentsList}>
                  {editingUser.dependents.map((dep, idx) => (
                    <div key={dep.id || idx} className={styles.dependentCard}>
                      <div className={styles.dependentHeader}>
                        <h4>{dep.nome || dep.full_name || dep.name || `Dependente ${idx + 1}`}</h4>
                        <span className={styles.depBadge}>{dep.kinship || dep.relationship || 'Familiar'}</span>
                      </div>
                      <div className={styles.dependentInfo}>
                        <span><strong>Data de Nasc:</strong> {dep.birth_date || dep.data_nascimento ? new Date(dep.birth_date || dep.data_nascimento).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        <span><strong>CPF:</strong> {dep.cpf || 'Não informado'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} disabled={isSubmitting}>
                {isSubmitting ? 'A Salvar...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL DE EXCLUSÃO */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {userToDelete && (
          <div className={styles.modalContent}>
            <p className={styles.warningText}>Tem a certeza de que deseja excluir o beneficiário <strong>{userToDelete.name}</strong>?</p>
            <p className={styles.subWarningText}>Esta ação é irreversível e excluirá todo o saldo, dossiê e histórico familiar deste usuário do sistema.</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'A Excluir...' : 'Sim, Excluir Beneficiário'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ContentWrapper>
  );
};

export default ListUsersPage;