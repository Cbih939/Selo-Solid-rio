export const validatePassword = (password) => {
  const validations = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    hasSixChars: password.length >= 6,
    hasEightChars: password.length <= 8,
  };
  
  const isValid = Object.values(validations).every(Boolean);
  
  return { ...validations, isValid };
};