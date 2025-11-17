export const validatePassword = (password) => {
  // Garante que 'password' seja uma string para evitar erros caso seja null ou undefined.
  const pass = password || '';

  const validations = {
    // Validação 1: Pelo menos 1 letra minúscula
    hasLower: /[a-z]/.test(pass),

    // Validação 2: Pelo menos 1 letra maiúscula
    hasUpper: /[A-Z]/.test(pass),

    // Validação 3: Pelo menos 1 número
    hasNumber: /[0-9]/.test(pass),

    // Validação 4: Pelo menos 1 caractere especial
    hasSpecial: /[^A-Za-z0-9]/.test(pass),

    // Validação 5: Mínimo de 8 caracteres (CORRIGIDO)
    // A validação deve ser 'maior ou igual a 8'.
    hasEightChars: pass.length >= 8,
  };
  
  // Opcional: Adiciona uma propriedade 'isValid' que é verdadeira
  // apenas se todas as outras validações forem verdadeiras.
  // Isso é útil para, por exemplo, habilitar/desabilitar um botão de formulário.
  const isValid = Object.values(validations).every(Boolean);
  
  return { ...validations, isValid };
  
};

// Máscara para CPF: 000.000.000-00
export const maskCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// Máscara para Telefone: (00) 00000-0000
export const maskPhone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

// Validação real de CPF (Algoritmo matemático)
export const validateCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf === '' || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10));
};

// Validação de Email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};