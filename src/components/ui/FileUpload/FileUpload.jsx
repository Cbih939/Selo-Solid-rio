import React, { useState, useRef } from 'react';
import styles from './FileUpload.module.css';
import Icon from '../Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS'; // Certifique-se que ICONS.js tem 'upload'

const FileUpload = ({ label, onFileSelect }) => {
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file); // Envia o ficheiro para o componente pai
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.fileUploadContainer} onClick={handleClick}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
        <div className={styles.content}>
          <Icon path={ICONS.upload} className={styles.icon} />
          {fileName ? (
            <p className={styles.fileName}>{fileName}</p>
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
    </div>
  );
};

export default FileUpload;