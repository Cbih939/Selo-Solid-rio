import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './FileUpload.module.css';

const UploadIcon = () => (
  <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const FileUpload = ({ label, onFileSelect, accept, multiple = false, maxFiles = 5 }) => {
  const [fileNames, setFileNames] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError('');
    
    if (fileRejections.length > 0) {
      setError(`Alguns arquivos foram rejeitados. Verifique o tipo e o tamanho.`);
    }
    
    if (acceptedFiles.length > 0) {
      const names = acceptedFiles.map(file => file.name);
      setFileNames(names);
      onFileSelect(acceptedFiles); 
    } else {
      setFileNames([]);
      onFileSelect([]);
    }
  }, [onFileSelect]);

  const acceptProp = useMemo(() => {
    if (!accept) return undefined;
    return accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {});
  }, [accept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptProp,
    multiple: multiple,
    maxFiles: multiple ? maxFiles : 1,
  });

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
        <input {...getInputProps()} />
        
        {fileNames.length > 0 ? (
          <div className={styles.fileSelectedState}>
             <UploadIcon />
             <ul className={styles.fileNameList}>
               {fileNames.map(name => <li key={name}>{name}</li>)}
             </ul>
             <small className={styles.changeFileText}>Clique ou arraste para alterar</small>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <UploadIcon />
            <p className={styles.primaryText}>Carregar arquivos ou arraste e solte</p>
            <small className={styles.helpText}>Até {multiple ? maxFiles : 1} arquivo(s)</small>
          </div>
        )}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default FileUpload;