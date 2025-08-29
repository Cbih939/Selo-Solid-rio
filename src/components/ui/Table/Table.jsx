import React from 'react';
import styles from './Table.module.css';
// Importe os ícones. Se você não os tiver, pode usar texto como "Ver", "Editar".
// Para usar ícones, instale uma biblioteca como 'react-icons': npm install react-icons
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

// Adicionamos 'onView' às props que o componente pode receber
const Table = ({ headers, data, onView, onEdit, onDelete }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className={styles.noData}>Nenhum dado para exibir.</p>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map(header => <th key={header.key}>{header.label}</th>)}
            {/* Adiciona um cabeçalho para a coluna de Ações se houver alguma ação */}
            {(onView || onEdit || onDelete) && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              {headers.map(header => <td key={`${header.key}-${row.id}`}>{row[header.key]}</td>)}
              
              {/* Renderiza a célula de Ações */}
              {(onView || onEdit || onDelete) && (
                <td className={styles.actionsCell}>
                  {/* Botão de Visualizar (Ícone de Olho) */}
                  {onView && (
                    <button onClick={() => onView(row)} className={`${styles.actionButton} ${styles.viewButton}`}>
                      <FaEye />
                    </button>
                  )}
                  {/* Botão de Editar */}
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className={`${styles.actionButton} ${styles.editButton}`}>
                      <FaEdit />
                    </button>
                  )}
                  {/* Botão de Deletar */}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className={`${styles.actionButton} ${styles.deleteButton}`}>
                      <FaTrash />
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
