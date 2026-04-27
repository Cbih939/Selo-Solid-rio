// Arquivo: src/pages/admin5/CreateUserAdminPage/CreateUserAdminPage.jsx

import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import FormSection from '../../../components/ui/FormSection/FormSection';
import api from '../../../api/api';
import { maskCPF, maskPhone, validateCPF, validateEmail } from '../../../utils/validators';
import styles from './CreateUserAdminPage.module.css';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const CreateUserAdminPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    dependents: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Manipulação de Dependentes ---
  const addDependent = () => {
    setFormData({
      ...formData,
      dependents: [...formData.dependents, { fullName: '', cpf: '', relationship: '', birth_date: '', phone: '' }]
    });
  };

  const removeDependent = (index) => {
    const newDependents = formData.dependents.filter((_, i) => i !== index);
    setFormData({ ...formData, dependents: newDependents });
  };

  const handleDependentChange = (index, field, value) => {
    const newDependents = [...formData.dependents];
    
    // Aplica máscaras nos dependentes
    if (field === 'cpf') value = maskCPF(value);
    if (field === 'phone') value = maskPhone(value);

    newDependents[index][field] = value;
    setFormData({ ...formData, dependents: newDependents });
  };

  // --- Manipulação do Titular ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplica máscaras em tempo real
    if (name === 'cpf') formattedValue = maskCPF(value);
    if (name === 'phone') formattedValue = maskPhone(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Limpa o erro ao digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // --- Lógica de Validação ---
  const validateForm = () => {
    const newErrors = {};

    // Validação Nome
    if (!formData.name.trim()) newErrors.name = "O nome completo é obrigatório.";
    else if (formData.name.split(' ').length < 2) newErrors.name = "Digite o nome e o sobrenome.";

    // Validação Email
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Formato de e-mail inválido.";
    }

    // Validação CPF
    if (!formData.cpf) newErrors.cpf = "O CPF é obrigatório.";
    else if (!validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido.";

    // Validação Senha
    if (!formData.password) newErrors.password = "A senha é obrigatória.";
    else if (formData.password.length < 6) newErrors.password = "A senha deve ter no mínimo 6 caracteres.";

    // Validação Telefone
    if (formData.phone && formData.phone.length < 14) {
      newErrors.phone = "Telefone incompleto.";
    }

    // Validação de Dependentes
    formData.dependents.forEach((dep, index) => {
      if (!dep.fullName) newErrors[`dep_name_${index}`] = "Nome é obrigatório.";
      if (!dep.relationship) newErrors[`dep_rel_${index}`] = "Parentesco é obrigatório.";
      if (!dep.birth_date) newErrors[`dep_date_${index}`] = "Data de nascimento é obrigatória.";
      if (dep.cpf && !validateCPF(dep.cpf)) newErrors[`dep_cpf_${index}`] = "CPF inválido.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    if (!validateForm()) {
      setErrorMsg("Por favor, corrija os erros destacados no formulário antes de continuar.");
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);
    try {
      await api.post('/users', formData); 
      setSuccessMsg("Beneficiário cadastrado com sucesso!");
      setFormData({ name: '', email: '', cpf: '', phone: '', password: '', dependents: [] });
      setErrors({});
      window.scrollTo(0, 0);

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      setErrorMsg(error.response?.data?.message || "Ocorreu um erro ao cadastrar o beneficiário.");
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWrapper title="Administração: Cadastrar Beneficiário">
      <div className={styles.formWrapper}>
        
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <div className={styles.headerBlock}>
          <h2 className={styles.mainTitle}>Novo Beneficiário Global</h2>
          <p className={styles.introText}>
            Preencha os dados abaixo para registrar um novo beneficiário diretamente no sistema central. Pode adicionar também a composição familiar (dependentes).
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          
          <FormSection number="1" title="Dados do Titular">
            <InputField 
              label="Nome Completo *" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Ex: Maria da Silva Santos"
              error={errors.name}
            />
            
            <div className={styles.row}>
              <InputField 
                label="CPF *" 
                name="cpf" 
                value={formData.cpf} 
                onChange={handleChange} 
                placeholder="000.000.000-00"
                maxLength="14"
                error={errors.cpf}
              />
              <InputField 
                label="Telefone / WhatsApp" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="(11) 99999-9999"
                maxLength="15"
                error={errors.phone}
              />
            </div>

            <div className={styles.row}>
              <InputField 
                label="E-mail de Acesso" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="exemplo@email.com"
                error={errors.email}
              />
              
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Senha Inicial (Provisória) *</label>
                <div className={styles.passwordWrapper}>
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Mínimo 6 caracteres"
                    className={`${styles.passwordInput} ${errors.password ? styles.inputError : ''}`}
                  />
                  <span 
                    className={styles.eyeIconBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </span>
                </div>
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              </div>
            </div>
          </FormSection>

          <FormSection number="2" title="Composição Familiar (Dependentes)">
            {formData.dependents.length === 0 && (
              <p className={styles.emptyDependents}>Nenhum dependente adicionado. Clique no botão abaixo para incluir familiares.</p>
            )}

            {formData.dependents.map((dep, index) => (
              <div key={index} className={styles.dependentCard}>
                <div className={styles.dependentHeader}>
                  <h4>Dependente #{index + 1}</h4>
                  <button type="button" onClick={() => removeDependent(index)} className={styles.removeBtn}>
                    🗑️ Remover
                  </button>
                </div>
                
                <InputField 
                  label="Nome Completo *" 
                  value={dep.fullName} 
                  onChange={(e) => handleDependentChange(index, 'fullName', e.target.value)}
                  placeholder="Nome do familiar"
                  error={errors[`dep_name_${index}`]}
                />
                
                <div className={styles.row}>
                  <InputField 
                    label="Parentesco *" 
                    value={dep.relationship} 
                    onChange={(e) => handleDependentChange(index, 'relationship', e.target.value)}
                    placeholder="Ex: Filho(a)"
                    error={errors[`dep_rel_${index}`]}
                  />
                  <InputField 
                    label="Data de Nascimento *" 
                    type="date" 
                    value={dep.birth_date} 
                    onChange={(e) => handleDependentChange(index, 'birth_date', e.target.value)}
                    error={errors[`dep_date_${index}`]}
                  />
                </div>

                <div className={styles.row}>
                  <InputField 
                    label="CPF (Opcional)" 
                    value={dep.cpf} 
                    onChange={(e) => handleDependentChange(index, 'cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength="14"
                    error={errors[`dep_cpf_${index}`]}
                  />
                </div>
              </div>
            ))}
            
            <Button type="button" variant="secondary" onClick={addDependent} className={styles.addBtn}>
              + Adicionar Dependente
            </Button>
          </FormSection>

          <div className={styles.formActions}>
            <Button type="submit" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', padding: '12px 24px', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'A Guardar...' : '✅ Cadastrar Beneficiário'}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default CreateUserAdminPage;