// Arquivo: src/components/family/FamilyProfileSections.jsx
// Seções 5 a 16 do "Cadastro e Perfil Sociofamiliar da Família" (Programa Selo Cidadania)

import React from 'react';
import styles from './FamilyForm.module.css';
import { Section, Field, Question, CheckGroup, RadioGroup, YesNo, MoneyInput, Notice } from './FormControls';
import FileAttachments from './FileAttachments';
import {
  MAIN_INCOME_SOURCES, INCOME_TYPES, INCOME_REGULARITY, CADUNICO_OPTIONS, BENEFIT_OPTIONS, FOLLOWUP_OPTIONS,
  EXPENSE_TYPES, HEALTH_QUESTIONS, HOUSING_SITUATION, HOUSING_KIND, HOUSING_MATERIAL, INFRASTRUCTURE,
  HOUSING_PROBLEMS, PHOTO_TYPES, DOCUMENT_GROUPS, SUPPORT_NEEDS, COMMUNITY_PARTICIPATION, PARTICIPATION_BARRIERS,
  MAIN_DIFFICULTIES, FAMILY_STRENGTHS, sumValues, formatMoney
} from '../../utils/familyProfile';

const FamilyProfileSections = ({
  profile, setField, userId, files, setFiles,
  housingSituation, setHousingSituation, roomsCount, setRoomsCount,
  totalMembers, membersIncome
}) => {
  const p = profile;
  const rendaTotal = sumValues(p.renda.valores);
  const despesasTotal = sumValues(p.despesas.valores);
  const toggleIn = (path, list, item, on) => setField(path, on ? [...new Set([...list, item])] : list.filter(i => i !== item));

  return (
    <>
      {/* 5. RENDA FAMILIAR */}
      <Section number="5" title="Renda Familiar">
        <Question label="Qual é atualmente a principal fonte de renda da família?">
          <RadioGroup
            name="fonte_principal" options={MAIN_INCOME_SOURCES} columns={3}
            value={p.renda.fonte_principal} onChange={v => setField('renda.fonte_principal', v)}
            extra={{ option: 'Outra', value: p.renda.fonte_principal_outra, onChange: v => setField('renda.fonte_principal_outra', v) }}
          />
        </Question>

        <Question label="Informe as rendas recebidas pela família:">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Tipo de renda</th><th style={{ width: 220 }}>Valor mensal aproximado</th></tr></thead>
              <tbody>
                {INCOME_TYPES.map(t => (
                  <tr key={t.key}>
                    <td>{t.label}</td>
                    <td><MoneyInput value={p.renda.valores[t.key]} onChange={v => setField(`renda.valores.${t.key}`, v)} /></td>
                  </tr>
                ))}
                <tr className={styles.totalRow}><td>RENDA FAMILIAR TOTAL</td><td>{formatMoney(rendaTotal)}</td></tr>
              </tbody>
            </table>
          </div>
          {membersIncome > 0 && Math.abs(membersIncome - rendaTotal) > 0.009 && (
            <Notice tone="warn">
              A soma das rendas individuais informadas na composição familiar é <strong>{formatMoney(membersIncome)}</strong>.
              Confira se todas as rendas foram incluídas na tabela acima.
            </Notice>
          )}
        </Question>

        <Question label="A renda da família é:">
          <RadioGroup name="regularidade" options={INCOME_REGULARITY} columns={4} value={p.renda.regularidade} onChange={v => setField('renda.regularidade', v)} />
        </Question>

        <Question label="Alguma pessoa que contribuía de maneira importante para a renda familiar ficou desempregada recentemente?">
          <YesNo name="desemprego_recente" value={p.renda.desemprego_recente} onChange={v => setField('renda.desemprego_recente', v)} />
          {p.renda.desemprego_recente === 'Sim' && (
            <div className={styles.grid2} style={{ marginTop: 10 }}>
              <Field label="Quando?"><input type="text" placeholder="Ex: Março/2026" value={p.renda.desemprego_quando} onChange={e => setField('renda.desemprego_quando', e.target.value)} /></Field>
            </div>
          )}
        </Question>
      </Section>

      {/* 6. CADÚNICO E BENEFÍCIOS */}
      <Section number="6" title="CadÚnico e Benefícios Sociais">
        <Question label="A família possui inscrição no CadÚnico?">
          <RadioGroup name="cadunico" options={CADUNICO_OPTIONS} columns={4} value={p.cadunico.inscricao} onChange={v => setField('cadunico.inscricao', v)} />
        </Question>
        <div className={styles.grid2}>
          <Field label="NIS da pessoa responsável"><input type="text" inputMode="numeric" value={p.cadunico.nis} onChange={e => setField('cadunico.nis', e.target.value)} /></Field>
        </div>
        <Question label="A família recebe atualmente:">
          <CheckGroup
            options={BENEFIT_OPTIONS} columns={3} value={p.cadunico.beneficios}
            onChange={v => {
              const last = v[v.length - 1];
              // "Não recebe benefício" é exclusivo
              if (last === 'Não recebe benefício') setField('cadunico.beneficios', ['Não recebe benefício']);
              else setField('cadunico.beneficios', v.filter(b => b !== 'Não recebe benefício'));
            }}
            extra={{ option: 'Outro', value: p.cadunico.beneficio_outro, onChange: v => setField('cadunico.beneficio_outro', v) }}
          />
        </Question>
        <div className={styles.grid2}>
          <Field label="Valor mensal aproximado dos benefícios"><MoneyInput value={p.cadunico.valor_beneficios} onChange={v => setField('cadunico.valor_beneficios', v)} /></Field>
        </div>
        <Question label="A família é acompanhada pelo:">
          <CheckGroup options={FOLLOWUP_OPTIONS} columns={3} value={p.cadunico.acompanhamento} onChange={v => setField('cadunico.acompanhamento', v)} />
        </Question>
        <div className={styles.grid2}>
          <Field label="Qual unidade/serviço?"><input type="text" value={p.cadunico.unidade_servico} onChange={e => setField('cadunico.unidade_servico', e.target.value)} /></Field>
        </div>
      </Section>

      {/* 7. DESPESAS ESSENCIAIS */}
      <Section number="7" title="Despesas Essenciais da Família" subtitle="Informe valores aproximados:">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Despesa</th><th style={{ width: 220 }}>Valor mensal</th></tr></thead>
            <tbody>
              {EXPENSE_TYPES.map(t => (
                <tr key={t.key}>
                  <td>{t.label}</td>
                  <td><MoneyInput value={p.despesas.valores[t.key]} onChange={v => setField(`despesas.valores.${t.key}`, v)} /></td>
                </tr>
              ))}
              <tr className={styles.totalRow}><td>TOTAL APROXIMADO</td><td>{formatMoney(despesasTotal)}</td></tr>
            </tbody>
          </table>
        </div>
        <Question label="Existe alguma despesa extraordinária que comprometa significativamente a renda familiar?">
          <YesNo name="extraordinaria" value={p.despesas.extraordinaria} onChange={v => setField('despesas.extraordinaria', v)} />
          {p.despesas.extraordinaria === 'Sim' && (
            <div className={styles.grid2} style={{ marginTop: 10 }}>
              <Field label="Qual?"><input type="text" value={p.despesas.extraordinaria_qual} onChange={e => setField('despesas.extraordinaria_qual', e.target.value)} /></Field>
              <Field label="Valor aproximado"><MoneyInput value={p.despesas.extraordinaria_valor} onChange={v => setField('despesas.extraordinaria_valor', v)} /></Field>
            </div>
          )}
        </Question>
      </Section>

      {/* 8. SAÚDE */}
      <Section number="8" title="Saúde, Deficiência e Necessidade de Cuidados">
        {HEALTH_QUESTIONS.map(q => (
          <Question key={q.key} label={q.label}>
            <YesNo name={`saude_${q.key}`} value={p.saude[q.key]} onChange={v => setField(`saude.${q.key}`, v)} />
          </Question>
        ))}
        <Notice tone="muted">
          <strong>Observação:</strong> neste cadastro inicial não é necessário informar diagnóstico médico detalhado. Caso alguma informação
          complementar seja necessária para determinado atendimento, a equipe orientará a família.
        </Notice>
      </Section>

      {/* 9. SITUAÇÃO DA MORADIA */}
      <Section
        number="9" title="Situação da Moradia"
        subtitle="Identificação de necessidades para o Programa Reforma Solidária. O Instituto Energizando Vidas também busca identificar famílias cujas condições de moradia possam comprometer sua segurança, salubridade, saúde e qualidade de vida. Essas informações poderão subsidiar a identificação de famílias com perfil para avaliação pelo Programa Reforma Solidária."
      >
        <h4 style={{ margin: '0 0 6px 0', color: '#334155' }}>9.1 Características da residência</h4>
        <Question label="A moradia é:">
          <RadioGroup
            name="moradia_situacao" options={HOUSING_SITUATION} columns={4} value={housingSituation} onChange={setHousingSituation}
            extra={{ option: 'Outra', value: p.moradia.situacao_outra, onChange: v => setField('moradia.situacao_outra', v) }}
          />
        </Question>
        <Question label="Tipo:">
          <RadioGroup
            name="moradia_tipo" options={HOUSING_KIND} columns={5} value={p.moradia.tipo} onChange={v => setField('moradia.tipo', v)}
            extra={{ option: 'Outro', value: p.moradia.tipo_outro, onChange: v => setField('moradia.tipo_outro', v) }}
          />
        </Question>
        <Question label="Material predominante:">
          <RadioGroup name="moradia_material" options={HOUSING_MATERIAL} columns={4} value={p.moradia.material} onChange={v => setField('moradia.material', v)} />
        </Question>
        <div className={styles.grid4}>
          <Field label="Número de cômodos"><input type="number" min="0" value={roomsCount} onChange={e => setRoomsCount(e.target.value)} /></Field>
          <Field label="Número de dormitórios"><input type="number" min="0" value={p.moradia.dormitorios} onChange={e => setField('moradia.dormitorios', e.target.value)} /></Field>
          <Field label="Número de moradores" hint="Calculado pela composição familiar"><input type="number" value={totalMembers} disabled /></Field>
          <Field label="Pessoas no dormitório mais ocupado"><input type="number" min="0" value={p.moradia.pessoas_dormitorio_mais_ocupado} onChange={e => setField('moradia.pessoas_dormitorio_mais_ocupado', e.target.value)} /></Field>
        </div>
      </Section>

      {/* 10. INFRAESTRUTURA */}
      <Section number="10" title="Infraestrutura da Moradia" subtitle="A residência possui:">
        <CheckGroup options={INFRASTRUCTURE} columns={3} value={p.infraestrutura} onChange={v => setField('infraestrutura', v)} />
      </Section>

      {/* 11. PROBLEMAS NA MORADIA */}
      <Section number="11" title="Problemas Existentes na Moradia" subtitle="Marque todas as situações existentes:">
        <CheckGroup
          options={HOUSING_PROBLEMS} columns={3} value={p.problemas.lista} onChange={v => setField('problemas.lista', v)}
          extra={{ option: 'Outro', value: p.problemas.outro, onChange: v => setField('problemas.outro', v) }}
        />
        <div className={styles.grid2} style={{ marginTop: 16 }}>
          <Field label="Qual é atualmente o principal problema da residência?"><input type="text" value={p.problemas.principal} onChange={e => setField('problemas.principal', e.target.value)} /></Field>
          <Field label="Há quanto tempo existe?"><input type="text" placeholder="Ex: 2 anos" value={p.problemas.ha_quanto_tempo} onChange={e => setField('problemas.ha_quanto_tempo', e.target.value)} /></Field>
        </div>
        <Question label="O problema impede ou dificulta o uso de algum cômodo?">
          <YesNo name="impede_comodo" value={p.problemas.impede_comodo} onChange={v => setField('problemas.impede_comodo', v)} />
          {p.problemas.impede_comodo === 'Sim' && (
            <div className={styles.grid2} style={{ marginTop: 10 }}>
              <Field label="Qual?"><input type="text" value={p.problemas.impede_comodo_qual} onChange={e => setField('problemas.impede_comodo_qual', e.target.value)} /></Field>
            </div>
          )}
        </Question>
        <Question label="A família considera que as condições da residência estão prejudicando a saúde, segurança ou qualidade de vida dos moradores?">
          <YesNo name="prejudica_saude" value={p.problemas.prejudica_saude} onChange={v => setField('problemas.prejudica_saude', v)} />
          {p.problemas.prejudica_saude === 'Sim' && (
            <Field label="Explique brevemente:"><textarea rows="3" value={p.problemas.prejudica_explicacao} onChange={e => setField('problemas.prejudica_explicacao', e.target.value)} /></Field>
          )}
        </Question>
      </Section>

      {/* 12. FOTOS */}
      <Section
        number="12" title="Fotos para Avaliação do Reforma Solidária"
        subtitle="Caso a família tenha interesse em ser avaliada para o Programa Reforma Solidária, solicitamos o envio de fotografias que permitam visualizar as condições da residência. Sempre que possível, anexar:"
      >
        {PHOTO_TYPES.map(type => (
          <FileAttachments
            key={type} userId={userId} category="housing_photo" subtype={type} files={files} onFilesChange={setFiles} accept="image/*"
            checked={p.fotos.checklist.includes(type)} onToggle={on => toggleIn('fotos.checklist', p.fotos.checklist, type, on)}
          />
        ))}
        <Notice tone="muted">Não é necessário fotografar pessoas. As fotografias devem, preferencialmente, demonstrar apenas as condições da residência.</Notice>
        <label className={`${styles.option} ${p.fotos.interesse_reforma ? styles.optionChecked : ''}`}>
          <input type="checkbox" checked={p.fotos.interesse_reforma} onChange={e => setField('fotos.interesse_reforma', e.target.checked)} />
          <span>Tenho interesse em ter minha família avaliada para eventual participação no Programa Reforma Solidária.</span>
        </label>
      </Section>

      {/* 13. DOCUMENTOS */}
      <Section
        number="13" title="Documentos Mínimos para Análise Socioeconômica"
        subtitle="Para que o Instituto possa realizar a análise inicial, deverão ser anexados somente os documentos necessários à comprovação das informações socioeconômicas declaradas."
      >
        {DOCUMENT_GROUPS.map(group => (
          <div key={group.key} style={{ marginBottom: 18 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>{group.title}</h4>
            {group.help && <p className={styles.sectionSubtitle} style={{ marginBottom: 10 }}>{group.help}</p>}
            {group.items.map(item => (
              <FileAttachments
                key={item} userId={userId} category="document" subtype={item} files={files} onFilesChange={setFiles}
                checked={p.documentos.checklist.includes(item)} onToggle={on => toggleIn('documentos.checklist', p.documentos.checklist, item, on)}
              />
            ))}
          </div>
        ))}
        <Notice tone="info">
          <p><strong>Pessoa sem renda:</strong> quando a pessoa adulta declarar que não possui renda, deverá informar essa condição no cadastro e apresentar o CNIS para auxiliar na verificação da existência ou inexistência de vínculos e benefícios registrados.</p>
          <p>A ausência de vínculo ou remuneração no CNIS não será considerada, isoladamente, prova absoluta de ausência de renda, pois poderão existir rendimentos informais ou outras fontes não registradas.</p>
          <p><strong>Documentos adicionais:</strong> a equipe poderá solicitar documentação complementar somente quando necessária para esclarecer informação relevante ou inconsistência identificada durante a análise.</p>
        </Notice>
        <label className={`${styles.option} ${p.documentos.sem_renda_declarada ? styles.optionChecked : ''}`}>
          <input type="checkbox" checked={p.documentos.sem_renda_declarada} onChange={e => setField('documentos.sem_renda_declarada', e.target.checked)} />
          <span>Declaro que há pessoa adulta na família sem renda (apresentar o CNIS dessa pessoa).</span>
        </label>
      </Section>

      {/* 14. OUTRAS NECESSIDADES */}
      <Section number="14" title="Outras Necessidades da Família" subtitle="Em quais áreas sua família considera que necessita atualmente de maior apoio?">
        <CheckGroup
          options={SUPPORT_NEEDS} columns={3} value={p.necessidades.lista} onChange={v => setField('necessidades.lista', v)}
          extra={{ option: 'Outro', value: p.necessidades.outro, onChange: v => setField('necessidades.outro', v) }}
        />
      </Section>

      {/* 15. AVALIAÇÃO PSICOSSOCIAL */}
      <Section number="15" title="Avaliação Psicossocial: Recursos, Redes e Participação Comunitária">
        <Question label="Sua família atualmente tem acesso ou participa de algum grupo, projeto, serviço ou atividade da comunidade?">
          <CheckGroup
            options={COMMUNITY_PARTICIPATION} columns={3} value={p.psicossocial.participacao}
            onChange={v => {
              const last = v[v.length - 1];
              const none = 'Não participa ou não possui acesso atualmente';
              setField('psicossocial.participacao', last === none ? [none] : v.filter(i => i !== none));
            }}
            extra={{ option: 'Outro', value: p.psicossocial.participacao_outro, onChange: v => setField('psicossocial.participacao_outro', v) }}
          />
        </Question>
        <Question label="Caso não participe ou tenha participação limitada, existe alguma dificuldade que interfere nessa participação?">
          <CheckGroup
            options={PARTICIPATION_BARRIERS} columns={2} value={p.psicossocial.barreiras} onChange={v => setField('psicossocial.barreiras', v)}
            extra={{ option: 'Outra', value: p.psicossocial.barreira_outra, onChange: v => setField('psicossocial.barreira_outra', v) }}
          />
        </Question>
        <Question label="Pensando na realidade atual da sua família, qual situação mais dificulta a melhoria das condições de vida de vocês?">
          <CheckGroup
            options={MAIN_DIFFICULTIES} columns={2} value={p.psicossocial.dificuldade_principal} onChange={v => setField('psicossocial.dificuldade_principal', v)}
            extra={{ option: 'Outra situação', value: p.psicossocial.dificuldade_outra, onChange: v => setField('psicossocial.dificuldade_outra', v) }}
          />
        </Question>
        <Question label="Quais são as principais forças ou recursos que você e sua família reconhecem já possuir para enfrentar as dificuldades do dia a dia?">
          <CheckGroup
            options={FAMILY_STRENGTHS} columns={2} value={p.psicossocial.forcas}
            onChange={v => {
              const last = v[v.length - 1];
              const none = 'No momento, não identifica recursos';
              setField('psicossocial.forcas', last === none ? [none] : v.filter(i => i !== none));
            }}
            extra={{ option: 'Outra', value: p.psicossocial.forca_outra, onChange: v => setField('psicossocial.forca_outra', v) }}
          />
        </Question>
        <Field label="Se pudesse escolher uma mudança que faria maior diferença para melhorar a vida da sua família hoje, qual seria?">
          <textarea rows="4" value={p.psicossocial.mudanca_desejada} onChange={e => setField('psicossocial.mudanca_desejada', e.target.value)} />
        </Field>
      </Section>

      {/* 16. DECLARAÇÃO E LGPD */}
      <Section number="16" title="Declaração da Família e Proteção de Dados">
        <Notice tone="muted">
          <p>Declaro que as informações prestadas neste formulário são verdadeiras de acordo com meu conhecimento e estou ciente de que poderão ser solicitados esclarecimentos ou documentos complementares quando necessários à análise.</p>
          <p>Estou ciente de que o Instituto Energizando Vidas realizará o tratamento dos dados pessoais estritamente necessários para cadastro, análise socioeconômica, identificação de situações de vulnerabilidade, gestão do Programa Selo Cidadania e execução de seus programas e ações, observando a legislação aplicável à proteção de dados pessoais.</p>
          <p>Os dados pessoais e documentos deverão ter acesso restrito às pessoas autorizadas e ser armazenados de maneira segura.</p>
          <p>Estou ciente de que determinadas situações poderão ser encaminhadas ao Serviço Social para avaliação individualizada.</p>
        </Notice>
        <label className={`${styles.option} ${p.declaracao.ciente ? styles.optionChecked : ''}`} style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={p.declaracao.ciente} onChange={e => setField('declaracao.ciente', e.target.checked)} />
          <span>Li e estou ciente.</span>
        </label>
        <div className={styles.grid3}>
          <Field label="Nome"><input type="text" value={p.declaracao.nome} onChange={e => setField('declaracao.nome', e.target.value)} /></Field>
          <Field label="Data"><input type="date" value={p.declaracao.data} onChange={e => setField('declaracao.data', e.target.value)} /></Field>
          <Field label="Assinatura/aceite eletrônico" hint="Digite seu nome completo como aceite">
            <input type="text" value={p.declaracao.aceite_eletronico} onChange={e => setField('declaracao.aceite_eletronico', e.target.value)} />
          </Field>
        </div>

        <h4 style={{ margin: '20px 0 8px 0', color: '#334155' }}>Autorização específica – fotografias da moradia</h4>
        <label className={`${styles.option} ${p.declaracao.autoriza_fotos ? styles.optionChecked : ''}`} style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={p.declaracao.autoriza_fotos} onChange={e => setField('declaracao.autoriza_fotos', e.target.checked)} />
          <span>Autorizo o tratamento das fotografias da minha residência exclusivamente para análise das condições habitacionais, seleção, planejamento, execução, acompanhamento e comprovação das ações relacionadas ao Programa Reforma Solidária.</span>
        </label>
        <div className={styles.grid2}>
          <Field label="Assinatura/aceite" hint="Digite seu nome completo como aceite">
            <input type="text" value={p.declaracao.aceite_fotos} onChange={e => setField('declaracao.aceite_fotos', e.target.value)} />
          </Field>
        </div>
      </Section>
    </>
  );
};

export default FamilyProfileSections;
