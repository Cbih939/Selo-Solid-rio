import React, { useState, useEffect } from 'react';
import api from '../../../api/api';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import InputField from '../../../components/ui/InputField/InputField';
import styles from './MyDependentsPage.module.css';

// Componente do Modal de Edição/Criação
const DependentModal = ({ dependent, onClose, onSave, isNew }) => {
  const [formData, setFormData] = useState(
    dependent || { fullName: '', cpf: '', phone: '', relationship: '' }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>{isNew ? 'Adicionar Novo Dependente' : 'Editar Dependente'}</h2>
        <form onSubmit={handleSubmit}>
          <InputField label="Nome Completo" name="fullName" value={formData.fullName} onChange={handleChange} required />
          <InputField label="CPF (Opcional)" name="cpf" value={formData.cpf} onChange={handleChange} mask="cpf" />
          <InputField label="Telefone (Opcional)" name="phone" value={formData.phone} onChange={handleChange} mask="phone" />
          <InputField label="Grau de Parentesco" name="relationship" placeholder="Ex: Filho(a), Cônjuge" value={formData.relationship} onChange={handleChange} required />
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
    try {
      setLoading(true);
      const response = await api.get('/users/me/dependents');
      setDependents(response.data);
    } catch (err) {
      setError('Não foi possível carregar os dependentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchDependents = async () => {
    try {
      const response = await api.get('/users/me/dependents');
      setDependents(response.data);
    } catch (error) {
      console.error("Erro ao buscar dependentes:", error);
    }
  };

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

    try {
      await api[method](url, data);
      handleCloseModal();
      fetchDependents(); // Recarrega a lista
      alert(`Dependente ${isNew ? 'adicionado' : 'atualizado'} com sucesso!`);
    } catch (err) {
      alert('Ocorreu um erro ao salvar o dependente.');
    }
  };

  const handleDeleteDependent = async (dependentId) => {
    if (window.confirm('Tem certeza que deseja excluir este dependente?')) {
      try {
        await api.delete(`/users/me/dependents/${dependentId}`);
        fetchDependents(); // Recarrega a lista
        alert('Dependente excluído com sucesso.');
      } catch (err) {
        alert('Ocorreu um erro ao excluir o dependente.');
      }
    }
  };

  if (loading) return <p>A carregar...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <ContentWrapper title="Meus Dependentes">
        <div className={styles.header}>
          <p>Gestão dos seus dependentes. Você pode adicionar até 20.</p>
          <Button onClick={() => handleOpenModal()} disabled={dependents.length >= 20}>
            + Adicionar Dependente
          </Button>
        </div>
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
            {dependents.map(dep => (
              <tr key={dep.id}>
                <td>{dep.full_name}</td>
                <td>{dep.relationship}</td>
                <td>{dep.cpf || 'N/A'}</td>
                <td>{dep.phone || 'N/A'}</td>
                <td className={styles.actionsCell}>
                  <Button onClick={() => handleOpenModal(dep)} variant="secondary" size="small">Editar</Button>
                  <Button onClick={() => handleDeleteDependent(dep.id)} variant="danger" size="small">Excluir</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
