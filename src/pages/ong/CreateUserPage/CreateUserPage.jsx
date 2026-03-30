// Arquivo: src/pages/ong/CreateUserPage/CreateUserPage.jsx

import React, { useState } from 'react';
import styles from './CreateUserPage.module.css';
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

const CreateUserPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
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

  // --- FUNÇÕES DE DEPENDENTES E FOTOS ---
  const addDependent = () => setDependents([...dependents, { name: '', kinship: '', birth_date: '', cpf: '', profile_photo: '', sameAddress: true, address: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' } }]);
  const removeDependent = (index) => { const updated = [...dependents]; updated.splice(index, 1); setDependents(updated); };
  const updateDependent = (index, field, value) => { const updated = [...dependents]; updated[index][field] = value; setDependents(updated); };
  const updateDependentAddress = (index, field, value) => { const updated = [...dependents]; updated[index].address[field] = value; setDependents(updated); };
  
  const handleMainPhotoUpload = async (e) => { const file = e.target.files[0]; if (file) { const base64 = await convertToBase64(file); setPersonalData({ ...personalData, profile_photo: base64 }); } };
  const handleDependentPhotoUpload = async (index, e) => { const file = e.target.files[0]; if (file) { const base64 = await convertToBase64(file); updateDependent(index, 'profile_photo', base64); } };

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
      } catch (err) { console.error("Erro ao buscar CEP", err); }
    }
  };

  const handleCheckboxArray = (stateObj, setStateFunc, category, item) => {
    const currentList = stateObj[category];
    const newList = currentList.includes(item) ? currentList.filter(i => i !== item) : [...currentList, item];
    setStateFunc({ ...stateObj, [category]: newList });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(''); setSuccessMsg('');

    try {
      const formattedDependents = dependents.map(dep => {
        const baseDep = { name: dep.name, full_name: dep.name, kinship: dep.kinship, birth_date: dep.birth_date, cpf: dep.cpf, profile_photo: dep.profile_photo, same_address: dep.sameAddress };
        if (!dep.sameAddress && dep.address) return { ...baseDep, ...dep.address };
        return baseDep;
      });

      const payload = {
        ...personalData,
        role: 'user',
        ong_id: user.ong_id || user.id,
        address: addressData,
        residence_time: addressData.residence_time, housing_type: addressData.housing_type,
        ...housingConditions,
        ...familyData,
        ...communityData,
        dependents: formattedDependents
      };

      await api.post('/users', payload);

      setSuccessMsg('Beneficiário cadastrado com sucesso!');
      window.scrollTo(0, 0);
      
      // Reseta o formulário
      setPersonalData({ name: '', cpf: '', phone: '', email: '', password: '', profile_photo: '', mothers_name: '', birth_date: '', rg: '', gender: '', sexual_orientation: '' });
      setAddressData({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', residence_time: '', housing_type: '' });
      setHousingConditions({ rooms_count: '', has_water: false, has_sanitation: false, has_electricity: false });
      setFamilyData({ family_income: '', household_size: '', education_level: '', employment_status: '', social_benefits: [] });
      setCommunityData({ public_services_access: [], main_needs: [], traditional_community: '' });
      setDependents([]);

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

        <p className={styles.introText}>
          Bem-vindo ao cadastro de Mapeamento Social. Preencha as informações abaixo para registar uma nova família na plataforma.
        </p>

        {/* ++ BLOCO DE CONVITE ADICIONADO AQUI ++ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.1rem' }}>Preferia que a própria família preenchesse?</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>Envie o link de auto-cadastro para o WhatsApp do beneficiário. Ele já ficará vinculado à sua OSC automaticamente.</p>
          </div>
          <Button 
            type="button"
            onClick={() => {
              const inviteLink = `${window.location.origin}/cadastro?ong=${user?.ong_id || user?.id}`;
              navigator.clipboard.writeText(inviteLink)
                .then(() => alert('✅ Link de convite copiado!\n\nCole no WhatsApp e envie para a família.'))
                .catch(() => alert('Erro ao copiar o link.'));
            }}
            style={{ backgroundColor: '#10b981', borderColor: '#10b981', whiteSpace: 'nowrap' }}
          >
            📋 Copiar Link de Convite
          </Button>
        </div>

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
                  Selecionar Foto
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
              <div className={styles.inputGroup}><label>CPF *</label><input type="text" required value={personalData.cpf} onChange={e => setPersonalData({...personalData, cpf: e.target.value})} /></div>
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

            <div className={styles.grid2}>
              <div className={styles.inputGroup}><label>E-mail de Acesso *</label><input type="email" required value={personalData.email} onChange={e => setPersonalData({...personalData, email: e.target.value})} /></div>
              <div className={styles.inputGroup}><label>Senha Inicial *</label><input type="password" required value={personalData.password} onChange={e => setPersonalData({...personalData, password: e.target.value})} /></div>
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
              <label>Quais as maiores necessidades da família hoje?</label>
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
            
            {/* DEPENDENTES */}
            <div className={styles.dependentHeader}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Dependentes</h3>
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
                          <img src={dep.profile_photo} alt="Avatar Dependente" className={styles.avatarImg} />
                        ) : (
                          <span className={styles.avatarPlaceholderSm}>📷</span>
                        )}
                      </div>
                      <div className={styles.photoUploadControls}>
                        <label className={styles.photoUploadLabelSm}>
                          Foto do Dependente
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