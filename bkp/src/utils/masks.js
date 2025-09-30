// Formata o valor para o padrão de CPF: xxx.xxx.xxx-xx
export const maskCPF = (value) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não for dígito
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substring(0, 14); // Limita o tamanho máximo
};

// Formata o valor para o padrão de CNPJ: xx.xxx.xxx/xxxx-xx
export const maskCNPJ = (value) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não for dígito
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .substring(0, 18); // Limita o tamanho máximo
};

// Formata o valor para o padrão de Telefone: (xx) xxxxx-xxxx ou (xx) xxxx-xxxx
export const maskPhone = (value) => {
  value = value.replace(/\D/g, ''); // Remove tudo o que não for dígito
  
  if (value.length > 10) {
    // Celular com 9º dígito
    return value
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15); // Limita o tamanho máximo
  } else {
    // Telefone fixo ou celular sem 9º dígito
    return value
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14); // Limita o tamanho máximo
  }
};