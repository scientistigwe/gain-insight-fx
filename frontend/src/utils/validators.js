// Validation utility functions

export const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  // Minimum 8 characters
  return password.length >= 8;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== "";
};

export const validateNumeric = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const validatePositive = (value) => {
  return parseFloat(value) > 0;
};

export const validateForm = (formData, validations) => {
  const errors = {};

  for (const field in validations) {
    const value = formData[field];
    const fieldValidations = validations[field];

    for (const validation of fieldValidations) {
      const [validator, errorMessage] = validation;
      if (!validator(value)) {
        errors[field] = errorMessage;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
