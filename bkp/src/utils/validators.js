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
