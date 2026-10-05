// Arquivo: src/components/family/FileAttachments.jsx
// Anexos do cadastro sociofamiliar (fotos da moradia e documentos).
// Os arquivos são privados: abertos somente por requisição autenticada.

import React, { useRef, useState } from 'react';
import api from '../../api/api';
import styles from './FamilyForm.module.css';

export const openFamilyFile = async (userId, file) => {
  try {
    const res = await api.get(`/family-profiles/${userId}/files/${file.id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    alert('Não foi possível abrir o arquivo.');
  }
};

// Linha com checkbox + botão de anexo + arquivos já enviados para aquele item
const FileAttachments = ({ userId, category, subtype, files, onFilesChange, checked, onToggle, accept = 'image/*,application/pdf' }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const itemFiles = files.filter(f => f.category === category && f.subtype === subtype);

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (!selected.length || !userId) return;
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of selected) {
        const form = new FormData();
        form.append('category', category);
        form.append('subtype', subtype);
        form.append('file', file);
        const res = await api.post(`/family-profiles/${userId}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded.push(res.data);
      }
      if (onToggle && !checked) onToggle(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao enviar o arquivo.');
    } finally {
      if (uploaded.length) onFilesChange(prev => [...uploaded, ...prev]);
      setUploading(false);
    }
  };

  const handleRemove = async (file) => {
    if (!window.confirm(`Remover o arquivo "${file.original_name}"?`)) return;
    try {
      await api.delete(`/family-profiles/${userId}/files/${file.id}`);
      onFilesChange(prev => prev.filter(f => f.id !== file.id));
    } catch (err) {
      alert('Não foi possível remover o arquivo.');
    }
  };

  return (
    <div className={styles.uploadRow}>
      <label className={styles.uploadRowLabel}>
        {onToggle && <input type="checkbox" checked={!!checked} onChange={e => onToggle(e.target.checked)} />}
        <span>{subtype}</span>
      </label>
      <button type="button" className={styles.uploadBtn} onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? 'Enviando...' : '📎 Anexar'}
      </button>
      <input ref={inputRef} type="file" accept={accept} multiple hidden onChange={handleUpload} />
      {itemFiles.length > 0 && (
        <div className={styles.fileChips}>
          {itemFiles.map(f => (
            <span key={f.id} className={styles.fileChip}>
              <span className={styles.fileChipName} title={f.original_name} onClick={() => openFamilyFile(userId, f)}>{f.original_name}</span>
              <button type="button" onClick={() => handleRemove(f)} title="Remover">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileAttachments;
