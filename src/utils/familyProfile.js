// Arquivo: src/utils/familyProfile.js
// Opções, valores iniciais e cálculos do Cadastro Sociofamiliar e da Triagem Socioeconômica
// (Programa Selo Cidadania)

// ============================================================
// OPÇÕES DO CADASTRO SOCIOFAMILIAR
// ============================================================
export const EDUCATION_OPTIONS = [
  'Não alfabetizado', 'Fundamental Incompleto', 'Fundamental Completo',
  'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo'
];

export const EMPLOYMENT_OPTIONS = [
  'Empregado(a) com registro', 'Empregado(a) sem registro', 'Autônomo(a)', 'Trabalho informal/bicos',
  'Desempregado(a)', 'Aposentado(a)', 'Pensionista', 'Não trabalha atualmente', 'Outra'
];

export const FAMILY_SITUATIONS = [
  'Pessoa idosa dependente',
  'Pessoa com deficiência que necessita de apoio/cuidados',
  'Criança na primeira infância – 0 a 6 anos',
  'Gestante',
  'Pessoa que necessita de cuidados permanentes',
  'Responsável familiar que cria sozinho(a) os filhos',
  'Nenhuma das situações acima'
];

export const MAIN_INCOME_SOURCES = [
  'Emprego formal', 'Trabalho sem registro', 'Trabalho informal/bicos', 'Trabalho autônomo', 'Aposentadoria',
  'Pensão', 'Benefícios sociais', 'Ajuda de familiares/terceiros', 'Não possui renda atualmente', 'Outra'
];

export const INCOME_TYPES = [
  { key: 'salarios', label: 'Salários' },
  { key: 'informal', label: 'Trabalho informal/autônomo' },
  { key: 'aposentadoria', label: 'Aposentadoria/pensão' },
  { key: 'beneficios', label: 'Benefícios sociais' },
  { key: 'pensao_alimenticia', label: 'Pensão alimentícia' },
  { key: 'ajuda_terceiros', label: 'Ajuda regular de terceiros' },
  { key: 'outras', label: 'Outras rendas' }
];

export const INCOME_REGULARITY = ['Regular', 'Varia de mês para mês', 'Eventual', 'Atualmente inexistente'];

export const CADUNICO_OPTIONS = ['Sim, atualizado', 'Sim, desatualizado', 'Não possui', 'Não sabe informar'];

export const BENEFIT_OPTIONS = [
  'Bolsa Família', 'BPC – Benefício de Prestação Continuada', 'Auxílio-aluguel', 'Benefício eventual', 'Outro', 'Não recebe benefício'
];

export const FOLLOWUP_OPTIONS = ['CRAS', 'CREAS', 'Outro serviço socioassistencial', 'Não é acompanhada', 'Não sabe informar'];

export const EXPENSE_TYPES = [
  { key: 'aluguel', label: 'Aluguel/financiamento' },
  { key: 'alimentacao', label: 'Alimentação' },
  { key: 'agua', label: 'Água' },
  { key: 'energia', label: 'Energia elétrica' },
  { key: 'gas', label: 'Gás' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'medicamentos', label: 'Medicamentos/tratamentos' },
  { key: 'educacao', label: 'Educação' },
  { key: 'outras', label: 'Outras despesas essenciais' }
];

export const HEALTH_QUESTIONS = [
  { key: 'pcd', label: 'Existe pessoa com deficiência na família?' },
  { key: 'tratamento_continuo', label: 'Existe pessoa que necessita de tratamento contínuo?' },
  { key: 'medicamentos_relevantes', label: 'Existe pessoa que utiliza medicamentos continuamente e possui despesas relevantes com eles?' },
  { key: 'deixou_trabalho_cuidado', label: 'Alguma pessoa da família deixou de trabalhar ou reduziu suas atividades profissionais para cuidar de criança, pessoa idosa, pessoa com deficiência ou outra pessoa dependente?' }
];

