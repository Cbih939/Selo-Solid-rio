import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './FileUpload.module.css';

const FileUpload = ({ label, onFileSelect, accept, multiple = false, maxFiles = 5 }) => {
  const [fileNames, setFileNames] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError('');
    
    if (fileRejections.length > 0) {
      setError(`Alguns arquivos foram rejeitados. Verifique o tipo e o tamanho.`);
      // Mesmo com rejeições, podemos aceitar os válidos
    }
    
    if (acceptedFiles.length > 0) {
      // Atualiza a lista de nomes de arquivos para exibição
      const names = acceptedFiles.map(file => file.name);
      setFileNames(names);
      // Envia a lista de arquivos aceitos para o componente pai
      onFileSelect(acceptedFiles); 
    } else {
      // Se nenhum arquivo for aceito, limpa tudo
      setFileNames([]);
      onFileSelect([]);
    }
  }, [onFileSelect]);

  // Converte a string 'accept' em um objeto para o useDropzone
  const acceptProp = useMemo(() => {
    if (!accept) return undefined;
    return accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {});
  }, [accept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptProp,
    multiple: multiple, // Usa a prop 'multiple'
    maxFiles: multiple ? maxFiles : 1, // Limita os arquivos se for múltiplo
  });

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
        <input {...getInputProps()} />
        
        {fileNames.length > 0 ? (
          <ul className={styles.fileNameList}>
            {fileNames.map(name => <li key={name}>{name}</li>)}
          </ul>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>↑</span>
            <p>Carregar arquivos ou arraste e solte</p>
            <small className={styles.helpText}>Até {maxFiles} arquivos</small>
          </div>
        )}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default FileUpload;
