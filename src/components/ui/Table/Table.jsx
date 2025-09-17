// Arquivo: src/components/ui/Table/Table.jsx (VERSÃO FINAL COM ÍCONES CORRIGIDOS)

import React from 'react';
import styles from './Table.module.css';

const Table = ({ headers, data, onView, onEdit, onDelete }) => {
  const hasActions = onView || onEdit || onDelete;

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header.key}>{header.label}</th>
            ))}
            {hasActions && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.id}>
                {headers.map((header) => (
                  <td key={`${row.id}-${header.key}`} data-label={header.label} className={styles.tableCell}>
                    <span className={styles.cellContent}>{row[header.key]}</span>
                  </td>
                ))}
                {hasActions && (
                  <td data-label="Ações" className={styles.actionsCell}>
                    <div className={styles.actions}>
                      {/* ### ÍCONES RESTAURADOS AQUI ### */}
                      {/* Usando <i> com classes, que é mais comum. Adapte se usar outra biblioteca. */}
                      {onView && (
                        <button onClick={() => onView(row)} className={styles.actionButton} title="Visualizar">
                          <i className="fas fa-eye"></i>
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className={styles.actionButton} title="Editar">
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className={styles.actionButton} title="Excluir">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length + (hasActions ? 1 : 0)} className={styles.noData}>
                Nenhum dado encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
