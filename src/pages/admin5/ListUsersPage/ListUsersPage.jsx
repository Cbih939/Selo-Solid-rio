import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import styles from './ListUsersPage.module.css';

const ListUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para o modal de edição. Armazena o usuário completo e seus dependentes.
  const [editingUser, setEditingUser] = useState(null); 
  
  // Estado para o modal de exclusão.
  const [userToDelete, setUserToDelete] = useState(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // ### CORREÇÃO 1: Adicionado 'cpf' aos cabeçalhos da tabela ###
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'cpf', label: 'CPF' }, // Novo campo na tabela
    { key: 'seal_balance', label: 'Selos' }
  ];

  // Efeito para buscar a lista de usuários com base na pesquisa
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users', {
          params: { search: searchTerm }
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // ### CORREÇÃO 2: Função de edição agora busca dados detalhados do usuário ###
  const handleEdit = async (user) => {
    try {
      // Faz uma chamada à API para obter os dados completos do usuário, incluindo dependentes
      const response = await api.get(`/users/${user.id}/details`);
      
      // Armazena os dados completos (usuário + dependentes) no estado de edição
      setEditingUser({
        ...response.data.usuario, // Dados do usuário (id, nome, email, etc.)
        dependents: response.data.dependentes || [], // Lista de dependentes
        new_password: '' // Campo extra para a nova senha
      });
      
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

  // Função para lidar com mudanças nos campos do formulário de edição
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: value }));
  };

  // ### CORREÇÃO 3: Função de atualização envia apenas os dados necessários ###
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    // Prepara o objeto de dados para enviar, excluindo a lista de dependentes
    const dataToUpdate = {
      name: editingUser.name,
      email: editingUser.email,
      cpf: editingUser.cpf,
      phone: editingUser.phone,
    };

    // Adiciona a nova senha ao objeto apenas se ela foi preenchida
    if (editingUser.new_password) {
      dataToUpdate.password = editingUser.new_password;
    }

    try {
      await api.put(`/users/${editingUser.id}`, dataToUpdate);
      setEditModalOpen(false);
      alert("Usuário atualizado com sucesso!");
      // Atualiza a lista principal para refletir as mudanças
      const response = await api.get('/users', { params: { search: searchTerm } });
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Ocorreu um erro ao atualizar. Verifique os dados e tente novamente.");
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setDeleteModalOpen(false);
      alert("Usuário excluído com sucesso!");
      // Remove o usuário da lista localmente para uma resposta visual imediata
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Ocorreu um erro ao excluir o usuário.");
    }
  };

  return (
    <ContentWrapper title="Listar Beneficiários">
      <InputField label="Pesquisar por nome, email ou CPF" name="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <Table headers={headers} data={users} onEdit={handleEdit} onDelete={handleDelete} />

      {/* ### CORREÇÃO 4: Modal de Edição Aprimorado ### */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Beneficiário">
        {editingUser && (
          <form onSubmit={handleUpdate}>
            <h3 className={styles.formSectionTitle}>Dados do Usuário</h3>
            <InputField label="Nome Completo" name="name" value={editingUser.name} onChange={handleFormChange} />
            <InputField label="E-mail" name="email" type="email" value={editingUser.email} onChange={handleFormChange} />
            <InputField label="CPF" name="cpf" value={editingUser.cpf || ''} onChange={handleFormChange} />
            <InputField label="Telefone" name="phone" value={editingUser.phone || ''} onChange={handleFormChange} />
            <InputField label="Nova Senha (deixe em branco para não alterar)" name="new_password" type="password" value={editingUser.new_password} onChange={handleFormChange} />

            {/* Seção para listar os dependentes */}
            {editingUser.dependents.length > 0 && (
              <>
                <h3 className={styles.formSectionTitle}>Dependentes Cadastrados</h3>
                <ul className={styles.dependentsList}>
                  {editingUser.dependents.map(dep => (
                    <li key={dep.id}>
                      <strong>{dep.nome}</strong> (Nascimento: {new Date(dep.data_nascimento).toLocaleDateString('pt-BR')})
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className={styles.modalActions}>
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar Exclusão">
        {userToDelete && (
          <div className={styles.modalContent}>
            <p>Tem a certeza de que deseja excluir o Beneficiário <strong>{userToDelete.name}</strong>?</p>
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

export default ListUsersPage;
