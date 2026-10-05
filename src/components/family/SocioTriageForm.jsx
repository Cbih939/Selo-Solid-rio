// Arquivo: src/components/family/SocioTriageForm.jsx
// Instrumento Interno de Triagem e Classificação Socioeconômica - USO EXCLUSIVO DA EQUIPE AUTORIZADA

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/api';
import Button from '../ui/Button/Button';
import styles from './FamilyForm.module.css';
import { Section, Field, Question, CheckGroup, RadioGroup, MoneyInput, Notice } from './FormControls';
import {
  AXES, AXIS_ITEMS, RENDA_BANDS, CLASSIFICATIONS, computeAxisScores, classifyScore, classificationStyle,
  rendaBandFor, parseMoney, formatMoney, suggestTriageFromProfile, emptyTriage
} from '../../utils/familyProfile';

const CONF_DOCS = [
  'Documento da pessoa responsável', 'CPF', 'Comprovante de residência', 'CadÚnico, quando aplicável',
  'CNIS dos adultos aplicáveis', 'Comprovantes mínimos de renda', 'Declaração de renda informal, quando aplicável',
  'Declaração de ausência de renda, quando aplicável'
];
const CONF_RESULT = [
  'Documentação suficiente para triagem inicial', 'Necessário solicitar complementação',
  'Identificada inconsistência relevante', 'Encaminhar diretamente ao Serviço Social'
];
const REFORMA_ANALISE = [
  'Sem indicação inicial', 'Necessidade habitacional identificada', 'Possível condição de insalubridade', 'Possível risco de acidente',
  'Possível risco estrutural', 'Necessidade de acessibilidade', 'Criança, idoso ou pessoa com deficiência exposta às condições inadequadas',
  'Fotografias demonstram aparente necessidade de intervenção'
];
const REFORMA_ENCAMINHAMENTO = [
  'Sem prioridade neste momento', 'Manter cadastro para futuras ações', 'Solicitar fotografias/informações complementares',
  'Avaliação técnica necessária', 'Recomendada visita domiciliar', 'Prioridade para avaliação do Reforma Solidária'
];
const CNIS_OPTIONS = [
  'Compatível com as informações declaradas', 'Apresenta vínculo/remuneração que necessita esclarecimento',
  'Apresenta benefício previdenciário', 'Sem vínculos atuais aparentes', 'Necessita análise complementar'
];
const RENDA_DOC_OPTIONS = [
  'Compatível', 'Parcialmente comprovada', 'Renda informal', 'Sem renda declarada', 'Divergência relevante', 'Necessária documentação complementar'
];
const GATILHOS = [
  'Inconsistência socioeconômica relevante',
  'Renda informal complexa ou situação que não possa ser compreendida adequadamente pela documentação',
  'Alteração recente e grave da condição socioeconômica',
  'Situação de possível violência ou violação de direitos',
  'Risco social grave',
  'Situação familiar excepcional não adequadamente representada pela matriz',
  'Dúvida relevante sobre composição familiar',
  'Necessidade de avaliação individualizada',
  'Necessidade de estudo social ou parecer técnico',
  'Situação habitacional grave associada a outras vulnerabilidades sociais',
  'Contestação fundamentada da família',
  'Outra situação que demande análise profissional'
];
const ENCAMINHAMENTOS = [
  'Cadastro aprovado para continuidade no fluxo do Programa Selo Cidadania', 'Cadastro aprovado com acompanhamento',
  'Documentação complementar necessária', 'Encaminhamento ao Serviço Social', 'Avaliação para Reforma Solidária',
  'Visita domiciliar recomendada', 'Encaminhamento à rede socioassistencial', 'Reavaliação futura'
];
const INTERVENCOES = [
  'Oficina/grupo', 'Roda de conversa', 'Encaminhamento à rede', 'Atividade de fortalecimento de vínculos', 'Capacitação/qualificação',
  'Apoio à geração de renda', 'Acompanhamento social', 'Orientação/direcionamento sobre os projetos disponíveis', 'Outro'
];
const SERVICO_SOCIAL = [
  'Entrevista social realizada', 'Necessidade de visita domiciliar identificada', 'Orientações realizadas',
  'Encaminhamento à rede socioassistencial', 'Encaminhamento a outra política pública', 'Necessidade de acompanhamento', 'Avaliação social concluída'
];

