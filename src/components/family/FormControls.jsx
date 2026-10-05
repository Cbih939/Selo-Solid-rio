// Arquivo: src/components/family/FormControls.jsx
// Controles reutilizáveis do Cadastro Sociofamiliar e da Triagem Socioeconômica

import React from 'react';
import styles from './FamilyForm.module.css';

export const Section = ({ number, title, subtitle, children }) => (
  <section className={styles.section}>
    <h3 className={styles.sectionTitle}>
      {number && <span className={styles.sectionNumber}>{number}</span>}
      {title}
    </h3>
    {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    {children}
  </section>
);

export const Field = ({ label, children, span, hint }) => (
  <div className={styles.field} style={span ? { gridColumn: `span ${span}` } : undefined}>
    {label && <label>{label}</label>}
    {children}
    {hint && <small className={styles.hint}>{hint}</small>}
  </div>
);

export const Question = ({ label, children }) => (
  <div className={styles.question}>
    <p className={styles.questionLabel}>{label}</p>
    {children}
  </div>
);

// Múltipla escolha (checkboxes). `extra` permite campo "Outro: ___" ao marcar a opção indicada.
export const CheckGroup = ({ options, value = [], onChange, columns = 2, extra, disabled }) => {
  const toggle = (opt) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  };
  return (
    <div className={styles.optionGrid} style={{ '--cols': columns }}>
      {options.map(opt => {
        const key = typeof opt === 'string' ? opt : opt.key;
        const label = typeof opt === 'string' ? opt : opt.label;
        const checked = value.includes(key);
        return (
          <div key={key} className={styles.optionCell}>
            <label className={`${styles.option} ${checked ? styles.optionChecked : ''}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(key)} disabled={disabled} />
              <span>{label}{opt.points !== undefined && <em className={styles.points}> – {opt.points} pt{opt.points === 1 ? '' : 's'}</em>}</span>
            </label>
            {extra && extra.option === key && checked && (
              <input
                type="text" className={styles.inlineInput} placeholder={extra.placeholder || 'Especifique...'}
                value={extra.value || ''} onChange={e => extra.onChange(e.target.value)} disabled={disabled}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Escolha única (radio). Clicar de novo na opção marcada desmarca.
export const RadioGroup = ({ name, options, value, onChange, columns = 2, extra, disabled }) => (
  <div className={styles.optionGrid} style={{ '--cols': columns }}>
    {options.map(opt => {
      const key = typeof opt === 'string' ? opt : opt.key;
      const label = typeof opt === 'string' ? opt : opt.label;
      const checked = value === key;
      return (
        <div key={key} className={styles.optionCell}>
          <label className={`${styles.option} ${checked ? styles.optionChecked : ''}`}>
            <input
              type="radio" name={name} checked={checked} disabled={disabled}
              onChange={() => onChange(key)} onClick={() => { if (checked) onChange(''); }}
            />
            <span>{label}{opt.points !== undefined && <em className={styles.points}> – {opt.points} pts</em>}</span>
          </label>
          {extra && extra.option === key && checked && (
            <input
              type="text" className={styles.inlineInput} placeholder={extra.placeholder || 'Especifique...'}
              value={extra.value || ''} onChange={e => extra.onChange(e.target.value)} disabled={disabled}
            />
          )}
        </div>
      );
    })}
  </div>
);

export const YesNo = ({ name, value, onChange, disabled }) => (
  <RadioGroup name={name} options={['Não', 'Sim']} value={value} onChange={onChange} columns={2} disabled={disabled} />
);

export const MoneyInput = ({ value, onChange, disabled, placeholder = '0,00' }) => (
  <div className={styles.moneyInput}>
    <span>R$</span>
    <input
      type="text" inputMode="decimal" value={value || ''} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
    />
  </div>
);

export const Notice = ({ children, tone = 'info' }) => (
  <div className={`${styles.notice} ${styles[`notice_${tone}`] || ''}`}>{children}</div>
);
