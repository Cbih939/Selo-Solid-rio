import React, { useState, useEffect } from 'react';
import styles from './UserProfilePage.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const UserProfilePage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [personalData, setPersonalData] = useState({
    name: '', cpf: '', phone: '', email: '', password: '', profile_photo: ''
  });

  const [addressData, setAddressData] = useState({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
  });

  const [dependents, setDependents] = useState([]);

  // Carregar dados existentes
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get(`/users/${user.id}`);
        const data = res.data;
        
        setPersonalData({
          name: data.name || '',
          cpf: data.cpf || '',
          phone: data.phone || '',
          email: data.email || '',
          password: '', // A senha vem vazia por segurança
          profile_photo: data.profile_photo || ''
        });

        setAddressData({
          cep: data.cep || '', logradouro: data.logradouro || '', numero: data.numero || '',
          complemento: data.complemento || '', bairro: data.bairro || '', cidade: data.cidade || '', estado: data.estado || ''
        });

        if (data.dependents) {
          const loadedDependents = data.dependents.map(dep => ({
            ...dep,
            birth_date: dep.birth_date ? dep.birth_date.split('T')[0] : '', // Formata data para input
            sameAddress: false, // Assume false para carregar o endereço gravado no BD dele
            address: {
              cep: dep.cep || '', logradouro: dep.logradouro || '', numero: dep.numero || '',
              complemento: dep.complemento || '', bairro: dep.bairro || '', cidade: dep.cidade || '', estado: dep.estado || ''
            }
          }));
          setDependents(loadedDependents);
        }
      } catch (err) {
        setErrorMsg("Erro ao carregar os seus dados.");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) fetchUserData();
  }, [user]);

  // Gestão de Dependentes
  const addDependent = () => {
    setDependents([...dependents, {
      name: '', kinship: '', birth_date: '', cpf: '', profile_photo: '', sameAddress: true,
      address: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }
    }]);
  };

  const removeDependent = (index) => {
    const updated = [...dependents];
    updated.splice(index, 1);
    setDependents(updated);
  };

  const updateDependent = (index, field, value) => {
    const updated = [...dependents];
    updated[index][field] = value;
    setDependents(updated);
  };

  const updateDependentAddress = (index, field, value) => {
    const updated = [...dependents];
    updated[index].address[field] = value;
    setDependents(updated);
  };

  // Upload de Fotos
  const handleMainPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setPersonalData({ ...personalData, profile_photo: base64 });
    }
  };

  const handleDependentPhotoUpload = async (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertToBase64(file);
      updateDependent(index, 'profile_photo', base64);
    }
  };

  // Busca CEP
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
              logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf
            };
            setDependents(updated);
          } else {
            setAddressData({
              ...addressData, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf
            });
          }
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: personalData.name,
        phone: personalData.phone,
        password: personalData.password,
        profile_photo: personalData.profile_photo,
        address: addressData,
        dependents: dependents
      };

      await api.put(`/users/${user.id}`, payload);
      
      setSuccessMsg('O seu perfil foi atualizado com sucesso!');
      window.scrollTo(0, 0);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ContentWrapper title="Meu Perfil"><p style={{padding:'20px'}}>A carregar perfil...</p></ContentWrapper>;

  return (
    <ContentWrapper title="Meu Perfil e Dependentes">
      <div className={styles.formContainer}>
        
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <p className={styles.introText}>
          Mantenha os seus dados e os dos seus dependentes sempre atualizados. 
          <strong> O seu E-mail e CPF não podem ser alterados.</strong>
        </p>

        <form onSubmit={handleSubmit}>
          
          {/* SESSÃO 1: DADOS DO TITULAR */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>1. Meus Dados Pessoais</h3>
            
            <div className={styles.profilePhotoSection}>
              <div className={styles.avatarPreview}>
                {personalData.profile_photo ? (
                  <img src={personalData.profile_photo} alt="Avatar" className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarPlaceholder}>📷</span>
                )}
              </div>
              <div className={styles.photoUploadControls}>
                <label className={styles.photoUploadLabel}>
                  Alterar Foto de Perfil
                  <input type="file" accept="image/*" onChange={handleMainPhotoUpload} className={styles.hiddenInput} />
                </label>
                <small>Opcional (1080x1080px)</small>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Nome Completo *</label>
                <input type="text" required value={personalData.name} onChange={e => setPersonalData({...personalData, name: e.target.value})} />
              </div>
              <div className={styles.inputGroup}>
                <label>CPF <small>(Não pode ser alterado)</small></label>
                <input type="text" value={personalData.cpf} disabled className={styles.inputDisabled} />
              </div>
            </div>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>E-mail <small>(Não pode ser alterado)</small></label>
                <input type="email" value={personalData.email} disabled className={styles.inputDisabled} />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefone / WhatsApp</label>
                <input type="text" value={personalData.phone} onChange={e => setPersonalData({...personalData, phone: e.target.value})} />
              </div>
              <div className={styles.inputGroup}>
                <label>Nova Senha <small>(Deixe em branco para manter)</small></label>
                <input type="password" value={personalData.password} onChange={e => setPersonalData({...personalData, password: e.target.value})} placeholder="******" />
              </div>
            </div>
          </div>

          {/* SESSÃO 2: ENDEREÇO */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>2. Meu Endereço</h3>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>CEP</label>
                <input type="text" value={addressData.cep} 
                  onChange={e => {
                    setAddressData({...addressData, cep: e.target.value});
                    handleCepSearch(e.target.value);
                  }} 
                />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                <label>Logradouro / Rua</label>
                <input type="text" value={addressData.logradouro} onChange={e => setAddressData({...addressData, logradouro: e.target.value})} />
              </div>
            </div>

            <div className={styles.grid4}>
              <div className={styles.inputGroup}>
                <label>Número</label>
                <input type="text" value={addressData.numero} onChange={e => setAddressData({...addressData, numero: e.target.value})} />
              </div>
              <div className={styles.inputGroup}>
                <label>Complemento</label>
                <input type="text" value={addressData.complemento} onChange={e => setAddressData({...addressData, complemento: e.target.value})} />
              </div>
              <div className={styles.inputGroup}>
                <label>Bairro</label>
                <input type="text" value={addressData.bairro} onChange={e => setAddressData({...addressData, bairro: e.target.value})} />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Cidade</label>
                <input type="text" value={addressData.cidade} onChange={e => setAddressData({...addressData, cidade: e.target.value})} />
              </div>
              <div className={styles.inputGroup}>
                <label>Estado (UF)</label>
                <input type="text" value={addressData.estado} onChange={e => setAddressData({...addressData, estado: e.target.value})} maxLength="2" />
              </div>
            </div>
          </div>

          {/* SESSÃO 3: DEPENDENTES */}
          <div className={styles.sectionBlock}>
            <div className={styles.dependentHeader}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>3. Meus Dependentes</h3>
              <button type="button" onClick={addDependent} className={styles.addBtn}>+ Adicionar Dependente</button>
            </div>

            {dependents.length === 0 ? (
              <p className={styles.emptyMsg}>Não tem dependentes cadastrados.</p>
            ) : (
              <div className={styles.dependentsList}>
                {dependents.map((dep, index) => (
                  <div key={index} className={styles.dependentCard}>
                    <div className={styles.dependentCardHeader}>
                      <h4>{dep.name ? dep.name : `Novo Dependente ${index + 1}`}</h4>
                      <button type="button" onClick={() => removeDependent(index)} className={styles.removeBtn}>🗑️ Remover</button>
                    </div>

                    <div className={styles.profilePhotoSectionSm}>
                      <div className={styles.avatarPreviewSm}>
                        {dep.profile_photo ? (
                          <img src={dep.profile_photo} alt="Avatar" className={styles.avatarImg} />
                        ) : (
                          <span className={styles.avatarPlaceholderSm}>📷</span>
                        )}
                      </div>
                      <div className={styles.photoUploadControls}>
                        <label className={styles.photoUploadLabelSm}>
                          Adicionar/Alterar Foto
                          <input type="file" accept="image/*" onChange={(e) => handleDependentPhotoUpload(index, e)} className={styles.hiddenInput} />
                        </label>
                      </div>
                    </div>

                    <div className={styles.grid2}>
                      <div className={styles.inputGroup}>
                        <label>Nome Completo *</label>
                        <input type="text" required value={dep.name} onChange={e => updateDependent(index, 'name', e.target.value)} />
                      </div>
                      <div className={styles.grid2}>
                        <div className={styles.inputGroup}>
                          <label>Parentesco *</label>
                          <input type="text" required value={dep.kinship} onChange={e => updateDependent(index, 'kinship', e.target.value)} />
                        </div>
                        <div className={styles.inputGroup}>
                          <label>Data Nascimento *</label>
                          <input type="date" required value={dep.birth_date} onChange={e => updateDependent(index, 'birth_date', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.inputGroup} style={{ maxWidth: '300px' }}>
                      <label>CPF (Opcional)</label>
                      <input type="text" value={dep.cpf || ''} onChange={e => updateDependent(index, 'cpf', e.target.value)} />
                    </div>

                    <div className={styles.dependentAddressBlock}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" checked={dep.sameAddress} onChange={e => updateDependent(index, 'sameAddress', e.target.checked)} />
                        Este dependente mora comigo no mesmo endereço
                      </label>

                      {!dep.sameAddress && (
                        <div className={styles.addressFormInner}>
                          <div className={styles.grid3}>
                            <div className={styles.inputGroup}>
                              <label>CEP</label>
                              <input type="text" value={dep.address.cep} onChange={e => { updateDependentAddress(index, 'cep', e.target.value); handleCepSearch(e.target.value, true, index); }} />
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
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'A Guardar...' : 'Salvar Todas as Alterações'}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default UserProfilePage;