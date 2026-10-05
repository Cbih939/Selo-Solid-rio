// Arquivo: src/components/family/TriageSummary.jsx
// Resumo da triagem socioeconômica por beneficiário para as listagens (Admin e OSC)

import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { classificationStyle } from '../../utils/familyProfile';

// Retorna um mapa { [userId]: { total_score, classification, triage_date, declaration_accepted, ... } }
export const useTriageSummary = (ongId) => {
  const [summary, setSummary] = useState({});
  useEffect(() => {
    let active = true;
    const params = ongId && ongId !== 'all' ? { ong_id: ongId } : {};
    api.get('/family-profiles/summary', { params })
      .then(res => {
        if (!active) return;
        const map = {};
        (res.data || []).forEach(r => { map[r.user_id] = r; });
        setSummary(map);
      })
      .catch(err => console.error('Erro ao buscar resumo das triagens:', err));
    return () => { active = false; };
  }, [ongId]);
  return summary;
};

// Selo clicável com a classificação; sem triagem mostra o estado do cadastro
export const TriageBadge = ({ info, onClick }) => {
  const base = { display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit' };

  if (info?.classification) {
    const c = classificationStyle(info.classification);
    return (
      <button type="button" onClick={onClick} title={`Triagem: ${info.total_score}/100 – ${info.classification}`} style={{ ...base, background: c.bg, color: c.color }}>
        {info.total_score} · {c.short}
      </button>
    );
  }
  const label = info?.declaration_accepted ? 'Cadastro ok · triar' : info?.profile_updated_at ? 'Cadastro pendente' : 'Sem cadastro';
  return (
    <button type="button" onClick={onClick} title="Abrir triagem socioeconômica" style={{ ...base, background: '#f1f5f9', color: '#475569' }}>
      {label}
    </button>
  );
};
