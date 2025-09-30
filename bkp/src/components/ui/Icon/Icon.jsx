// Arquivo: src/components/ui/Icon/Icon.jsx (VERSÃO FINAL E INTELIGENTE)

import React from 'react';
import { ICONS } from '../../../assets/icons/ICONS'; // O caminho que já sabemos que está correto

const Icon = ({ name, path: directPath, className, size = 24 }) => {
  // ### LÓGICA INTELIGENTE APLICADA AQUI ###

  // 1. Prioridade 1: Usa o 'path' se ele for passado diretamente.
  //    Isso corrige os componentes antigos que faziam <Icon path={ICONS.algumIcone} />
  let finalPath = directPath;

  // 2. Prioridade 2: Se não houver 'path' direto, tenta encontrar pelo 'name'.
  //    Isso mantém o funcionamento da Tabela que faz <Icon name="eye" />
  if (!finalPath && name) {
    finalPath = ICONS[name];
  }

  // 3. Se, no final, não houver nenhum path, não renderiza nada.
  if (!finalPath) {
    console.warn(`Ícone "${name || 'desconhecido'}" não pôde ser encontrado.`);
    return null;
  }

  // 4. Renderiza o SVG com o path final encontrado.
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
      <path d={finalPath}></path>
    </svg>
   );
};

export default Icon;
