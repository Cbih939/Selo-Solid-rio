import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreatePrizePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/prizes', formData);
      alert(`Prémio "${response.data.name}" criado com sucesso!`);
      // Limpa o formulário
      setFormData({ name: '', cost: '' });
    } catch (error) {
      console.error("Erro ao criar prémio:", error);
      alert("Ocorreu um erro ao criar o prémio. Verifique a consola.");
    }
  };

  return (
    <ContentWrapper title="Cadastrar Prêmio">
      <form onSubmit={handleSubmit}>
        <InputField 
          label="Nome do Prêmio" 
          name="name" 
          placeholder="Ex: Ingresso de Cinema" 
          value={formData.name}
          onChange={handleChange}
        />
        <InputField 
          label="Custo em Selos" 
          type="number" 
          name="cost" 
          placeholder="Ex: 50" 
          value={formData.cost}
          onChange={handleChange}
        />
        <div style={{maxWidth: '300px'}}>
            <Button type="submit">Cadastrar Prêmio</Button>
        </div>
      </form>
    </ContentWrapper>
  );
};

export default CreatePrizePage;