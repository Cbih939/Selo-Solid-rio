import React, { useState, useRef } from 'react';
import styles from './FileUpload.module.css';
import Icon from '../Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS'; // Certifique-se que ICONS.js tem 'upload'

const FileUpload = ({ label, onFileSelect }) => {
  const [fileNames, setFileNames] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setFileNames(files.map(f => f.name));
      onFileSelect(files); // Envia o array de ficheiros
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.fileUploadContainer} onClick={handleClick}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className={styles.hiddenInput}
          multiple // Permite a seleção de múltiplos ficheiros
          accept="image/*" // Aceita apenas imagens
        />
        <div className={styles.content}>
          <Icon path={ICONS.upload} className={styles.icon} />
          {fileNames.length > 0 ? (
            <p className={styles.fileName}>{fileNames.join(', ')}</p>
          ) : (
            <>
              <p>
                <span className={styles.link}>Carregar um arquivo</span> ou arraste e solte
              </p>
              <span className={styles.info}>PNG, JPG, GIF até 10MB</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;