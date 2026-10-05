import React, { useState, useEffect, useMemo } from 'react';
import styles from './UserProfilePage.module.css';
import formStyles from '../../../components/family/FamilyForm.module.css';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import Button from '../../../components/ui/Button/Button';
import api from '../../../api/api';
import { Section, Field, Question, CheckGroup, RadioGroup, MoneyInput, Notice } from '../../../components/family/FormControls';
import FamilyProfileSections from '../../../components/family/FamilyProfileSections';
import SocioTriageForm from '../../../components/family/SocioTriageForm';
import {
  EDUCATION_OPTIONS, EMPLOYMENT_OPTIONS, FAMILY_SITUATIONS, KINSHIP_OPTIONS,
  mergeFamilyProfile, emptyFamilyProfile, computeComposition, ageFromBirthDate, sumValues, parseMoney, formatMoney
} from '../../../utils/familyProfile';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Atualização imutável por caminho ("renda.valores.salarios")
const setIn = (obj, path, value) => {
  const keys = path.split('.');
  const clone = { ...obj };
  let cur = clone;
  keys.slice(0, -1).forEach(k => { cur[k] = { ...(cur[k] || {}) }; cur = cur[k]; });
  cur[keys[keys.length - 1]] = value;
  return clone;
};

const yesNoSelect = (value, onChange) => (
  <select value={value || ''} onChange={e => onChange(e.target.value)}>
    <option value="">-</option><option value="Sim">Sim</option><option value="Não">Não</option>
  </select>
);