const AXIS_RULES = {
  max: 'Aplicar somente a maior pontuação correspondente.',
  sum: 'Somam-se os itens marcados, até o máximo do eixo.'
};

const setIn = (obj, path, value) => {
  const keys = path.split('.');
  const clone = { ...obj };
  let cur = clone;
  keys.slice(0, -1).forEach(k => { cur[k] = { ...(cur[k] || {}) }; cur = cur[k]; });
  cur[keys[keys.length - 1]] = value;
  return clone;
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-');

const ClassBadge = ({ label }) => {
  const c = classificationStyle(label);
  return <span className={styles.badge} style={{ background: c.bg, color: c.color }}>{label}</span>;
};

const SocioTriageForm = ({ user, profile, members, files }) => {
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (e) { return {}; }
  }, []);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [triageId, setTriageId] = useState(null);
  const [triage, setTriage] = useState(emptyTriage());

  const buildSuggestion = useCallback(() => {
    const t = suggestTriageFromProfile({ user, profile, members, files });
    const analyst = currentUser.name || currentUser.fantasy_name || '';
    t.identificacao.responsavel = analyst;
    t.resultado.responsavel = analyst;
    t.resultado.data = new Date().toISOString().split('T')[0];
    return t;
  }, [user, profile, members, files, currentUser]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get(`/family-profiles/${user.id}/triages`);
      setHistory(res.data);
      return res.data;
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erro ao carregar as triagens.' });
      return [];
    }
  }, [user.id]);

  useEffect(() => {
    (async () => {
      const list = await loadHistory();
      if (list.length > 0) {
        setTriageId(list[0].id);
        setTriage({ ...emptyTriage(), ...list[0].data });
      } else {
        setTriageId(null);
        setTriage(buildSuggestion());
      }
      setLoading(false);
    })();
    // carrega apenas ao abrir a aba
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const set = (path, value) => setTriage(prev => setIn(prev, path, value));

  // Renda per capita calculada
  const rendaBruta = parseMoney(triage.calculo.renda_bruta);
  const integrantes = parseInt(triage.calculo.integrantes, 10) || 0;
  const perCapita = integrantes ? rendaBruta / integrantes : 0;
  const bandaSugerida = rendaBandFor(perCapita, triage.calculo.salario_minimo);

  const scores = useMemo(() => computeAxisScores(triage), [triage]);
  const total = AXES.reduce((acc, a) => acc + scores[a.key], 0);
  const classe = classifyScore(total);
  const moradiaBruta = AXIS_ITEMS.moradia.items.filter(i => (triage.eixos.moradia || []).includes(i.key)).reduce((a, i) => a + i.points, 0);

  const handleNew = () => {
    if (!window.confirm('Iniciar uma nova triagem a partir das informações atuais do cadastro?')) return;
    setTriageId(null);
    setTriage(buildSuggestion());
    setMessage({ type: 'info', text: 'Nova triagem pré-preenchida com base no cadastro sociofamiliar. Revise todos os itens antes de salvar.' });
  };

  const handleReapply = () => {
    if (!window.confirm('Reaplicar as sugestões do cadastro? As marcações da matriz e da conferência serão substituídas (observações e encaminhamentos são mantidos).')) return;
    const s = buildSuggestion();
    setTriage(prev => ({
      ...prev,
      identificacao: { ...prev.identificacao, numero_cadastro: s.identificacao.numero_cadastro, responsavel_familia: s.identificacao.responsavel_familia },
      conferencia: { ...prev.conferencia, cadastro: s.conferencia.cadastro, documentos: s.conferencia.documentos },
      calculo: { ...prev.calculo, renda_bruta: s.calculo.renda_bruta, integrantes: s.calculo.integrantes },
      renda_faixa: rendaBandFor(
        parseMoney(s.calculo.renda_bruta) / (parseInt(s.calculo.integrantes, 10) || 1),
        prev.calculo.salario_minimo
      )?.key || s.renda_faixa,
      eixos: s.eixos,
      reforma: { ...prev.reforma, analise: s.reforma.analise }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    const payload = { ...triage, pontuacao: scores };
    try {
      const res = triageId
        ? await api.put(`/family-profiles/${user.id}/triages/${triageId}`, { data: payload })
        : await api.post(`/family-profiles/${user.id}/triages`, { data: payload });
      setTriageId(res.data.id);
      setTriage({ ...emptyTriage(), ...res.data.data });
      await loadHistory();
      setMessage({ type: 'success', text: `Triagem salva: ${res.data.total_score}/100 – ${res.data.classification}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erro ao salvar a triagem.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Carregando triagens...</p>;

  const renderAxis = (key, number) => {
    const axis = AXES.find(a => a.key === key);
    const def = AXIS_ITEMS[key];
    return (
      <div>
        <div className={styles.axisHeader}>
          <h4>{number} — {axis.label.toUpperCase()} <span style={{ color: '#64748b', fontWeight: 500 }}>(máximo: {axis.max} pontos)</span></h4>
          <span className={styles.axisScore}>{scores[key]}/{axis.max}</span>
        </div>
        <p className={styles.axisRule}>{AXIS_RULES[def.mode]}</p>
        {def.mode === 'max' && key !== 'cadunico' ? (
          <RadioGroup name={`eixo_${key}`} options={def.items} columns={1} value={(triage.eixos[key] || [])[0] || ''} onChange={v => set(`eixos.${key}`, v ? [v] : [])} />
        ) : (
          <CheckGroup options={def.items} columns={1} value={triage.eixos[key] || []} onChange={v => set(`eixos.${key}`, v)} />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className={styles.restrictedBanner}>INSTRUMENTO INTERNO DE TRIAGEM E CLASSIFICAÇÃO SOCIOECONÔMICA · USO EXCLUSIVO DA EQUIPE AUTORIZADA</div>

      {message.text && <div className={message.type === 'error' ? styles.error : message.type === 'success' ? styles.success : styles.notice + ' ' + styles.notice_info}>{message.text}</div>}

      <div className={styles.toolbar}>
        <strong style={{ color: '#334155' }}>{triageId ? `Editando triagem #${triageId}` : 'Nova triagem (ainda não salva)'}</strong>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={styles.secondaryBtn} onClick={handleReapply}>↻ Reaplicar sugestões do cadastro</button>
          {triageId && <button type="button" className={styles.secondaryBtn} onClick={handleNew}>+ Nova triagem</button>}
        </div>
      </div>

      {history.length > 0 && (
        <div className={styles.historyList}>
          {history.map(h => (
            <button
              type="button" key={h.id}
              className={`${styles.historyItem} ${h.id === triageId ? styles.historyItemActive : ''}`}
              onClick={() => { setTriageId(h.id); setTriage({ ...emptyTriage(), ...h.data }); setMessage({ type: '', text: '' }); }}
            >
              <span><strong>#{h.id}</strong> · {formatDate(h.data?.identificacao?.data_analise || h.created_at)} · {h.analyst_name || '-'}</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><strong>{h.total_score}/100</strong><ClassBadge label={h.classification} /></span>
            </button>
          ))}
        </div>
      )}

      <Notice tone="info">
        Os itens abaixo foram <strong>sugeridos automaticamente</strong> a partir do cadastro preenchido pela família.
        A equipe deve conferir documentos, fotografias e informações antes de confirmar cada marcação.
      </Notice>

      {/* 1. IDENTIFICAÇÃO */}
      <Section number="1" title="Identificação">
        <div className={styles.grid3}>
          <Field label="Número do cadastro"><input type="text" value={triage.identificacao.numero_cadastro} onChange={e => set('identificacao.numero_cadastro', e.target.value)} /></Field>
          <Field label="Nome da pessoa responsável" span={2}><input type="text" value={triage.identificacao.responsavel_familia} onChange={e => set('identificacao.responsavel_familia', e.target.value)} /></Field>
          <Field label="Data da análise"><input type="date" value={triage.identificacao.data_analise} onChange={e => set('identificacao.data_analise', e.target.value)} /></Field>
          <Field label="Responsável pela triagem"><input type="text" value={triage.identificacao.responsavel} onChange={e => set('identificacao.responsavel', e.target.value)} /></Field>
          <Field label="Função"><input type="text" value={triage.identificacao.funcao} onChange={e => set('identificacao.funcao', e.target.value)} /></Field>
        </div>
      </Section>

      {/* 2. CONFERÊNCIA INICIAL */}
      <Section number="2" title="Conferência Inicial">
        <Question label="Cadastro">
          <RadioGroup name="conf_cadastro" options={['Formulário completo', 'Formulário com pendências']} value={triage.conferencia.cadastro} onChange={v => set('conferencia.cadastro', v)} />
        </Question>
        <Question label="Documentação mínima">
          <CheckGroup options={CONF_DOCS} value={triage.conferencia.documentos} onChange={v => set('conferencia.documentos', v)} />
        </Question>
        <Question label="Resultado da conferência">
          <CheckGroup options={CONF_RESULT} value={triage.conferencia.resultado} onChange={v => set('conferencia.resultado', v)} />
        </Question>
      </Section>

      {/* 3. CÁLCULO DA RENDA */}
      <Section number="3" title="Cálculo da Renda">
        <div className={styles.grid4}>
          <Field label="Renda familiar bruta mensal"><MoneyInput value={triage.calculo.renda_bruta} onChange={v => set('calculo.renda_bruta', v)} /></Field>
          <Field label="Número de integrantes"><input type="number" min="1" value={triage.calculo.integrantes} onChange={e => set('calculo.integrantes', e.target.value)} /></Field>
          <Field label="Renda familiar per capita"><input type="text" value={formatMoney(perCapita)} disabled /></Field>
          <Field label="Salário-mínimo vigente considerado"><MoneyInput value={triage.calculo.salario_minimo} onChange={v => set('calculo.salario_minimo', v)} /></Field>
        </div>
      </Section>

      {/* 4. MATRIZ */}
      <Section number="4" title="Matriz de Pontuação Socioeconômica">
        <div className={styles.axisHeader}>
          <h4>EIXO 1 — RENDA FAMILIAR PER CAPITA <span style={{ color: '#64748b', fontWeight: 500 }}>(máximo: 30 pontos)</span></h4>
          <span className={styles.axisScore}>{scores.renda}/30</span>
        </div>
        {bandaSugerida && bandaSugerida.key !== triage.renda_faixa && (
          <p className={styles.axisRule}>
            Pelo cálculo acima, a faixa correspondente é <strong>{bandaSugerida.label}</strong>.{' '}
            <button type="button" className={styles.secondaryBtn} style={{ padding: '3px 10px' }} onClick={() => set('renda_faixa', bandaSugerida.key)}>Aplicar</button>
          </p>
        )}
        <RadioGroup name="renda_faixa" options={RENDA_BANDS} columns={1} value={triage.renda_faixa} onChange={v => set('renda_faixa', v)} />

        {renderAxis('trabalho', 'EIXO 2')}
        {renderAxis('composicao', 'EIXO 3')}
        {renderAxis('cadunico', 'EIXO 4')}
      </Section>

      <Section number="5" title="Saúde, Deficiência e Cuidados">{renderAxis('saude', '5')}</Section>

      <Section number="6" title="Moradia, Insalubridade e Reforma Solidária">
        {renderAxis('moradia', '6')}
        <p className={styles.axisRule}>Somatório identificado: <strong>{moradiaBruta}</strong> · Pontuação computável: máximo de 25 pontos.</p>
        <Question label="Análise específica – Reforma Solidária">
          <CheckGroup options={REFORMA_ANALISE} value={triage.reforma.analise} onChange={v => set('reforma.analise', v)} />
        </Question>
        <Question label="Encaminhamento Reforma Solidária">
          <CheckGroup options={REFORMA_ENCAMINHAMENTO} value={triage.reforma.encaminhamento} onChange={v => set('reforma.encaminhamento', v)} />
        </Question>
      </Section>

      <Section number="7" title="Comprometimento da Renda">{renderAxis('comprometimento', '7')}</Section>
      <Section number="8" title="Rede de Apoio e Acesso a Direitos">{renderAxis('rede', '8')}</Section>

      {/* 9. CONSOLIDAÇÃO */}
      <Section number="9" title="Consolidação da Matriz">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Eixo</th><th>Máximo</th><th>Pontuação</th></tr></thead>
            <tbody>
              {AXES.map(a => <tr key={a.key}><td>{a.label}</td><td>{a.max}</td><td><strong>{scores[a.key]}</strong></td></tr>)}
              <tr className={styles.totalRow}><td>TOTAL</td><td>100</td><td>{total}</td></tr>
            </tbody>
          </table>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Pontuação</th><th>Classificação inicial</th></tr></thead>
            <tbody>
              {CLASSIFICATIONS.map((c, i) => (
                <tr key={c.label} style={c.label === classe.label ? { background: c.bg } : undefined}>
                  <td>{c.min}–{i === 0 ? 100 : CLASSIFICATIONS[i - 1].min - 1}</td>
                  <td style={{ color: c.color, fontWeight: c.label === classe.label ? 800 : 500 }}>{c.label}{c.label === classe.label ? ' ◀' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Notice tone="warn">
          <strong>IMPORTANTE:</strong> A pontuação constitui instrumento de triagem e priorização. Não representa diagnóstico social,
          não substitui avaliação técnica do Serviço Social quando esta for necessária e não gera direito automático a benefício, doação ou serviço.
        </Notice>
      </Section>

      {/* 10. CONSISTÊNCIA */}
      <Section number="10" title="Análise de Consistência dos Documentos">
        <Question label="CNIS"><CheckGroup options={CNIS_OPTIONS} value={triage.consistencia.cnis} onChange={v => set('consistencia.cnis', v)} /></Question>
        <Question label="Renda declarada x documentos"><CheckGroup options={RENDA_DOC_OPTIONS} columns={3} value={triage.consistencia.renda_documentos} onChange={v => set('consistencia.renda_documentos', v)} /></Question>
        <Field label="Observações"><textarea rows="3" value={triage.consistencia.observacoes} onChange={e => set('consistencia.observacoes', e.target.value)} /></Field>
      </Section>

      {/* 11. GATILHOS */}
      <Section number="11" title="Gatilhos Obrigatórios para Avaliação do Serviço Social" subtitle="Independentemente da pontuação obtida, encaminhar para avaliação do Serviço Social quando houver:">
        <CheckGroup options={GATILHOS} value={triage.gatilhos} onChange={v => set('gatilhos', v)} />
        {triage.gatilhos.length > 0 && !triage.resultado.encaminhamentos.includes('Encaminhamento ao Serviço Social') && (
          <Notice tone="warn">
            Há gatilho obrigatório marcado. Inclua <strong>"Encaminhamento ao Serviço Social"</strong> no resultado da triagem.{' '}
            <button type="button" className={styles.secondaryBtn} style={{ padding: '3px 10px' }}
              onClick={() => set('resultado.encaminhamentos', [...triage.resultado.encaminhamentos, 'Encaminhamento ao Serviço Social'])}>Incluir</button>
          </Notice>
        )}
      </Section>

      {/* 12. RESULTADO */}
      <Section number="12" title="Resultado da Triagem">
        <div className={styles.scoreSummary} style={{ background: classe.bg }}>
          <div>
            <span className={styles.statLabel}>Pontuação final</span>
            <span className={styles.scoreBig} style={{ color: classe.color }}>{total}<small style={{ fontSize: '1rem' }}>/100</small></span>
          </div>
          <ClassBadge label={classe.label} />
        </div>
        <Question label="Classificação">
          <RadioGroup
            name="classificacao" columns={3}
            options={CLASSIFICATIONS.map(c => c.label)}
            value={triage.resultado.classificacao_manual || classe.label}
            onChange={v => set('resultado.classificacao_manual', v)}
          />
          {triage.resultado.classificacao_manual && triage.resultado.classificacao_manual !== classe.label && (
            <p className={styles.axisRule} style={{ marginTop: 8 }}>A classificação marcada difere da calculada pela matriz ({classe.label}). Justifique nas observações/leitura psicossocial.</p>
          )}
        </Question>
        <Question label="Encaminhamento">
          <CheckGroup options={ENCAMINHAMENTOS} value={triage.resultado.encaminhamentos} onChange={v => set('resultado.encaminhamentos', v)} />
        </Question>
        <div className={styles.grid2}>
          <Field label="Responsável pela triagem"><input type="text" value={triage.resultado.responsavel} onChange={e => set('resultado.responsavel', e.target.value)} /></Field>
          <Field label="Data"><input type="date" value={triage.resultado.data} onChange={e => set('resultado.data', e.target.value)} /></Field>
        </div>
      </Section>

      {/* 13. LEITURA PSICOSSOCIAL */}
      <Section number="13" title="Leitura Psicossocial — uso da equipe">
        <Field label="Principais fatores de vulnerabilidade identificados"><textarea rows="3" value={triage.leitura_psicossocial.fatores} onChange={e => set('leitura_psicossocial.fatores', e.target.value)} /></Field>
        <Field label="Principais recursos/potencialidades identificados"><textarea rows="3" value={triage.leitura_psicossocial.recursos} onChange={e => set('leitura_psicossocial.recursos', e.target.value)} /></Field>
        <Field label="Principais barreiras à autonomia/participação"><textarea rows="3" value={triage.leitura_psicossocial.barreiras} onChange={e => set('leitura_psicossocial.barreiras', e.target.value)} /></Field>
        <Question label="Possibilidades de intervenção do Instituto:">
          <CheckGroup
            options={INTERVENCOES} value={triage.leitura_psicossocial.intervencoes} onChange={v => set('leitura_psicossocial.intervencoes', v)}
            extra={{ option: 'Outro', value: triage.leitura_psicossocial.intervencao_outra, onChange: v => set('leitura_psicossocial.intervencao_outra', v) }}
          />
        </Question>
      </Section>

      {/* 14. SERVIÇO SOCIAL */}
      <Section number="14" title="Campo Exclusivo do Serviço Social" subtitle="Preencher somente quando houver encaminhamento para avaliação profissional.">
        <CheckGroup options={SERVICO_SOCIAL} value={triage.servico_social.acoes} onChange={v => set('servico_social.acoes', v)} />
        <Notice tone="muted">Registro técnico deverá ser realizado em instrumento próprio e mantido sob acesso restrito, observadas as normas profissionais aplicáveis.</Notice>
        <div className={styles.grid3}>
          <Field label="Assistente Social"><input type="text" value={triage.servico_social.assistente_social} onChange={e => set('servico_social.assistente_social', e.target.value)} /></Field>
          <Field label="CRESS"><input type="text" value={triage.servico_social.cress} onChange={e => set('servico_social.cress', e.target.value)} /></Field>
          <Field label="Data"><input type="date" value={triage.servico_social.data} onChange={e => set('servico_social.data', e.target.value)} /></Field>
        </div>
      </Section>

      <div className={styles.actions}>
        <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : triageId ? 'Salvar Alterações da Triagem' : 'Registrar Triagem'}
        </Button>
      </div>
    </div>
  );
};

export default SocioTriageForm;
