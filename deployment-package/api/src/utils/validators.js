// Custom validation functions

// Validate password strength
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate username
const validateUsername = (username) => {
  const errors = [];
  
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username && username.length > 30) {
    errors.push('Username must be no more than 30 characters long');
  }
  
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate email
const validateEmail = (email) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate phone number
const validatePhone = (phone) => {
  const errors = [];
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  
  if (phone && !phoneRegex.test(phone)) {
    errors.push('Please provide a valid phone number');
  }
  
  if (phone && (phone.replace(/\D/g, '').length < 10 || phone.replace(/\D/g, '').length > 15)) {
    errors.push('Phone number must be between 10 and 15 digits');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate URL
const validateUrl = (url) => {
  const errors = [];
  
  if (url) {
    try {
      new URL(url);
    } catch {
      errors.push('Please provide a valid URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate date
const validateDate = (date, fieldName = 'Date') => {
  const errors = [];
  
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`${fieldName} must be a valid date`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate age (must be 18 or older)
const validateAge = (birthDate) => {
  const errors = [];
  
  if (birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age < 18) {
      errors.push('You must be at least 18 years old');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate file type
const validateFileType = (filename, allowedTypes) => {
  const errors = [];
  
  if (filename && allowedTypes) {
    const fileExtension = filename.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate file size
const validateFileSize = (fileSize, maxSizeInBytes) => {
  const errors = [];
  
  if (fileSize && maxSizeInBytes && fileSize > maxSizeInBytes) {
    const maxSizeInMB = (maxSizeInBytes / (1024 * 1024)).toFixed(2);
    errors.push(`File size exceeds the maximum limit of ${maxSizeInMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate required fields
const validateRequired = (value, fieldName) => {
  const errors = [];
  
  if (value === undefined || value === null || value === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate string length
const validateLength = (value, min, max, fieldName) => {
  const errors = [];
  
  if (value) {
    if (min && value.length < min) {
      errors.push(`${fieldName} must be at least ${min} characters long`);
    }
    
    if (max && value.length > max) {
      errors.push(`${fieldName} must be no more than ${max} characters long`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate numeric range
const validateRange = (value, min, max, fieldName) => {
  const errors = [];
  
  if (value !== undefined && value !== null) {
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
    } else {
      if (min !== undefined && numValue < min) {
        errors.push(`${fieldName} must be at least ${min}`);
      }
      
      if (max !== undefined && numValue > max) {
        errors.push(`${fieldName} must be no more than ${max}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validatePassword,
  validateUsername,
  validateEmail,
  validatePhone,
  validateUrl,
  validateDate,
  validateAge,
  validateFileType,
  validateFileSize,
  validateRequired,
  validateLength,
  validateRange,
};
