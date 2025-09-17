// Arquivo: src/components/ui/Icon/Icon.jsx (VERSÃO FINAL COM O CAMINHO CORRETO)

import React from 'react';
// ### CORREÇÃO APLICADA AQUI ###
// O caminho foi ajustado para apontar para o local correto do seu arquivo de ícones.
import { ICONS } from '../../../assets/icons/ICONS';

const Icon = ({ name, className, size = 24 }) => {
  const path = ICONS[name];

  if (!path) {
    console.warn(`Ícone "${name}" não encontrado no arquivo ICONS.`);
    return null;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d={path}></path>
    </svg>
   );
};

export default Icon;
