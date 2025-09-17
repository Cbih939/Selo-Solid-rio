// Arquivo: src/components/ui/Table/Table.jsx (VERSÃO FINAL E CORRETA)

import React from 'react';
import styles from './Table.module.css';
import Icon from '../Icon/Icon'; // Importando o seu componente de ícone

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
                    {/* Estrutura interna para controle total do layout responsivo */}
                    <div className={styles.cellInner}>
                      <span className={styles.cellLabel}>{header.label}</span>
                      <span className={styles.cellValue}>{row[header.key]}</span>
                    </div>
                  </td>
                ))}
                {hasActions && (
                  <td data-label="Ações" className={styles.actionsCell}>
                    <div className={styles.actions}>
                      {/* ### ÍCONES CORRIGIDOS USANDO SEU COMPONENTE ### */}
                      {onView && (
                        <button onClick={() => onView(row)} className={styles.actionButton} title="Visualizar">
                          <Icon name="eye" />
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className={styles.actionButton} title="Editar">
                          <Icon name="edit" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className={styles.actionButton} title="Excluir">
                          <Icon name="trash" />
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