export const HOUSING_SITUATION = [
  'Própria quitada', 'Própria financiada', 'Alugada', 'Aluguel social', 'Cedida', 'Ocupação', 'Localizada em área irregular', 'Outra'
];
export const HOUSING_KIND = ['Casa', 'Apartamento', 'Cômodo', 'Construção improvisada', 'Outro'];
export const HOUSING_MATERIAL = ['Alvenaria', 'Madeira', 'Misto', 'Material improvisado'];

export const INFRASTRUCTURE = [
  'Água encanada', 'Energia elétrica regular', 'Rede de esgoto', 'Fossa', 'Banheiro dentro da residência',
  'Coleta regular de lixo', "Caixa-d'água", 'Ventilação adequada', 'Iluminação natural adequada'
];

export const HOUSING_PROBLEMS = [
  'Infiltração', 'Umidade excessiva', 'Mofo', 'Goteiras', 'Telhado danificado', 'Paredes com rachaduras',
  'Piso quebrado/inadequado', 'Instalações elétricas aparentes ou aparentemente inseguras',
  'Instalações hidráulicas danificadas', 'Vazamentos', 'Esgoto inadequado ou a céu aberto',
  'Banheiro inexistente ou inadequado', 'Falta de ventilação', 'Falta de iluminação natural',
  'Superlotação dos cômodos', 'Presença frequente de ratos, insetos ou outras pragas', 'Aparente risco estrutural',
  'Enchentes/alagamentos', 'Área sujeita a deslizamento', 'Falta de acessibilidade para pessoa idosa ou com deficiência', 'Outro'
];

export const PHOTO_TYPES = [
  'Frente da residência', 'Telhado/local das goteiras', 'Paredes com infiltração, umidade ou mofo', 'Banheiro', 'Cozinha',
  'Instalações elétricas que apresentem problemas', 'Instalações hidráulicas/vazamentos', 'Rachaduras',
  'Cômodos mais afetados', 'Problemas de acessibilidade', 'Outros problemas relevantes'
];

export const DOCUMENT_GROUPS = [
  {
    key: 'basicos', title: 'A. Documentos básicos',
    items: [
      'Documento de identificação da pessoa responsável pela família',
      'CPF da pessoa responsável',
      'Comprovante de residência atualizado',
      'Comprovante/folha-resumo do CadÚnico, quando a família estiver cadastrada'
    ]
  },
  {
    key: 'cnis', title: 'B. CNIS',
    help: 'O CNIS poderá ser obtido pelos canais oficiais da Previdência Social/Meu INSS.',
    items: ['Extrato CNIS atualizado das pessoas adultas do grupo familiar, especialmente das pessoas em idade laboral']
  },
  {
    key: 'renda', title: 'C. Comprovação de renda',
    help: 'Para cada pessoa da família que possui renda, anexar pelo menos um documento compatível com a fonte de renda declarada.',
    items: [
      'Último holerite/contracheque', 'Carteira de Trabalho/registro de vínculo', 'Comprovante de aposentadoria ou pensão',
      'Comprovante de benefício previdenciário', 'Comprovante de benefício social, quando aplicável',
      'Declaração de renda de trabalhador autônomo/informal, quando não houver comprovante formal',
      'Comprovante de pensão alimentícia, quando existente', 'Outro documento que demonstre a renda declarada'
    ]
  }
];

export const SUPPORT_NEEDS = [
  'Alimentação', 'Trabalho e geração de renda', 'Qualificação profissional', 'Documentação', 'Educação', 'Saúde',
  'Assistência Social', 'Benefícios sociais', 'Pessoa com deficiência', 'Pessoa idosa', 'Moradia', 'Reforma da residência', 'Outro'
];

export const COMMUNITY_PARTICIPATION = [
  'Projeto social', 'Associação comunitária', 'Grupo religioso', 'Atividade cultural', 'Atividade esportiva', 'Grupo de apoio',
  'Escola/comunidade escolar', 'Serviço ou equipamento público', 'Outro', 'Não participa ou não possui acesso atualmente'
];

