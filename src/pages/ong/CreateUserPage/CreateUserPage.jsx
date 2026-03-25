// Arquivo: src/pages/ong/CreateUserPage/CreateUserPage.jsx

import React, { useState } from 'react';
import styles from './CreateUserPage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const CreateUserPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Dados do Titular
  const [personalData, setPersonalData] = useState({
    name: '', cpf: '', phone: '', email: '', password: ''
  });

  // 2. Dados de Endereço (Titular)
  const [addressData, setAddressData] = useState({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
  });

  // 3. Dependentes
  const [dependents, setDependents] = useState([]);

  // Adicionar novo dependente vazio à lista
  const addDependent = () => {
    setDependents([...dependents, {
      name: '', kinship: '', birth_date: '', cpf: '',
      sameAddress: true, // Por padrão, assume que mora com o titular
      address: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }
    }]);
  };

  // Remover dependente
  const removeDependent = (index) => {
    const updated = [...dependents];
    updated.splice(index, 1);
    setDependents(updated);
  };

  // Atualizar campo de um dependente específico
  const updateDependent = (index, field, value) => {
    const updated = [...dependents];
    updated[index][field] = value;
    setDependents(updated);
  };

  // Atualizar campo de endereço de um dependente específico
  const updateDependentAddress = (index, field, value) => {
    const updated = [...dependents];
    updated[index].address[field] = value;
    setDependents(updated);
  };

  // Busca de CEP Automática (ViaCEP)
  const handleCepSearch = async (cep, isDependent = false, dependentIndex = null) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (isDependent) {
            const updated = [...dependents];
            updated[dependentIndex].address = {
              ...updated[dependentIndex].address,
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf
            };
            setDependents(updated);
          } else {
            setAddressData({
              ...addressData,
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf
            });
          }
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        ...personalData,
        role: 'user',
        ong_id: user.ong_id || user.id, // ID da OSC logada
        address: addressData,
        dependents: dependents
      };

      await api.post('/users', payload); // Ajuste a rota se necessário

      setSuccessMsg('Beneficiário cadastrado com sucesso!');
      // Limpa o formulário
      setPersonalData({ name: '', cpf: '', phone: '', email: '', password: '' });
      setAddressData({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
      setDependents([]);

      // Ocultar mensagem de sucesso após 5s
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Erro ao cadastrar beneficiário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWrapper title="Cadastrar Novo Beneficiário">
      <div className={styles.formContainer}>
        
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* SESSÃO 1: DADOS DO TITULAR */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>1. Dados do Titular</h3>
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome Completo *</label>
                <input type="text" required value={personalData.name} onChange={e => setPersonalData({...personalData, name: e.target.value})} placeholder="Ex: João da Silva" />
              </div>
              <div className={styles.inputGroup}>
                <label>CPF *</label>
                <input type="text" required value={personalData.cpf} onChange={e => setPersonalData({...personalData, cpf: e.target.value})} placeholder="Apenas números" />
              </div>
            </div>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>Telefone / WhatsApp (Opcional)</label>
                <input type="text" value={personalData.phone} onChange={e => setPersonalData({...personalData, phone: e.target.value})} placeholder="(00) 00000-0000" />
              </div>
              <div className={styles.inputGroup}>
                <label>E-mail *</label>
                <input type="email" required value={personalData.email} onChange={e => setPersonalData({...personalData, email: e.target.value})} placeholder="exemplo@email.com" />
              </div>
              <div className={styles.inputGroup}>
                <label>Senha de Acesso *</label>
                <input type="password" required value={personalData.password} onChange={e => setPersonalData({...personalData, password: e.target.value})} placeholder="Defina uma senha" />
              </div>
            </div>
          </div>

          {/* SESSÃO 2: ENDEREÇO */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>2. Endereço <span className={styles.optionalBadge}>(Opcional)</span></h3>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>CEP</label>
                <input type="text" value={addressData.cep} 
                  onChange={e => {
                    setAddressData({...addressData, cep: e.target.value});
                    handleCepSearch(e.target.value);
                  }} 
                  placeholder="00000-000" 
                />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                <label>Logradouro / Rua</label>
                <input type="text" value={addressData.logradouro} onChange={e => setAddressData({...addressData, logradouro: e.target.value})} placeholder="Ex: Rua das Flores" />
              </div>
            </div>

            <div className={styles.grid4}>
              <div className={styles.inputGroup}>
                <label>Número</label>
                <input type="text" value={addressData.numero} onChange={e => setAddressData({...addressData, numero: e.target.value})} placeholder="123" />
              </div>
              <div className={styles.inputGroup}>
                <label>Complemento</label>
                <input type="text" value={addressData.complemento} onChange={e => setAddressData({...addressData, complemento: e.target.value})} placeholder="Apt 4B" />
              </div>
              <div className={styles.inputGroup}>
                <label>Bairro</label>
                <input type="text" value={addressData.bairro} onChange={e => setAddressData({...addressData, bairro: e.target.value})} placeholder="Centro" />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Cidade</label>
                <input type="text" value={addressData.cidade} onChange={e => setAddressData({...addressData, cidade: e.target.value})} placeholder="Sua Cidade" />
              </div>
              <div className={styles.inputGroup}>
                <label>Estado (UF)</label>
                <input type="text" value={addressData.estado} onChange={e => setAddressData({...addressData, estado: e.target.value})} placeholder="SP" maxLength="2" />
              </div>
            </div>
          </div>

          {/* SESSÃO 3: DEPENDENTES */}
          <div className={styles.sectionBlock}>
            <div className={styles.dependentHeader}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>3. Dependentes (Filhos/Familiares)</h3>
              <button type="button" onClick={addDependent} className={styles.addBtn}>+ Adicionar Dependente</button>
            </div>

            {dependents.length === 0 ? (
              <p className={styles.emptyMsg}>Nenhum dependente adicionado. Clique no botão acima para adicionar.</p>
            ) : (
              <div className={styles.dependentsList}>
                {dependents.map((dep, index) => (
                  <div key={index} className={styles.dependentCard}>
                    <div className={styles.dependentCardHeader}>
                      <h4>Dependente {index + 1}</h4>
                      <button type="button" onClick={() => removeDependent(index)} className={styles.removeBtn}>Remover</button>
                    </div>

                    <div className={styles.grid2}>
                      <div className={styles.inputGroup}>
                        <label>Nome Completo *</label>
                        <input type="text" required value={dep.name} onChange={e => updateDependent(index, 'name', e.target.value)} />
                      </div>
                      <div className={styles.grid2}>
                        <div className={styles.inputGroup}>
                          <label>Parentesco *</label>
                          <input type="text" required value={dep.kinship} onChange={e => updateDependent(index, 'kinship', e.target.value)} placeholder="Ex: Filho(a)" />
                        </div>
                        <div className={styles.inputGroup}>
                          <label>Data Nascimento *</label>
                          <input type="date" required value={dep.birth_date} onChange={e => updateDependent(index, 'birth_date', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.inputGroup} style={{ maxWidth: '300px' }}>
                      <label>CPF (Opcional)</label>
                      <input type="text" value={dep.cpf} onChange={e => updateDependent(index, 'cpf', e.target.value)} />
                    </div>

                    {/* Endereço do Dependente */}
                    <div className={styles.dependentAddressBlock}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={dep.sameAddress} 
                          onChange={e => updateDependent(index, 'sameAddress', e.target.checked)} 
                        />
                        Este dependente mora no mesmo endereço do titular
                      </label>

                      {!dep.sameAddress && (
                        <div className={styles.addressFormInner}>
                          <div className={styles.grid3}>
                            <div className={styles.inputGroup}>
                              <label>CEP</label>
                              <input type="text" value={dep.address.cep} 
                                onChange={e => {
                                  updateDependentAddress(index, 'cep', e.target.value);
                                  handleCepSearch(e.target.value, true, index);
                                }} 
                              />
                            </div>
                            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                              <label>Rua</label>
                              <input type="text" value={dep.address.logradouro} onChange={e => updateDependentAddress(index, 'logradouro', e.target.value)} />
                            </div>
                          </div>
                          <div className={styles.grid4}>
                            <div className={styles.inputGroup}>
                              <label>Número</label>
                              <input type="text" value={dep.address.numero} onChange={e => updateDependentAddress(index, 'numero', e.target.value)} />
                            </div>
                            <div className={styles.inputGroup}>
                              <label>Complemento</label>
                              <input type="text" value={dep.address.complemento} onChange={e => updateDependentAddress(index, 'complemento', e.target.value)} />
                            </div>
                            <div className={styles.inputGroup}>
                              <label>Bairro</label>
                              <input type="text" value={dep.address.bairro} onChange={e => updateDependentAddress(index, 'bairro', e.target.value)} />
                            </div>
                          </div>
                          <div className={styles.grid2}>
                            <div className={styles.inputGroup}>
                              <label>Cidade</label>
                              <input type="text" value={dep.address.cidade} onChange={e => updateDependentAddress(index, 'cidade', e.target.value)} />
                            </div>
                            <div className={styles.inputGroup}>
                              <label>UF</label>
                              <input type="text" value={dep.address.estado} onChange={e => updateDependentAddress(index, 'estado', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'A Guardar...' : 'Concluir Cadastro'}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default CreateUserPage;