import React from 'react';
import styles from './Table.module.css';
import Icon from '../Icon/Icon';
import { ICONS } from '../../../assets/icons/ICONS';

const Table = ({ headers, data, onEdit, onView, onDelete }) => {
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
          {data.map((row) => (
            // Adicionada a propriedade 'key' à linha da tabela (<tr>).
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
