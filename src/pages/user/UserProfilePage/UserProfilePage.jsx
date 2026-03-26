// Arquivo: pages/user/UserProfilePage/UserProfilePage.jsx

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

  // 1. IDENTIFICAÇÃO PESSOAL
  const [personalData, setPersonalData] = useState({
    name: '', cpf: '', phone: '', email: '', password: '', profile_photo: '',
    mothers_name: '', birth_date: '', rg: '', gender: '', sexual_orientation: ''
  });

  // 2. ENDEREÇO E HABITAÇÃO
  const [addressData, setAddressData] = useState({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    residence_time: '', housing_type: ''
  });

  // 3. CONDIÇÕES DE MORADIA
  const [housingConditions, setHousingConditions] = useState({
    rooms_count: '', has_water: false, has_sanitation: false, has_electricity: false
  });

  // 4. COMPOSIÇÃO FAMILIAR
  const [familyData, setFamilyData] = useState({
    family_income: '', household_size: '', education_level: '', employment_status: '',
    social_benefits: []
  });

  // 5. MAPEAMENTO COMUNITÁRIO
  const [communityData, setCommunityData] = useState({
    public_services_access: [], main_needs: [], traditional_community: ''
  });

  const [dependents, setDependents] = useState([]);

  // --- CARREGAR DADOS DO BANCO ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get(`/users/me/profile`); // Rota correta que trás os dados mapeados
        const data = res.data;
        
        setPersonalData({
          name: data.name || '', cpf: data.cpf || '', phone: data.phone || '', email: data.email || '', password: '', profile_photo: data.profile_photo || '',
          mothers_name: data.mothers_name || '', birth_date: data.birth_date || '', rg: data.rg || '', gender: data.gender || '', sexual_orientation: data.sexual_orientation || ''
        });

        setAddressData({
          cep: data.cep || '', logradouro: data.logradouro || '', numero: data.numero || '', complemento: data.complemento || '', bairro: data.bairro || '', cidade: data.cidade || '', estado: data.estado || '',
          residence_time: data.residence_time || '', housing_type: data.housing_type || ''
        });

        setHousingConditions({
          rooms_count: data.rooms_count || '',
          has_water: !!data.has_water, has_sanitation: !!data.has_sanitation, has_electricity: !!data.has_electricity
        });

        setFamilyData({
          family_income: data.family_income || '', household_size: data.household_size || '', education_level: data.education_level || '', employment_status: data.employment_status || '',
          social_benefits: data.social_benefits || []
        });

        setCommunityData({
          public_services_access: data.public_services_access || [], main_needs: data.main_needs || [], traditional_community: data.traditional_community || ''
        });

        if (data.dependents) {
          const loadedDependents = data.dependents.map(dep => {
            const isSameAddress = dep.cep === data.cep && dep.numero === data.numero;
            return {
              ...dep, name: dep.full_name || dep.name, birth_date: dep.birth_date ? dep.birth_date.split('T')[0] : '', sameAddress: isSameAddress,
              address: { cep: dep.cep || '', logradouro: dep.logradouro || '', numero: dep.numero || '', complemento: dep.complemento || '', bairro: dep.bairro || '', cidade: dep.cidade || '', estado: dep.estado || '' }
            };
          });
          setDependents(loadedDependents);
        }
      } catch (err) {
        setErrorMsg("Erro ao carregar os seus dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // --- FUNÇÕES DE DEPENDENTES E FOTOS (MANTIDAS INTACTAS) ---
  const addDependent = () => setDependents([...dependents, { name: '', kinship: '', birth_date: '', cpf: '', profile_photo: '', sameAddress: true, address: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' } }]);
  const removeDependent = (index) => { const updated = [...dependents]; updated.splice(index, 1); setDependents(updated); };
  const updateDependent = (index, field, value) => { const updated = [...dependents]; updated[index][field] = value; setDependents(updated); };
  const updateDependentAddress = (index, field, value) => { const updated = [...dependents]; updated[index].address[field] = value; setDependents(updated); };
  const handleMainPhotoUpload = async (e) => { const file = e.target.files[0]; if (file) { const base64 = await convertToBase64(file); setPersonalData({ ...personalData, profile_photo: base64 }); } };
  const handleDependentPhotoUpload = async (index, e) => { const file = e.target.files[0]; if (file) { const base64 = await convertToBase64(file); updateDependent(index, 'profile_photo', base64); } };

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
            updated[dependentIndex].address = { ...updated[dependentIndex].address, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf };
            setDependents(updated);
          } else {
            setAddressData({ ...addressData, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf });
          }
        }
      } catch (err) { console.error(err); }
    }
  };

  // Lidar com Checkboxes de Arrays (Benefícios, Serviços, Necessidades)
  const handleCheckboxArray = (stateObj, setStateFunc, category, item) => {
    const currentList = stateObj[category];
    const newList = currentList.includes(item) ? currentList.filter(i => i !== item) : [...currentList, item];
    setStateFunc({ ...stateObj, [category]: newList });
  };

  // --- SALVAR ALTERAÇÕES ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErrorMsg(''); setSuccessMsg('');

    try {
      const formattedDependents = dependents.map(dep => {
        const baseDep = { name: dep.name, full_name: dep.name, kinship: dep.kinship, birth_date: dep.birth_date, cpf: dep.cpf, profile_photo: dep.profile_photo, same_address: dep.sameAddress };
        if (!dep.sameAddress && dep.address) return { ...baseDep, ...dep.address };
        return baseDep;
      });

      const payload = {
        // Dados Planos enviamos todos misturados para o backend
        ...personalData,
        address: addressData, // Envia o objeto address (porque o backend antigo espera assim)
        residence_time: addressData.residence_time, housing_type: addressData.housing_type, // Envia campos novos soltos
        ...housingConditions,
        ...familyData,
        ...communityData,
        dependents: formattedDependents
      };

      await api.put(`/users/${user.id}/profile`, payload);
      setSuccessMsg('O seu Perfil de Mapeamento Social foi atualizado com sucesso!');
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
    <ContentWrapper title="Mapeamento Social e Perfil">
      <div className={styles.formContainer}>
        
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <p className={styles.introText}>
          Bem-vindo ao seu Mapeamento Social. As informações abaixo ajudam a OSC a conhecer melhor a sua realidade e a encaminhar as melhores oportunidades e benefícios para a sua família.
        </p>

        <form onSubmit={handleSubmit}>
          
          {/* SESSÃO 1: IDENTIFICAÇÃO */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>1. Dados de Identificação Pessoal</h3>
            
            <div className={styles.profilePhotoSection}>
              <div className={styles.avatarPreview}>
                {personalData.profile_photo ? <img src={personalData.profile_photo} alt="Avatar" className={styles.avatarImg} /> : <span className={styles.avatarPlaceholder}>📷</span>}
              </div>
              <div className={styles.photoUploadControls}>
                <label className={styles.photoUploadLabel}>
                  Alterar Foto
                  <input type="file" accept="image/*" onChange={handleMainPhotoUpload} className={styles.hiddenInput} />
                </label>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}><label>Nome Completo *</label><input type="text" required value={personalData.name} onChange={e => setPersonalData({...personalData, name: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>Nome da Mãe *</label><input type="text" required value={personalData.mothers_name} onChange={e => setPersonalData({...personalData, mothers_name: e.target.value})} /></div>
            </div>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}><label>Data de Nascimento *</label><input type="date" required value={personalData.birth_date} onChange={e => setPersonalData({...personalData, birth_date: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>CPF (opcional)</label><input type="text" value={personalData.cpf} onChange={e => setPersonalData({...personalData, cpf: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>RG (opcional)</label><input type="text" value={personalData.rg} onChange={e => setPersonalData({...personalData, rg: e.target.value})} /></div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.inputGroup}>
                <label>Gênero *</label>
                <select required value={personalData.gender} onChange={e => setPersonalData({...personalData, gender: e.target.value})}>
                  <option value="">Selecione...</option><option value="Feminino">Feminino</option><option value="Masculino">Masculino</option><option value="Outro">Outro</option><option value="Prefiro não informar">Prefiro não informar</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Orientação Sexual (Opcional)</label>
                <select value={personalData.sexual_orientation} onChange={e => setPersonalData({...personalData, sexual_orientation: e.target.value})}>
                  <option value="">Selecione...</option><option value="Heterossexual">Heterossexual</option><option value="Homossexual">Homossexual</option><option value="Bissexual">Bissexual</option><option value="Outro">Outro</option><option value="Prefiro não informar">Prefiro não informar</option>
                </select>
              </div>
              <div className={styles.inputGroup}><label>Telefone / WhatsApp</label><input type="text" value={personalData.phone} onChange={e => setPersonalData({...personalData, phone: e.target.value})} /></div>
            </div>

            {/* Apenas E-mail e Senha aqui */}
            <div className={styles.grid2}>
              <div className={styles.inputGroup}><label>E-mail de Acesso</label><input type="email" disabled value={personalData.email} className={styles.inputDisabled} /></div>
              <div className={styles.inputGroup}><label>Alterar Senha <small>(vazio para manter)</small></label><input type="password" value={personalData.password} onChange={e => setPersonalData({...personalData, password: e.target.value})} /></div>
            </div>
          </div>

          {/* SESSÃO 2: LOCALIZAÇÃO E HABITAÇÃO */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>2. Localização e Tipo de Habitação</h3>
            
            <div className={styles.grid3}>
              <div className={styles.inputGroup}><label>CEP</label><input type="text" value={addressData.cep} onChange={e => { setAddressData({...addressData, cep: e.target.value}); handleCepSearch(e.target.value); }} /></div>
              <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Logradouro / Rua</label><input type="text" value={addressData.logradouro} onChange={e => setAddressData({...addressData, logradouro: e.target.value})} /></div>
            </div>

            <div className={styles.grid4}>
              <div className={styles.inputGroup}><label>Número</label><input type="text" value={addressData.numero} onChange={e => setAddressData({...addressData, numero: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>Complemento</label><input type="text" value={addressData.complemento} onChange={e => setAddressData({...addressData, complemento: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>Bairro</label><input type="text" value={addressData.bairro} onChange={e => setAddressData({...addressData, bairro: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>Cidade</label><input type="text" value={addressData.cidade} onChange={e => setAddressData({...addressData, cidade: e.target.value})} /></div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}><label>Tempo de Residência no Local</label><input type="text" placeholder="Ex: 5 anos" value={addressData.residence_time} onChange={e => setAddressData({...addressData, residence_time: e.target.value})} /></div>
              <div className={styles.inputGroup}>
                <label>Tipo de Habitação</label>
                <select value={addressData.housing_type} onChange={e => setAddressData({...addressData, housing_type: e.target.value})}>
                  <option value="">Selecione...</option><option value="Própria">Própria</option><option value="Alugada">Alugada</option><option value="Cedida">Cedida</option><option value="Ocupação">Ocupação / Área Irregular</option>
                </select>
              </div>
            </div>
          </div>

          {/* SESSÃO 3: CONDIÇÕES DE MORADIA */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>3. Condições de Moradia</h3>
            <div className={styles.grid2}>
              <div className={styles.inputGroup}><label>Número de Cômodos na Casa</label><input type="number" placeholder="Ex: 4" value={housingConditions.rooms_count} onChange={e => setHousingConditions({...housingConditions, rooms_count: e.target.value})} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <label className={styles.checkboxLabel}><input type="checkbox" checked={housingConditions.has_water} onChange={e => setHousingConditions({...housingConditions, has_water: e.target.checked})} /> Possui acesso à água encanada regular?</label>
                <label className={styles.checkboxLabel}><input type="checkbox" checked={housingConditions.has_sanitation} onChange={e => setHousingConditions({...housingConditions, has_sanitation: e.target.checked})} /> Possui acesso a rede de esgoto/saneamento?</label>
                <label className={styles.checkboxLabel}><input type="checkbox" checked={housingConditions.has_electricity} onChange={e => setHousingConditions({...housingConditions, has_electricity: e.target.checked})} /> Possui acesso à energia elétrica regular?</label>
              </div>
            </div>
          </div>

          {/* SESSÃO 4: COMPOSIÇÃO FAMILIAR */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>4. Composição Familiar e Socioeconômica</h3>
            
            <div className={styles.grid2}>
              <div className={styles.inputGroup}><label>Renda Familiar Total (Estimativa R$)</label><input type="text" placeholder="Ex: R$ 1.500,00" value={familyData.family_income} onChange={e => setFamilyData({...familyData, family_income: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>Total de Pessoas que Moram na Casa</label><input type="number" value={familyData.household_size} onChange={e => setFamilyData({...familyData, household_size: e.target.value})} /></div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Escolaridade do Titular</label>
                <select value={familyData.education_level} onChange={e => setFamilyData({...familyData, education_level: e.target.value})}>
                  <option value="">Selecione...</option><option value="Nenhuma">Nenhuma</option><option value="Educação Infantil">Educação Infantil</option><option value="Ensino Fundamental I">Ensino Fundamental I</option><option value="Ensino Fundamental II">Ensino Fundamental II</option><option value="Ensino Médio">Ensino Médio</option><option value="Ensino Superior">Ensino Superior (Graduação)</option><option value="Pós-Graduação">Pós-Graduação</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Situação de Trabalho do Titular</label>
                <select value={familyData.employment_status} onChange={e => setFamilyData({...familyData, employment_status: e.target.value})}>
                  <option value="">Selecione...</option><option value="Assalariado">Trabalho Fixo (Assalariado)</option><option value="Autônomo">Autônomo / Bico</option><option value="Desempregado">Desempregado</option><option value="Aposentado">Aposentado</option><option value="Estudante">Apenas Estudante</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup} style={{ marginTop: '15px' }}>
              <label>A família recebe algum destes benefícios sociais? (Marque as opções)</label>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '5px' }}>
                {['Bolsa Família', 'BPC (Benefício de Prestação Continuada)', 'Auxílio Gás'].map(benefit => (
                  <label key={benefit} className={styles.checkboxLabel}>
                    <input type="checkbox" checked={familyData.social_benefits.includes(benefit)} onChange={() => handleCheckboxArray(familyData, setFamilyData, 'social_benefits', benefit)} /> {benefit}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SESSÃO 5: COMUNIDADE E DEPENDENTES */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>5. Perfil Comunitário e Dependentes</h3>
            
            <div className={styles.inputGroup}>
              <label>Acesso a Serviços Públicos na Região:</label>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {['CRAS/CREAS', 'Posto de Saúde (UBS)', 'Escola Pública / Creche'].map(service => (
                  <label key={service} className={styles.checkboxLabel}>
                    <input type="checkbox" checked={communityData.public_services_access.includes(service)} onChange={() => handleCheckboxArray(communityData, setCommunityData, 'public_services_access', service)} /> {service}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup} style={{ marginTop: '15px' }}>
              <label>Quais as maiores necessidades da sua família hoje?</label>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {['Educação', 'Saúde', 'Renda/Emprego', 'Moradia Digna', 'Segurança Alimentar (Comida)'].map(need => (
                  <label key={need} className={styles.checkboxLabel}>
                    <input type="checkbox" checked={communityData.main_needs.includes(need)} onChange={() => handleCheckboxArray(communityData, setCommunityData, 'main_needs', need)} /> {need}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup} style={{ marginTop: '15px' }}>
              <label>Pertence a Povos ou Comunidades Tradicionais?</label>
              <select value={communityData.traditional_community} onChange={e => setCommunityData({...communityData, traditional_community: e.target.value})}>
                <option value="">Não</option><option value="Quilombola">Sim - Comunidade Quilombola</option><option value="Indígena">Sim - Comunidade Indígena</option><option value="Ribeirinha">Sim - Comunidade Ribeirinha</option>
              </select>
            </div>

            <hr style={{ margin: '30px 0', border: '1px solid #e2e8f0' }}/>
            
            {/* DEPENDENTES (MANTIDO EXATAMENTE IGUAL) */}
            <div className={styles.dependentHeader}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Meus Dependentes</h3>
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
                            <div className={styles.inputGroup}><label>Número</label><input type="text" value={dep.address.numero} onChange={e => updateDependentAddress(index, 'numero', e.target.value)} /></div>
                            <div className={styles.inputGroup}><label>Complemento</label><input type="text" value={dep.address.complemento} onChange={e => updateDependentAddress(index, 'complemento', e.target.value)} /></div>
                            <div className={styles.inputGroup}><label>Bairro</label><input type="text" value={dep.address.bairro} onChange={e => updateDependentAddress(index, 'bairro', e.target.value)} /></div>
                          </div>
                          <div className={styles.grid2}>
                            <div className={styles.inputGroup}><label>Cidade</label><input type="text" value={dep.address.cidade} onChange={e => updateDependentAddress(index, 'cidade', e.target.value)} /></div>
                            <div className={styles.inputGroup}><label>UF</label><input type="text" value={dep.address.estado} onChange={e => updateDependentAddress(index, 'estado', e.target.value)} /></div>
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
              {saving ? 'A Guardar...' : 'Salvar Mapeamento Social'}
            </Button>
          </div>

        </form>
      </div>
    </ContentWrapper>
  );
};

export default UserProfilePage;