export const PARTICIPATION_BARRIERS = [
  'Horário incompatível com trabalho ou outras responsabilidades', 'Falta de dinheiro', 'Falta de transporte',
  'Responsabilidade com crianças/dependentes', 'Não conhece atividades disponíveis',
  'Não se identifica com os espaços/atividades disponíveis', 'Não possui interesse atualmente', 'Outra'
];

export const MAIN_DIFFICULTIES = [
  'Falta de renda ou trabalho', 'Falta de moradia adequada', 'Falta de rede de apoio',
  'Necessidade de cuidar de crianças, idosos ou pessoas dependentes', 'Dificuldade de acesso a serviços e benefícios',
  'Falta de qualificação ou oportunidades', 'Problemas de saúde', 'Dificuldade de conciliar trabalho e responsabilidades familiares',
  'Organização e colaboração entre os familiares', 'Conhecimento sobre direitos e serviços disponíveis', 'Outra situação'
];

export const FAMILY_STRENGTHS = [
  'União entre os familiares', 'Apoio de familiares/amigos', 'Conhecimentos e habilidades', 'Experiência profissional',
  'Capacidade de organização', 'Participação comunitária', 'Conhecimento sobre serviços e direitos',
  'Capacidade de buscar ajuda quando necessário', 'Outra', 'No momento, não identifica recursos'
];

export const KINSHIP_OPTIONS = [
  'Cônjuge/Companheiro(a)', 'Filho(a)', 'Enteado(a)', 'Neto(a)', 'Pai/Mãe', 'Avô/Avó', 'Irmão(ã)', 'Sobrinho(a)', 'Outro parente', 'Não parente'
];

// ============================================================
// ESTRUTURA INICIAL DO CADASTRO (JSON salvo em family_profiles.data)
// ============================================================
export const emptyFamilyProfile = () => ({
  identificacao: { nome_social: '', situacao_outra: '', trabalha: '', estuda: '', renda_mensal: '' },
  endereco: { ponto_referencia: '' },
  composicao: { total_pcd: '', situacoes: [] },
  renda: {
    fonte_principal: '', fonte_principal_outra: '',
    valores: INCOME_TYPES.reduce((acc, t) => ({ ...acc, [t.key]: '' }), {}),
    regularidade: '', desemprego_recente: '', desemprego_quando: ''
  },
  cadunico: {
    inscricao: '', nis: '', beneficios: [], beneficio_outro: '', valor_beneficios: '',
    acompanhamento: [], unidade_servico: ''
  },
  despesas: {
    valores: EXPENSE_TYPES.reduce((acc, t) => ({ ...acc, [t.key]: '' }), {}),
    extraordinaria: '', extraordinaria_qual: '', extraordinaria_valor: ''
  },
  saude: HEALTH_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.key]: '' }), {}),
  moradia: {
    situacao_outra: '', tipo: '', tipo_outro: '', material: '',
    dormitorios: '', pessoas_dormitorio_mais_ocupado: ''
  },
  infraestrutura: [],
  problemas: {
    lista: [], outro: '', principal: '', ha_quanto_tempo: '',
    impede_comodo: '', impede_comodo_qual: '', prejudica_saude: '', prejudica_explicacao: ''
  },
  fotos: { checklist: [], interesse_reforma: false },
  documentos: { checklist: [], sem_renda_declarada: false },
  necessidades: { lista: [], outro: '' },
  psicossocial: {
    participacao: [], participacao_outro: '', barreiras: [], barreira_outra: '',
    dificuldade_principal: [], dificuldade_outra: '', forcas: [], forca_outra: '', mudanca_desejada: ''
  },
  declaracao: { ciente: false, nome: '', data: '', aceite_eletronico: '', autoriza_fotos: false, aceite_fotos: '' }
});

// Mescla dados salvos com a estrutura padrão (garante campos novos em cadastros antigos)
export const mergeFamilyProfile = (saved = {}) => {
  const base = emptyFamilyProfile();
  const merge = (a, b) => {
    if (Array.isArray(a)) return Array.isArray(b) ? b : a;
    if (a && typeof a === 'object') {
      const out = { ...a };
      Object.keys(b || {}).forEach(k => { out[k] = k in a ? merge(a[k], b[k]) : b[k]; });
      return out;
    }
    return b === undefined || b === null ? a : b;
  };
  return merge(base, saved);
};

