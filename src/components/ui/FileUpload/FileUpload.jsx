// src/components/ui/FileUpload/FileUpload.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './FileUpload.module.css';

// Função auxiliar para gerar o texto de ajuda
const getHelpText = (accept) => {
  if (accept?.includes('pdf')) {
    return 'PDF até 10MB';
  }
  if (accept?.includes('image')) {
    return 'PNG, JPG, GIF até 10MB';
  }
  return 'Arraste um arquivo aqui'; // Padrão
};

const FileUpload = ({ label, onFileSelect, accept }) => {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError(''); // Limpa erros antigos
    if (fileRejections.length > 0) {
      // Pega a mensagem de erro do primeiro arquivo rejeitado
      setError(fileRejections[0].errors[0].message);
      setFileName('');
      onFileSelect(null); // Informa o componente pai que nenhum arquivo foi selecionado
    } else if (acceptedFiles.length > 0) {
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

  const helpText = getHelpText(accept);

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
        <input {...getInputProps()} />
        
        {fileName ? (
          <p className={styles.fileName}>{fileName}</p>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>↑</span>
            <p>Carregar um arquivo ou arraste e solte</p>
            <small className={styles.helpText}>{helpText}</small>
          </div>
        )}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default FileUpload;
