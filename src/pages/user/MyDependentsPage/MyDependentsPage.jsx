import React, { useState, useEffect } from 'react';
import api from '../../../api/api';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import InputField from '../../../components/ui/InputField/InputField';
import styles from './MyDependentsPage.module.css';

// Componente do Modal de Edição/Criação
const DependentModal = ({ dependent, onClose, onSave, isNew }) => {
  const [formData, setFormData] = useState({
    fullName: dependent?.full_name || '', 
    cpf: dependent?.cpf || '',
    phone: dependent?.phone || '',
    relationship: dependent?.relationship || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: dependent?.id, ...formData });
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>{isNew ? 'Adicionar Novo Dependente' : 'Editar Dependente'}</h2>
        <form onSubmit={handleSubmit}>
          <InputField 
            label="Nome Completo" 
            name="fullName" 
            value={formData.fullName} 
            onChange={handleChange} 
            required 
          />
          <InputField 
            label="Grau de Parentesco" 
            name="relationship" 
            placeholder="Ex: Filho(a), Cônjuge" 
            value={formData.relationship} 
            onChange={handleChange} 
            required 
          />
          {/* Removido o 'required' para tornar opcional no HTML */}
          <InputField 
            label="CPF (Opcional)" 
            name="cpf" 
            value={formData.cpf} 
            onChange={handleChange} 
            mask="cpf" 
          />
          <InputField 
            label="Telefone (Opcional)" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            mask="phone" 
          />
          <div className={styles.modalActions}>
            <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyDependentsPage = () => {
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState(null);

  const fetchDependents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users/me/dependents');
      setDependents(response.data);
    } catch (err) {
      console.error("Erro ao buscar dependentes:", err);
      setError('Não foi possível carregar a lista de dependentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependents();
  }, []);

  const handleOpenModal = (dependent = null) => {
    setEditingDependent(dependent);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDependent(null);
  };

  const handleSaveDependent = async (data) => {
    const isNew = !data.id;
    const url = isNew ? '/users/me/dependents' : `/users/me/dependents/${data.id}`;
    const method = isNew ? 'post' : 'put';

    // CORREÇÃO: Tratamento para campos opcionais
    // Se o valor for apenas espaços ou vazio, enviamos null para o servidor
    const payload = {
      ...data,
      cpf: data.cpf?.trim() === '' ? null : data.cpf,
      phone: data.phone?.trim() === '' ? null : data.phone
    };

    try {
      await api[method](url, payload);
      handleCloseModal();
      await fetchDependents();
      alert(`Dependente ${isNew ? 'adicionado' : 'atualizado'} com sucesso!`);
    } catch (err) {
      console.error("Erro ao salvar dependente:", err);
      const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao salvar os dados.';
      alert(`Falha ao salvar: ${errorMessage}`);
    }
  };

  const handleDeleteDependent = async (dependentId) => {
    if (window.confirm('Tem certeza que deseja excluir este dependente?')) {
      try {
        await api.delete(`/users/me/dependents/${dependentId}`);
        await fetchDependents();
        alert('Dependente excluído com sucesso.');
      } catch (err) {
        console.error("Erro ao excluir dependente:", err);
        alert('Ocorreu um erro ao excluir o dependente.');
      }
    }
  };

  if (loading) return <ContentWrapper title="Meus Dependentes"><p>A carregar...</p></ContentWrapper>;
  if (error) return <ContentWrapper title="Meus Dependentes"><p className={styles.error}>{error}</p></ContentWrapper>;

  return (
    <>
      <ContentWrapper title="Meus Dependentes">
        <div className={styles.header}>
          <p>Gestão dos seus dependentes. Você pode adicionar até 20.</p>
          <Button onClick={() => handleOpenModal()} disabled={dependents.length >= 20}>
            + Adicionar Dependente
          </Button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>Parentesco</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dependents.length > 0 ? (
                dependents.map(dep => (
                  <tr key={dep.id}>
                    <td data-label="Nome">{dep.full_name}</td>
                    <td data-label="Parentesco">{dep.relationship}</td>
                    <td data-label="CPF">{dep.cpf || 'N/A'}</td>
                    <td data-label="Telefone">{dep.phone || 'N/A'}</td>
                    <td className={styles.actionsCell}>
                      <Button onClick={() => handleOpenModal(dep)} variant="secondary" size="small">Editar</Button>
                      <Button onClick={() => handleDeleteDependent(dep.id)} variant="danger" size="small">Excluir</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.noDependents}>Você ainda não possui dependentes cadastrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ContentWrapper>
      {isModalOpen && (
        <DependentModal
          dependent={editingDependent}
          onClose={handleCloseModal}
          onSave={handleSaveDependent}
          isNew={!editingDependent}
        />
      )}
    </>
  );
};

export default MyDependentsPage;