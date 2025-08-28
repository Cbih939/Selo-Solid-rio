// components/ui/FileUpload/FileUpload.jsx

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './FileUpload.module.css';
import { ICONS } from '../../../assets/icons/ICONS'; // Supondo que você tenha um ícone de upload

// --- CORREÇÃO ---
// O componente agora aceita uma nova propriedade 'helpText'
const FileUpload = ({ label, onFileSelect, accept, helpText }) => {
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}) : undefined,
    maxFiles: 1,
  });

  // --- CORREÇÃO ---
  // Define um texto de ajuda padrão se nenhum for fornecido
  const defaultHelpText = "PNG, JPG, GIF até 10MB";
  const displayedHelpText = helpText || defaultHelpText;

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
        <input {...getInputProps()} />
        
        {fileName ? (
          <p className={styles.fileName}>{fileName}</p>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>{ICONS.upload || '↑'}</span>
            <p>Carregar um arquivo ou arraste e solte</p>
            {/* O texto de ajuda agora é dinâmico */}
            <small>{displayedHelpText}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