const UserProfilePage = ({ user, initialTab = 'cadastro' }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const currentUserRole = JSON.parse(localStorage.getItem('currentUser') || '{}').role;
  const isAdminOrOsc = currentUserRole === 'ong' || currentUserRole === 'admin1' || currentUserRole === 'admin5';
  const [activeTab, setActiveTab] = useState(isAdminOrOsc ? initialTab : 'cadastro');

  const [personalData, setPersonalData] = useState({
    name: '', cpf: '', phone: '', email: '', password: '', profile_photo: '',
    mothers_name: '', birth_date: '', rg: '', gender: '', sexual_orientation: '', race: ''
  });

  const [addressData, setAddressData] = useState({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    residence_time: '', housing_type: ''
  });

  const [roomsCount, setRoomsCount] = useState('');

  const [familyData, setFamilyData] = useState({ education_level: '', employment_status: '' });

  // Campos legados preservados (usados em relatórios)
  const [legacyData, setLegacyData] = useState({
    public_services_access: [], traditional_community: '', course_interest: '', pcd: ''
  });

  const [dependents, setDependents] = useState([]);
  const [profile, setProfile] = useState(emptyFamilyProfile());
  const [files, setFiles] = useState([]);
  const [profileMeta, setProfileMeta] = useState({ submitted_at: null, updated_at: null });

  const setField = (path, value) => setProfile(prev => setIn(prev, path, value));

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      try {
        const [res, familyRes] = await Promise.all([
          api.get(`/users/${user.id}`),
          api.get(`/family-profiles/${user.id}`).catch(err => { console.error(err); return null; })
        ]);
        const data = res.data;

        setPersonalData({
          name: data.name || '', cpf: data.cpf || '', phone: data.phone || '', email: data.email || '', password: '', profile_photo: data.profile_photo || '',
          mothers_name: data.mothers_name || '', birth_date: data.birth_date || '', rg: data.rg || '', gender: data.gender || '',
          sexual_orientation: data.sexual_orientation || '', race: data.race || ''
        });

        setAddressData({
          cep: data.cep || '', logradouro: data.logradouro || '', numero: data.numero || '', complemento: data.complemento || '', bairro: data.bairro || '', cidade: data.cidade || '', estado: data.estado || '',
          residence_time: data.residence_time || '', housing_type: data.housing_type || ''
        });

        setRoomsCount(data.rooms_count || '');
        setFamilyData({ education_level: data.education_level || '', employment_status: data.employment_status || '' });
        setLegacyData({
          public_services_access: data.public_services_access || [], traditional_community: data.traditional_community || '',
          course_interest: data.course_interest || '', pcd: data.pcd || ''
        });

        if (data.dependents) {
          const loadedDependents = data.dependents.map(dep => {
            const isSameAddress = dep.cep === data.cep && dep.numero === data.numero;
            return {
              ...dep, name: dep.full_name || dep.name, kinship: dep.kinship || dep.relationship || '',
              birth_date: dep.birth_date ? dep.birth_date.split('T')[0] : '', sameAddress: isSameAddress,
              works: dep.works || '', studies: dep.studies || '',
              monthly_income: dep.monthly_income !== null && dep.monthly_income !== undefined ? String(dep.monthly_income).replace('.', ',') : '',
              address: { cep: dep.cep || '', logradouro: dep.logradouro || '', numero: dep.numero || '', complemento: dep.complemento || '', bairro: dep.bairro || '', cidade: dep.cidade || '', estado: dep.estado || '' }
            };
          });
          setDependents(loadedDependents);
        }

        // Cadastro sociofamiliar: dados salvos ou pré-preenchimento com o cadastro antigo
        const saved = familyRes?.data?.data || {};
        const merged = mergeFamilyProfile(saved);
        if (!familyRes?.data?.updated_at) {
          const infra = [];
          if (data.has_water) infra.push('Água encanada');
          if (data.has_electricity) infra.push('Energia elétrica regular');
          if (data.has_sanitation) infra.push('Rede de esgoto');
          merged.infraestrutura = infra;
          merged.cadunico.beneficios = (data.social_benefits || []).filter(b => b !== 'Auxílio Gás').map(b => (b.startsWith('BPC') ? 'BPC – Benefício de Prestação Continuada' : b));
          merged.declaracao.nome = data.name || '';
        }
        setProfile(merged);
        setFiles(familyRes?.data?.files || []);
        setProfileMeta({ submitted_at: familyRes?.data?.submitted_at || null, updated_at: familyRes?.data?.updated_at || null });
      } catch (err) {
        setErrorMsg("Erro ao carregar os dados deste utilizador.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
    // recarrega apenas quando muda o beneficiário (evita perder edições em re-renderizações do App)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const composition = useMemo(() => computeComposition(personalData.birth_date, dependents), [personalData.birth_date, dependents]);
  const membersIncome = parseMoney(profile.identificacao.renda_mensal) + dependents.reduce((acc, d) => acc + parseMoney(d.monthly_income), 0);

  const addDependent = () => setDependents([...dependents, { name: '', kinship: '', birth_date: '', cpf: '', profile_photo: '', works: '', studies: '', monthly_income: '', sameAddress: true, address: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' } }]);
  const removeDependent = (index) => { const updated = [...dependents]; updated.splice(index, 1); setDependents(updated); };
  const updateDependent = (index, field, value) => { const updated = [...dependents]; updated[index] = { ...updated[index], [field]: value }; setDependents(updated); };
  const updateDependentAddress = (index, field, value) => { const updated = [...dependents]; updated[index] = { ...updated[index], address: { ...updated[index].address, [field]: value } }; setDependents(updated); };
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
            setDependents(prev => {
              const updated = [...prev];
              updated[dependentIndex] = { ...updated[dependentIndex], address: { ...updated[dependentIndex].address, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf } };
              return updated;
            });
          } else {
            setAddressData(prev => ({ ...prev, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
          }
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true); setErrorMsg(''); setSuccessMsg('');

    try {
      const formattedDependents = dependents.map(dep => {
        const baseDep = {
          name: dep.name, full_name: dep.name, kinship: dep.kinship, birth_date: dep.birth_date, cpf: dep.cpf, profile_photo: dep.profile_photo,
          same_address: dep.sameAddress, works: dep.works, studies: dep.studies, monthly_income: dep.monthly_income
        };
        if (!dep.sameAddress && dep.address) return { ...baseDep, address: dep.address, ...dep.address };
        return baseDep;
      });

      // Campos do cadastro antigo derivados do novo formulário (mantém relatórios e filtros funcionando)
      const rendaTotal = sumValues(profile.renda.valores);
      const infra = profile.infraestrutura;
      const benefits = profile.cadunico.beneficios.filter(b => b !== 'Não recebe benefício');
      const situacoes = profile.composicao.situacoes;

      const payload = {
        ...personalData,
        address: addressData,
        residence_time: addressData.residence_time,
        housing_type: addressData.housing_type,
        rooms_count: roomsCount,
        has_water: infra.includes('Água encanada'),
        has_sanitation: infra.includes('Rede de esgoto'),
        has_electricity: infra.includes('Energia elétrica regular'),
        family_income: rendaTotal ? rendaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        household_size: composition.total,
        education_level: familyData.education_level,
        employment_status: familyData.employment_status,
        social_benefits: benefits,
        main_needs: profile.necessidades.lista,
        public_services_access: legacyData.public_services_access,
        traditional_community: legacyData.traditional_community,
        course_interest: legacyData.course_interest,
        pcd: profile.saude.pcd === 'Sim' || situacoes.includes('Pessoa com deficiência que necessita de apoio/cuidados') ? 'Sim' : (profile.saude.pcd === 'Não' ? 'Não' : legacyData.pcd),
        dependents: formattedDependents
      };

      await api.put(`/users/${user.id}/profile`, payload);
      await api.put(`/family-profiles/${user.id}`, { data: profile });

      setSuccessMsg(profile.declaracao.ciente
        ? 'Cadastro sociofamiliar salvo com sucesso!'
        : 'Cadastro salvo. Para concluir, marque "Li e estou ciente" na seção 16 (Declaração).');
      setProfileMeta(prev => ({ ...prev, updated_at: new Date().toISOString() }));
      window.scrollTo(0, 0);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Erro ao atualizar perfil.');
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ContentWrapper title="Cadastro Sociofamiliar"><p style={{padding:'20px'}}>A carregar dados do utilizador...</p></ContentWrapper>;

  return (
    <ContentWrapper title={isAdminOrOsc ? `Beneficiário: ${personalData.name || ''}` : 'Cadastro e Perfil Sociofamiliar da Família'}>
      <div className={styles.formContainer}>

        {isAdminOrOsc && (
          <div className={formStyles.tabs}>
            <button type="button" className={`${formStyles.tab} ${activeTab === 'cadastro' ? formStyles.tabActive : ''}`} onClick={() => setActiveTab('cadastro')}>
              📋 Cadastro Sociofamiliar
            </button>
            <button type="button" className={`${formStyles.tab} ${activeTab === 'triagem' ? formStyles.tabActive : ''}`} onClick={() => setActiveTab('triagem')}>
              🔒 Triagem Socioeconômica (uso interno)
            </button>
          </div>
        )}

        {activeTab === 'triagem' && isAdminOrOsc ? (
          <SocioTriageForm
            user={{ id: user.id, name: personalData.name, birth_date: personalData.birth_date }}
            profile={profile} members={dependents} files={files}
          />
        ) : (
        <>
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <div className={styles.programHeader}>
          <strong>CADASTRO E PERFIL SOCIOFAMILIAR DA FAMÍLIA</strong>
          <span>PROGRAMA SELO CIDADANIA · Instituto Energizando Vidas</span>
          <small>Preenchimento pela pessoa responsável pela família
            {profileMeta.updated_at && <> · Última atualização: {new Date(profileMeta.updated_at).toLocaleDateString('pt-BR')}</>}
          </small>
        </div>

        <form onSubmit={handleSubmit}>

          <Section number="1" title="Finalidade do Cadastro">
            <Notice tone="muted">
              <p>Este formulário tem como finalidade conhecer o perfil das famílias participantes ou candidatas às ações do Programa Selo Cidadania, identificar situações de vulnerabilidade social, econômica e habitacional e subsidiar o planejamento dos atendimentos, benefícios, encaminhamentos e demais ações desenvolvidas pelo Instituto Energizando Vidas.</p>
              <p>As informações fornecidas serão analisadas pela equipe responsável e poderão, quando necessário, ser complementadas por documentos, entrevista, atendimento pelo Serviço Social ou visita domiciliar.</p>
              <p>O preenchimento deste formulário não gera direito automático ao recebimento de benefícios, doações, serviços ou participação em projetos específicos, pois os atendimentos observarão os critérios de cada ação, a situação de vulnerabilidade identificada e a capacidade de atendimento do Instituto.</p>
            </Notice>
          </Section>

          <Section number="2" title="Identificação da Pessoa Responsável pela Família">
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

            <div className={formStyles.grid2}>
              <Field label="Nome completo *"><input type="text" required value={personalData.name} onChange={e => setPersonalData({...personalData, name: e.target.value})} /></Field>
              <Field label="Nome social, se houver"><input type="text" value={profile.identificacao.nome_social} onChange={e => setField('identificacao.nome_social', e.target.value)} /></Field>
            </div>
            <div className={formStyles.grid3}>
              <Field label={`CPF ${isAdminOrOsc ? '*' : '(Não pode ser alterado)'}`}>
                <input type="text" value={personalData.cpf} onChange={e => setPersonalData({...personalData, cpf: e.target.value})} disabled={!isAdminOrOsc} required={isAdminOrOsc} />
              </Field>
              <Field label="Data de nascimento *"><input type="date" required value={personalData.birth_date} onChange={e => setPersonalData({...personalData, birth_date: e.target.value})} /></Field>
              <Field label="Telefone/WhatsApp"><input type="text" value={personalData.phone} onChange={e => setPersonalData({...personalData, phone: e.target.value})} /></Field>
            </div>
            <div className={formStyles.grid2}>
              <Field label="E-mail (acesso – não pode ser alterado)"><input type="email" disabled value={personalData.email} /></Field>
              <Field label="Alterar senha (deixe em branco para manter)">
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showPassword ? "text" : "password"} value={personalData.password} placeholder="******"
                    onChange={e => setPersonalData({...personalData, password: e.target.value})}
                    style={{ paddingRight: '40px' }}
                  />
                  <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </span>
                </div>
              </Field>
            </div>

            <Question label="Escolaridade:">
              <RadioGroup name="escolaridade" options={EDUCATION_OPTIONS.map(o => ({ key: o, label: o === 'Não alfabetizado' ? 'Não alfabetizado(a)' : o.replace('Fundamental', 'Ensino Fundamental').replace('Médio', 'Ensino Médio').replace('Superior', 'Ensino Superior').replace('Incompleto', 'incompleto').replace('Completo', 'completo') }))} columns={4}
                value={familyData.education_level} onChange={v => setFamilyData({ ...familyData, education_level: v })} />
            </Question>
            <Question label="Situação atual:">
              <RadioGroup name="situacao_atual" options={EMPLOYMENT_OPTIONS} columns={3}
                value={familyData.employment_status} onChange={v => setFamilyData({ ...familyData, employment_status: v })}
                extra={{ option: 'Outra', value: profile.identificacao.situacao_outra, onChange: v => setField('identificacao.situacao_outra', v) }} />
            </Question>

            <details className={styles.moreDetails}>
              <summary>Dados complementares (filiação, documentos e perfil)</summary>
              <div className={formStyles.grid3} style={{ marginTop: 14 }}>
                <Field label="Nome da mãe *"><input type="text" required value={personalData.mothers_name} onChange={e => setPersonalData({...personalData, mothers_name: e.target.value})} /></Field>
                <Field label="RG (opcional)"><input type="text" value={personalData.rg} onChange={e => setPersonalData({...personalData, rg: e.target.value})} /></Field>
                <Field label="Gênero *">
                  <select required value={personalData.gender} onChange={e => setPersonalData({...personalData, gender: e.target.value})}>
                    <option value="">Selecione...</option><option value="Feminino">Feminino</option><option value="Masculino">Masculino</option><option value="Outro">Outro</option><option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                </Field>
                <Field label="Orientação sexual (opcional)">
                  <select value={personalData.sexual_orientation} onChange={e => setPersonalData({...personalData, sexual_orientation: e.target.value})}>
                    <option value="">Selecione...</option><option value="Heterossexual">Heterossexual</option><option value="Homossexual">Homossexual</option><option value="Bissexual">Bissexual</option><option value="Outro">Outro</option><option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                </Field>
                <Field label="Raça/cor (opcional)">
                  <select value={personalData.race} onChange={e => setPersonalData({...personalData, race: e.target.value})}>
                    <option value="">Selecione...</option><option value="Branca">Branca</option><option value="Preta">Preta</option><option value="Parda">Parda</option><option value="Amarela">Amarela</option><option value="Indígena">Indígena</option><option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                </Field>
                <Field label="Povos ou comunidades tradicionais">
                  <select value={legacyData.traditional_community} onChange={e => setLegacyData({...legacyData, traditional_community: e.target.value})}>
                    <option value="">Não</option><option value="Quilombola">Sim - Comunidade Quilombola</option><option value="Indígena">Sim - Comunidade Indígena</option><option value="Ribeirinha">Sim - Comunidade Ribeirinha</option>
                  </select>
                </Field>
              </div>
            </details>
          </Section>

          <Section number="3" title="Endereço da Família">
            <div className={formStyles.grid4}>
              <Field label="CEP"><input type="text" value={addressData.cep} onChange={e => { setAddressData({...addressData, cep: e.target.value}); handleCepSearch(e.target.value); }} /></Field>
              <Field label="Rua" span={3}><input type="text" value={addressData.logradouro} onChange={e => setAddressData({...addressData, logradouro: e.target.value})} /></Field>
            </div>
            <div className={formStyles.grid4}>
              <Field label="Número"><input type="text" value={addressData.numero} onChange={e => setAddressData({...addressData, numero: e.target.value})} /></Field>
              <Field label="Complemento"><input type="text" value={addressData.complemento} onChange={e => setAddressData({...addressData, complemento: e.target.value})} /></Field>
              <Field label="Bairro" span={2}><input type="text" value={addressData.bairro} onChange={e => setAddressData({...addressData, bairro: e.target.value})} /></Field>
            </div>
            <div className={formStyles.grid4}>
              <Field label="Cidade" span={2}><input type="text" value={addressData.cidade} onChange={e => setAddressData({...addressData, cidade: e.target.value})} /></Field>
              <Field label="UF"><input type="text" maxLength={2} value={addressData.estado} onChange={e => setAddressData({...addressData, estado: e.target.value.toUpperCase()})} /></Field>
              <Field label="Há quanto tempo mora neste endereço?"><input type="text" placeholder="Ex: 5 anos" value={addressData.residence_time} onChange={e => setAddressData({...addressData, residence_time: e.target.value})} /></Field>
            </div>
            <Field label="Ponto de referência"><input type="text" value={profile.endereco.ponto_referencia} onChange={e => setField('endereco.ponto_referencia', e.target.value)} /></Field>
          </Section>

          <Section number="4" title="Composição Familiar" subtitle="Informe todas as pessoas que moram habitualmente na residência e integram o núcleo familiar.">
            {/* Responsável (linha 1 da composição) */}
            <div className={styles.dependentCard} style={{ marginBottom: 16 }}>
              <div className={styles.dependentCardHeader}>
                <h4>{personalData.name || 'Pessoa responsável'} <small style={{ color: '#64748b', fontWeight: 500 }}>· Responsável familiar{ageFromBirthDate(personalData.birth_date) !== null ? ` · ${ageFromBirthDate(personalData.birth_date)} anos` : ''}</small></h4>
              </div>
              <div className={formStyles.grid3}>
                <Field label="Trabalha?">{yesNoSelect(profile.identificacao.trabalha, v => setField('identificacao.trabalha', v))}</Field>
                <Field label="Estuda?">{yesNoSelect(profile.identificacao.estuda, v => setField('identificacao.estuda', v))}</Field>
                <Field label="Renda mensal aproximada"><MoneyInput value={profile.identificacao.renda_mensal} onChange={v => setField('identificacao.renda_mensal', v)} /></Field>
              </div>
            </div>

            <div className={styles.dependentHeader}>
              <h4 style={{ margin: 0, color: '#334155' }}>Demais integrantes da família</h4>
              <button type="button" onClick={addDependent} className={styles.addBtn}>+ Adicionar integrante</button>
            </div>

            <datalist id="kinship-options">{KINSHIP_OPTIONS.map(k => <option key={k} value={k} />)}</datalist>

            {dependents.length === 0 ? (
              <p className={styles.emptyMsg}>Nenhum outro integrante cadastrado.</p>
            ) : (
              <div className={styles.dependentsList}>
                {dependents.map((dep, index) => {
                  const age = ageFromBirthDate(dep.birth_date);
                  return (
                  <div key={dep.id || index} className={styles.dependentCard}>
                    <div className={styles.dependentCardHeader}>
                      <h4>{dep.name ? dep.name : `Integrante ${index + 1}`}{age !== null && <small style={{ color: '#64748b', fontWeight: 500 }}> · {age} anos</small>}</h4>
                      <button type="button" onClick={() => removeDependent(index)} className={styles.removeBtn}>🗑️ Remover</button>
                    </div>

                    <div className={styles.profilePhotoSectionSm}>
                      <div className={styles.avatarPreviewSm}>
                        {dep.profile_photo ? <img src={dep.profile_photo} alt="Avatar" className={styles.avatarImg} /> : <span className={styles.avatarPlaceholderSm}>📷</span>}
                      </div>
                      <div className={styles.photoUploadControls}>
                        <label className={styles.photoUploadLabelSm}>
                          Adicionar/Alterar Foto
                          <input type="file" accept="image/*" onChange={(e) => handleDependentPhotoUpload(index, e)} className={styles.hiddenInput} />
                        </label>
                      </div>
                    </div>

                    <div className={formStyles.grid4}>
                      <Field label="Nome *" span={2}><input type="text" required value={dep.name} onChange={e => updateDependent(index, 'name', e.target.value)} /></Field>
                      <Field label="Parentesco *"><input type="text" list="kinship-options" required value={dep.kinship} onChange={e => updateDependent(index, 'kinship', e.target.value)} /></Field>
                      <Field label="Data de nascimento *"><input type="date" required value={dep.birth_date} onChange={e => updateDependent(index, 'birth_date', e.target.value)} /></Field>
                    </div>
                    <div className={formStyles.grid4}>
                      <Field label="Trabalha?">{yesNoSelect(dep.works, v => updateDependent(index, 'works', v))}</Field>
                      <Field label="Estuda?">{yesNoSelect(dep.studies, v => updateDependent(index, 'studies', v))}</Field>
                      <Field label="Renda mensal aproximada"><MoneyInput value={dep.monthly_income} onChange={v => updateDependent(index, 'monthly_income', v)} /></Field>
                      <Field label="CPF (opcional)"><input type="text" value={dep.cpf || ''} onChange={e => updateDependent(index, 'cpf', e.target.value)} /></Field>
                    </div>

                    <div className={styles.dependentAddressBlock}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" checked={dep.sameAddress} onChange={e => updateDependent(index, 'sameAddress', e.target.checked)} />
                        Este integrante mora no mesmo endereço do responsável
                      </label>

                      {!dep.sameAddress && (
                        <div className={styles.addressFormInner}>
                          <div className={formStyles.grid4}>
                            <Field label="CEP"><input type="text" value={dep.address.cep} onChange={e => { updateDependentAddress(index, 'cep', e.target.value); handleCepSearch(e.target.value, true, index); }} /></Field>
                            <Field label="Rua" span={3}><input type="text" value={dep.address.logradouro} onChange={e => updateDependentAddress(index, 'logradouro', e.target.value)} /></Field>
                          </div>
                          <div className={formStyles.grid4}>
                            <Field label="Número"><input type="text" value={dep.address.numero} onChange={e => updateDependentAddress(index, 'numero', e.target.value)} /></Field>
                            <Field label="Complemento"><input type="text" value={dep.address.complemento} onChange={e => updateDependentAddress(index, 'complemento', e.target.value)} /></Field>
                            <Field label="Bairro"><input type="text" value={dep.address.bairro} onChange={e => updateDependentAddress(index, 'bairro', e.target.value)} /></Field>
                            <Field label="Cidade/UF"><input type="text" value={dep.address.cidade} onChange={e => updateDependentAddress(index, 'cidade', e.target.value)} /></Field>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            <div className={formStyles.statsRow} style={{ marginTop: 20 }}>
              <div className={formStyles.stat}><span className={formStyles.statLabel}>Total de pessoas</span><span className={formStyles.statValue}>{composition.total}</span></div>
              <div className={formStyles.stat}><span className={formStyles.statLabel}>Crianças até 12 anos</span><span className={formStyles.statValue}>{composition.criancas}</span></div>
              <div className={formStyles.stat}><span className={formStyles.statLabel}>Adolescentes</span><span className={formStyles.statValue}>{composition.adolescentes}</span></div>
              <div className={formStyles.stat}><span className={formStyles.statLabel}>Pessoas idosas</span><span className={formStyles.statValue}>{composition.idosos}</span></div>
              <div className={formStyles.stat}><span className={formStyles.statLabel}>Soma das rendas</span><span className={formStyles.statValue} style={{ fontSize: '1rem' }}>{formatMoney(membersIncome)}</span></div>
            </div>
            <div className={formStyles.grid3}>
              <Field label="Total de pessoas com deficiência"><input type="number" min="0" value={profile.composicao.total_pcd} onChange={e => setField('composicao.total_pcd', e.target.value)} /></Field>
            </div>
            <p className={formStyles.hint} style={{ marginTop: -6 }}>Os totais por idade são calculados automaticamente pela data de nascimento (adolescentes: 13 a 17 anos; idosos: 60 anos ou mais).</p>

            <Question label="Na família existe:">
              <CheckGroup
                options={FAMILY_SITUATIONS} columns={2} value={profile.composicao.situacoes}
                onChange={v => {
                  const none = 'Nenhuma das situações acima';
                  setField('composicao.situacoes', v[v.length - 1] === none ? [none] : v.filter(i => i !== none));
                }}
              />
            </Question>
          </Section>

          <FamilyProfileSections
            profile={profile} setField={setField} userId={user.id} files={files} setFiles={setFiles}
            housingSituation={addressData.housing_type} setHousingSituation={v => setAddressData(prev => ({ ...prev, housing_type: v }))}
            roomsCount={roomsCount} setRoomsCount={setRoomsCount}
            totalMembers={composition.total} membersIncome={membersIncome}
          />

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'A Guardar...' : 'Salvar Cadastro Sociofamiliar'}
            </Button>
          </div>

        </form>
        </>
        )}
      </div>
    </ContentWrapper>
  );
};

export default UserProfilePage;
