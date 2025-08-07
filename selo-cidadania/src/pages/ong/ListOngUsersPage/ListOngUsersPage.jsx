import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Table from '../../../components/ui/Table/Table';
import InputField from '../../../components/ui/InputField/InputField';
import api from '../../../api/api';

// A página agora recebe o 'user' logado como propriedade
const ListOngUsersPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'seal_balance', label: 'Selos' }
  ];

  useEffect(() => {
    // Garante que só faz o pedido se o ID da ONG estiver disponível
    if (user && user.ong_id) {
      const fetchOngUsers = async () => {
        try {
          // Usa a nova rota da API para ir buscar apenas os utilizadores desta ONG
          const response = await api.get(`/ongs/${user.ong_id}/users`, {
            params: { search: searchTerm }
          });
          setUsers(response.data);
        } catch (error) {
          console.error("Erro ao buscar utilizadores da ONG:", error);
        }
      };
      
      const delayDebounceFn = setTimeout(() => {
        fetchOngUsers();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [user, searchTerm]); // A busca é refeita se o utilizador ou a pesquisa mudarem

  return (
    <ContentWrapper title="Usuários da ONG">
      <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <InputField
          label="Pesquisar por nome ou email"
          name="search"
          placeholder="Digite para pesquisar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Table headers={headers} data={users} />
    </ContentWrapper>
  );
};

export default ListOngUsersPage;