// Arquivo: src/components/ui/Table/Table.jsx (VERSÃO CORRIGIDA)

import React from 'react';
import styles from './Table.module.css'; // Vamos criar/usar este arquivo
import Icon from '../Icon/Icon'; // Supondo que você tenha um componente de ícone

const Table = ({ headers, data, onView, onEdit, onDelete }) => {
  // Verifica se há ações para renderizar a última coluna
  const hasActions = onView || onEdit || onDelete;

  return (
    // ### CORREÇÃO APLICADA AQUI ###
    // Adicionamos um 'div' ao redor da tabela para controlar a rolagem horizontal.
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
                  <td key={`${row.id}-${header.key}`} data-label={header.label}>
                    {row[header.key]}
                  </td>
                ))}
                {hasActions && (
                  <td data-label="Ações">
                    <div className={styles.actions}>
                      {onView && <button onClick={() => onView(row)} className={styles.actionButton}><Icon name="view" /></button>}
                      {onEdit && <button onClick={() => onEdit(row)} className={styles.actionButton}><Icon name="edit" /></button>}
                      {onDelete && <button onClick={() => onDelete(row)} className={styles.actionButton}><Icon name="delete" /></button>}
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
