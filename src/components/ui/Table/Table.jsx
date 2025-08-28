// src/components/ui/Table/Table.jsx

import React from 'react';
import styles from './Table.module.css';
import Icon from '../Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS';

// A propriedade 'data' agora tem um valor padrão de um array vazio.
const Table = ({ headers, data = [], onEdit, onView, onDelete }) => {
  
  // --- CORREÇÃO APLICADA AQUI ---
  // Verificamos se 'data' é realmente um array. Se não for, ou se estiver vazio,
  // mostramos uma mensagem amigável em vez de quebrar a aplicação.
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={styles.noData}>
        <p>Nenhum dado para exibir.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => <th key={header.key}>{header.label}</th>)}
            {(onView || onEdit || onDelete) && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {/* Agora temos certeza de que 'data' é um array, então o .map é seguro. */}
          {data.map((row) => (
            <tr key={row.id}>
              {headers.map(header => <td key={`${row.id}-${header.key}`}>{row[header.key]}</td>)}
              {(onView || onEdit || onDelete) && (
                <td className={styles.actionsCell}>
                  {onView && (
                    <button onClick={() => onView(row)} className={styles.actionButton}>
                      <Icon path={ICONS.eye} />
                    </button>
                  )}
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className={styles.actionButton}>
                      <Icon path={ICONS.edit} />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className={`${styles.actionButton} ${styles.deleteButton}`}>
                      <Icon path={ICONS.trash} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