// ============================================================
// CÁLCULOS AUXILIARES
// ============================================================
export const parseMoney = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  let str = String(value).replace(/[^0-9,.-]/g, '');
  if (str.includes(',') || /^\d{1,3}(\.\d{3})+$/.test(str)) str = str.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
};

export const formatMoney = (value) =>
  (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ageFromBirthDate = (birthDate) => {
  if (!birthDate) return null;
  const d = new Date(`${String(birthDate).split('T')[0]}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

// Totais da composição familiar: responsável + integrantes (dependentes)
export const computeComposition = (responsibleBirthDate, members = []) => {
  const ages = [ageFromBirthDate(responsibleBirthDate), ...members.map(m => ageFromBirthDate(m.birth_date))];
  return {
    total: 1 + members.length,
    criancas: ages.filter(a => a !== null && a <= 12).length,
    adolescentes: ages.filter(a => a !== null && a >= 13 && a <= 17).length,
    idosos: ages.filter(a => a !== null && a >= 60).length,
    primeiraInfancia: ages.filter(a => a !== null && a <= 6).length
  };
};

export const sumValues = (obj = {}) => Object.values(obj).reduce((acc, v) => acc + parseMoney(v), 0);

// ============================================================
// TRIAGEM SOCIOECONÔMICA (uso exclusivo da equipe)
// ============================================================
export const AXES = [
  { key: 'renda', label: 'Renda per capita', max: 30 },
  { key: 'trabalho', label: 'Trabalho/estabilidade', max: 10 },
  { key: 'composicao', label: 'Composição familiar', max: 10 },
  { key: 'cadunico', label: 'CadÚnico/proteção social', max: 5 },
  { key: 'saude', label: 'Saúde/deficiência/cuidados', max: 10 },
  { key: 'moradia', label: 'Moradia/insalubridade', max: 25 },
  { key: 'comprometimento', label: 'Comprometimento da renda', max: 5 },
  { key: 'rede', label: 'Rede de apoio/acesso a direitos', max: 5 }
];

export const RENDA_BANDS = [
  { key: 'ate_1_4', label: 'Até 1/4 do salário mínimo', points: 30, limit: 0.25 },
  { key: 'ate_1_2', label: 'Acima de 1/4 até 1/2 salário mínimo', points: 25, limit: 0.5 },
  { key: 'ate_1', label: 'Acima de 1/2 até 1 salário mínimo', points: 18, limit: 1 },
  { key: 'ate_1_5', label: 'Acima de 1 até 1,5 salário mínimo', points: 10, limit: 1.5 },
  { key: 'ate_2', label: 'Acima de 1,5 até 2 salários mínimos', points: 5, limit: 2 },
  { key: 'acima_2', label: 'Acima de 2 salários mínimos', points: 0, limit: Infinity }
];

// Eixos com regra "aplicar somente a maior pontuação" usam mode 'max'; os demais somam até o máximo.
export const AXIS_ITEMS = {
  trabalho: {
    mode: 'max',
    items: [
      { key: 'sem_renda', label: 'Família atualmente sem renda', points: 10 },
      { key: 'desemprego_principal', label: 'Desemprego do principal responsável pela renda', points: 8 },
      { key: 'eventual_instavel', label: 'Renda exclusivamente eventual/informal e instável', points: 6 },
      { key: 'informal_regular', label: 'Trabalho informal com alguma regularidade', points: 4 },
      { key: 'estavel', label: 'Renda predominantemente estável', points: 0 }
    ]
  },
  composicao: {
    mode: 'sum',
    items: [
      { key: 'monoparental', label: 'Família monoparental com dependentes', points: 4 },
      { key: 'tres_dependentes', label: 'Três ou mais crianças/adolescentes dependentes', points: 3 },
      { key: 'idoso_dependente', label: 'Pessoa idosa dependente', points: 2 },
      { key: 'gestante_primeira_infancia', label: 'Gestante/criança na primeira infância', points: 1 }
    ]
  },
  cadunico: {
    mode: 'max',
    items: [
      { key: 'cadunico_beneficio', label: 'CadÚnico + recebimento de benefício de transferência de renda/BPC', points: 5 },
      { key: 'cadunico_sem_beneficio', label: 'CadÚnico ativo, sem benefício', points: 3 },
      { key: 'sem_acesso_rede', label: 'Família apresenta necessidade aparente de proteção social e não possui acesso à rede', points: 5 },
      { key: 'nao_se_aplica', label: 'Não se aplica', points: 0 }
    ]
  },
  saude: {
    mode: 'sum',
    items: [
      { key: 'pcd_cuidados', label: 'Pessoa com deficiência/dependência que demande cuidados', points: 4 },
      { key: 'tratamento_impacto', label: 'Tratamento continuado com impacto relevante na renda', points: 3 },
      { key: 'cuidador', label: 'Familiar deixou/reduziu trabalho para exercer função de cuidado', points: 3 }
    ]
  },
  moradia: {
    mode: 'sum',
    items: [
      { key: 'risco_estrutural', label: 'Risco estrutural aparente', points: 8 },
      { key: 'infiltracao', label: 'Infiltração/mofo/umidade severa', points: 5 },
      { key: 'eletrica', label: 'Instalação elétrica com risco aparente', points: 5 },
      { key: 'banheiro_esgoto', label: 'Ausência/inadequação grave de banheiro/esgoto', points: 5 },
      { key: 'telhado', label: 'Telhado severamente comprometido', points: 5 },
      { key: 'alagamento', label: 'Risco de alagamento/deslizamento', points: 5 },
      { key: 'superlotacao', label: 'Superlotação habitacional grave', points: 3 },
      { key: 'ventilacao', label: 'Ventilação/iluminação inadequadas', points: 3 },
      { key: 'acessibilidade', label: 'Problemas relevantes de acessibilidade', points: 3 },
      { key: 'hidraulica', label: 'Problemas hidráulicos relevantes', points: 2 }
    ]
  },
  comprometimento: {
    mode: 'max',
    items: [
      { key: 'acima_90', label: 'Despesas essenciais iguais ou superiores a 90% da renda', points: 5 },
      { key: '70_89', label: '70% a 89%', points: 3 },
      { key: '50_69', label: '50% a 69%', points: 1 },
      { key: 'abaixo_50', label: 'Abaixo de 50%', points: 0 }
    ]
  },
  rede: {
    mode: 'sum',
    items: [
      { key: 'sem_rede', label: 'Ausência relevante de rede familiar/comunitária', points: 2 },
      { key: 'necessidade_nao_atendida', label: 'Necessidade de benefício/serviço ainda não atendida', points: 2 },
      { key: 'dificuldade_documentacao', label: 'Dificuldade relevante de documentação/acesso à rede pública', points: 1 }
    ]
  }
};

export const CLASSIFICATIONS = [
  { min: 75, label: 'Vulnerabilidade muito alta', resultLabel: 'Vulnerabilidade muito alta', matrixLabel: 'Vulnerabilidade muito alta – prioridade', short: 'Muito alta', color: '#991b1b', bg: '#fee2e2' },
  { min: 55, label: 'Alta vulnerabilidade', resultLabel: 'Alta vulnerabilidade', matrixLabel: 'Alta vulnerabilidade', short: 'Alta', color: '#c2410c', bg: '#ffedd5' },
  { min: 35, label: 'Vulnerabilidade moderada', resultLabel: 'Moderada', matrixLabel: 'Vulnerabilidade moderada', short: 'Moderada', color: '#a16207', bg: '#fef9c3' },
  { min: 20, label: 'Vulnerabilidade leve', resultLabel: 'Leve', matrixLabel: 'Vulnerabilidade leve', short: 'Leve', color: '#1d4ed8', bg: '#dbeafe' },
  { min: 0, label: 'Sem prioridade pela matriz', resultLabel: 'Sem prioridade pela matriz', matrixLabel: 'Sem prioridade socioeconômica pela matriz', short: 'Sem prioridade', color: '#475569', bg: '#f1f5f9' }
];

export const classifyScore = (total) => CLASSIFICATIONS.find(c => total >= c.min) || CLASSIFICATIONS[CLASSIFICATIONS.length - 1];
export const classificationStyle = (label) => CLASSIFICATIONS.find(c => c.label === label) || CLASSIFICATIONS[CLASSIFICATIONS.length - 1];

export const rendaBandFor = (perCapita, salarioMinimo) => {
  const sm = parseMoney(salarioMinimo);
  if (!sm) return null;
  const ratio = perCapita / sm;
  return RENDA_BANDS.find(b => ratio <= b.limit) || RENDA_BANDS[RENDA_BANDS.length - 1];
};

export const axisScore = (axisKey, triage) => {
  const max = AXES.find(a => a.key === axisKey)?.max || 0;
  if (axisKey === 'renda') {
    return RENDA_BANDS.find(b => b.key === triage.renda_faixa)?.points || 0;
  }
  const def = AXIS_ITEMS[axisKey];
  const selected = triage.eixos?.[axisKey] || [];
  const points = def.items.filter(i => selected.includes(i.key)).map(i => i.points);
  if (points.length === 0) return 0;
  const raw = def.mode === 'max' ? Math.max(...points) : points.reduce((a, b) => a + b, 0);
  return Math.min(max, raw);
};

export const computeAxisScores = (triage) =>
  AXES.reduce((acc, a) => ({ ...acc, [a.key]: axisScore(a.key, triage) }), {});

// Valor editável na triagem - confirme o salário mínimo vigente antes da análise.
export const SALARIO_MINIMO_PADRAO = '1621,00';

// Estrutura inicial da triagem (JSON salvo em socioeconomic_triages.data)
export const emptyTriage = () => ({
  identificacao: { numero_cadastro: '', responsavel_familia: '', data_analise: new Date().toISOString().split('T')[0], responsavel: '', funcao: '' },
  conferencia: { cadastro: '', documentos: [], resultado: [] },
  calculo: { renda_bruta: '', integrantes: '', salario_minimo: SALARIO_MINIMO_PADRAO },
  renda_faixa: '',
  eixos: { trabalho: [], composicao: [], cadunico: [], saude: [], moradia: [], comprometimento: [], rede: [] },
  reforma: { analise: [], encaminhamento: [] },
  consistencia: { cnis: [], renda_documentos: [], observacoes: '' },
  gatilhos: [],
  resultado: { classificacao_manual: '', encaminhamentos: [], responsavel: '', data: '' },
  leitura_psicossocial: { fatores: '', recursos: '', barreiras: '', intervencoes: [], intervencao_outra: '' },
  servico_social: { acoes: [], assistente_social: '', cress: '', data: '' },
  pontuacao: {}
});

// Sugestões automáticas da triagem a partir do cadastro sociofamiliar preenchido pela família
export const suggestTriageFromProfile = ({ user, profile, members, files }) => {
  const t = emptyTriage();
  const comp = computeComposition(user?.birth_date, members);
  const rendaTotal = sumValues(profile.renda.valores);
  const despesasTotal = sumValues(profile.despesas.valores);
  const situacoes = profile.composicao.situacoes || [];
  const problemas = profile.problemas.lista || [];
  const docs = profile.documentos.checklist || [];
  const docFiles = (files || []).filter(f => f.category === 'document').map(f => f.subtype);
  const hasDoc = (label) => docs.includes(label) || docFiles.includes(label);

  t.identificacao.numero_cadastro = user?.id ? String(user.id) : '';
  t.identificacao.responsavel_familia = user?.name || '';
  t.calculo.renda_bruta = rendaTotal ? rendaTotal.toFixed(2).replace('.', ',') : '0,00';
  t.calculo.integrantes = String(comp.total);

  const perCapita = comp.total ? rendaTotal / comp.total : 0;
  t.renda_faixa = rendaBandFor(perCapita, t.calculo.salario_minimo)?.key || '';

  // Conferência inicial
  t.conferencia.cadastro = profile.declaracao.ciente ? 'Formulário completo' : 'Formulário com pendências';
  const docMap = [
    ['Documento da pessoa responsável', 'Documento de identificação da pessoa responsável pela família'],
    ['CPF', 'CPF da pessoa responsável'],
    ['Comprovante de residência', 'Comprovante de residência atualizado'],
    ['CadÚnico, quando aplicável', 'Comprovante/folha-resumo do CadÚnico, quando a família estiver cadastrada'],
    ['CNIS dos adultos aplicáveis', 'Extrato CNIS atualizado das pessoas adultas do grupo familiar, especialmente das pessoas em idade laboral']
  ];
  docMap.forEach(([triageLabel, docLabel]) => { if (hasDoc(docLabel)) t.conferencia.documentos.push(triageLabel); });
  if (DOCUMENT_GROUPS[2].items.some(hasDoc)) t.conferencia.documentos.push('Comprovantes mínimos de renda');
  if (hasDoc('Declaração de renda de trabalhador autônomo/informal, quando não houver comprovante formal')) t.conferencia.documentos.push('Declaração de renda informal, quando aplicável');
  if (profile.documentos.sem_renda_declarada) t.conferencia.documentos.push('Declaração de ausência de renda, quando aplicável');

  // Eixo 2 - Trabalho e estabilidade
  const reg = profile.renda.regularidade;
  if (rendaTotal === 0 || reg === 'Atualmente inexistente' || profile.renda.fonte_principal === 'Não possui renda atualmente') t.eixos.trabalho = ['sem_renda'];
  else if (profile.renda.desemprego_recente === 'Sim') t.eixos.trabalho = ['desemprego_principal'];
  else if (reg === 'Eventual') t.eixos.trabalho = ['eventual_instavel'];
  else if (reg === 'Varia de mês para mês') t.eixos.trabalho = ['informal_regular'];
  else if (reg === 'Regular') t.eixos.trabalho = ['estavel'];

  // Eixo 3 - Composição
  const dependentesMenores = comp.criancas + comp.adolescentes;
  if (situacoes.includes('Responsável familiar que cria sozinho(a) os filhos')) t.eixos.composicao.push('monoparental');
  if (dependentesMenores >= 3) t.eixos.composicao.push('tres_dependentes');
  if (situacoes.includes('Pessoa idosa dependente')) t.eixos.composicao.push('idoso_dependente');
  if (situacoes.includes('Gestante') || situacoes.includes('Criança na primeira infância – 0 a 6 anos') || comp.primeiraInfancia > 0) t.eixos.composicao.push('gestante_primeira_infancia');

  // Eixo 4 - CadÚnico
  const cad = profile.cadunico;
  const recebeTransferencia = (cad.beneficios || []).some(b => b === 'Bolsa Família' || b.startsWith('BPC'));
  if (cad.inscricao?.startsWith('Sim') && recebeTransferencia) t.eixos.cadunico = ['cadunico_beneficio'];
  else if (cad.inscricao === 'Sim, atualizado') t.eixos.cadunico = ['cadunico_sem_beneficio'];
  else t.eixos.cadunico = [];

  // Saúde
  const s = profile.saude;
  if (s.pcd === 'Sim' || situacoes.includes('Pessoa com deficiência que necessita de apoio/cuidados') || situacoes.includes('Pessoa que necessita de cuidados permanentes')) t.eixos.saude.push('pcd_cuidados');
  if (s.tratamento_continuo === 'Sim' && s.medicamentos_relevantes === 'Sim') t.eixos.saude.push('tratamento_impacto');
  if (s.deixou_trabalho_cuidado === 'Sim') t.eixos.saude.push('cuidador');

  // Moradia (situações "aparentemente identificadas" - a equipe deve confirmar a gravidade)
  const has = (p) => problemas.includes(p);
  if (has('Aparente risco estrutural') || has('Paredes com rachaduras')) t.eixos.moradia.push('risco_estrutural');
  if (has('Infiltração') || has('Umidade excessiva') || has('Mofo')) t.eixos.moradia.push('infiltracao');
  if (has('Instalações elétricas aparentes ou aparentemente inseguras')) t.eixos.moradia.push('eletrica');
  if (has('Banheiro inexistente ou inadequado') || has('Esgoto inadequado ou a céu aberto')) t.eixos.moradia.push('banheiro_esgoto');
  if (has('Telhado danificado') || has('Goteiras')) t.eixos.moradia.push('telhado');
  if (has('Enchentes/alagamentos') || has('Área sujeita a deslizamento')) t.eixos.moradia.push('alagamento');
  if (has('Superlotação dos cômodos') || parseInt(profile.moradia.pessoas_dormitorio_mais_ocupado, 10) > 3) t.eixos.moradia.push('superlotacao');
  if (has('Falta de ventilação') || has('Falta de iluminação natural')) t.eixos.moradia.push('ventilacao');
  if (has('Falta de acessibilidade para pessoa idosa ou com deficiência')) t.eixos.moradia.push('acessibilidade');
  if (has('Instalações hidráulicas danificadas') || has('Vazamentos')) t.eixos.moradia.push('hidraulica');

  // Reforma Solidária
  if (t.eixos.moradia.length === 0) t.reforma.analise.push('Sem indicação inicial');
  else t.reforma.analise.push('Necessidade habitacional identificada');
  if (t.eixos.moradia.includes('risco_estrutural')) t.reforma.analise.push('Possível risco estrutural');
  if (t.eixos.moradia.includes('eletrica')) t.reforma.analise.push('Possível risco de acidente');
  if (t.eixos.moradia.some(k => ['infiltracao', 'banheiro_esgoto', 'ventilacao'].includes(k))) t.reforma.analise.push('Possível condição de insalubridade');
  if (t.eixos.moradia.includes('acessibilidade')) t.reforma.analise.push('Necessidade de acessibilidade');
  if (t.eixos.moradia.length > 0 && (comp.criancas > 0 || comp.idosos > 0 || s.pcd === 'Sim')) t.reforma.analise.push('Criança, idoso ou pessoa com deficiência exposta às condições inadequadas');
  if (profile.fotos.interesse_reforma && !(files || []).some(f => f.category === 'housing_photo')) t.reforma.encaminhamento.push('Solicitar fotografias/informações complementares');

  // Comprometimento da renda
  if (rendaTotal > 0 || despesasTotal > 0) {
    const ratio = rendaTotal > 0 ? despesasTotal / rendaTotal : 1;
    if (ratio >= 0.9) t.eixos.comprometimento = ['acima_90'];
    else if (ratio >= 0.7) t.eixos.comprometimento = ['70_89'];
    else if (ratio >= 0.5) t.eixos.comprometimento = ['50_69'];
    else t.eixos.comprometimento = ['abaixo_50'];
  }

  // Rede de apoio
  const psi = profile.psicossocial;
  if ((psi.dificuldade_principal || []).includes('Falta de rede de apoio') || (psi.participacao || []).includes('Não participa ou não possui acesso atualmente')) t.eixos.rede.push('sem_rede');
  if ((cad.beneficios || []).includes('Não recebe benefício') && (cad.inscricao === 'Não possui' || (psi.dificuldade_principal || []).includes('Dificuldade de acesso a serviços e benefícios'))) t.eixos.rede.push('necessidade_nao_atendida');
  if ((profile.necessidades.lista || []).includes('Documentação')) t.eixos.rede.push('dificuldade_documentacao');

  // Leitura psicossocial - recursos declarados pela família
  t.leitura_psicossocial.recursos = (psi.forcas || []).filter(f => f !== 'Outra').concat(psi.forca_outra ? [psi.forca_outra] : []).join('; ');
  t.leitura_psicossocial.barreiras = (psi.barreiras || []).filter(b => b !== 'Outra').concat(psi.barreira_outra ? [psi.barreira_outra] : []).join('; ');

  return t;
};
