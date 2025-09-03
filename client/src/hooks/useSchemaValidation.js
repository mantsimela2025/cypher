import { useState, useCallback, useMemo } from 'react';

/**
 * React hook for form validation based on schema validation rules
 * @param {Object} validationRules - Validation rules from schema
 * @param {Object} initialValues - Initial form values
 * @returns {Object} Validation state and methods
 */
export const useSchemaValidation = (validationRules, initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get required fields from validation rules
  const requiredFields = useMemo(() => {
    return Object.keys(validationRules.rules || {}).filter(
      field => validationRules.rules[field].required
    );
  }, [validationRules]);

  // Validate a single field
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules.rules?.[fieldName];
    if (!rules) return null;

    const errors = [];

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors.push(rules.errorMessages?.required || `${fieldName} is required`);
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return errors.length > 0 ? errors[0] : null;
    }

    // Type validation
    if (value && rules.type) {
      switch (rules.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(rules.errorMessages?.type || 'Please enter a valid email address');
          }
          break;
        
        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push(rules.errorMessages?.type || 'Please enter a valid URL');
          }
          break;
        
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(rules.errorMessages?.type || 'Please enter a valid number');
          }
          break;
        
        case 'uuid':
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(value)) {
            errors.push(rules.errorMessages?.type || 'Please enter a valid UUID');
          }
          break;
      }
    }

    // Length validation
    if (value && rules.minLength && value.length < rules.minLength) {
      errors.push(rules.errorMessages?.minLength || `Minimum length is ${rules.minLength} characters`);
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push(rules.errorMessages?.maxLength || `Maximum length is ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.errorMessages?.pattern || 'Invalid format');
    }

    // Enum validation
    if (value && rules.enum && !rules.enum.includes(value)) {
      errors.push(rules.errorMessages?.enum || `Must be one of: ${rules.enum.join(', ')}`);
    }

    return errors.length > 0 ? errors[0] : null;
  }, [validationRules]);

  // Validate all fields
  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules.rules || {}).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationRules]);

  // Handle field change
  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  }, [errors]);

  // Handle field blur
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [values, validateField]);

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error) && 
           requiredFields.every(field => values[field] && values[field].toString().trim() !== '');
  }, [errors, requiredFields, values]);

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((fieldName) => {
    return {
      value: values[fieldName] || '',
      onChange: (e) => {
        const value = e.target ? e.target.value : e;
        handleChange(fieldName, value);
      },
      onBlur: () => handleBlur(fieldName),
      error: touched[fieldName] ? errors[fieldName] : null,
      required: validationRules.rules?.[fieldName]?.required || false
    };
  }, [values, handleChange, handleBlur, touched, errors, validationRules]);

  return {
    values,
    errors,
    touched,
    requiredFields,
    isValid,
    validateField,
    validateAll,
    handleChange,
    handleBlur,
    reset,
    getFieldProps
  };
};

/**
 * Higher-order component for form validation
 * @param {Object} validationRules - Validation rules from schema
 * @returns {Function} HOC function
 */
export const withSchemaValidation = (validationRules) => {
  return (WrappedComponent) => {
    return function ValidatedComponent(props) {
      const validation = useSchemaValidation(validationRules, props.initialValues);
      
      return (
        <WrappedComponent
          {...props}
          validation={validation}
        />
      );
    };
  };
};

/**
 * Utility to create validation rules from API response
 * This would typically be called when fetching schema validation from your API
 * @param {Object} schemaValidation - Schema validation from API
 * @returns {Object} Formatted validation rules
 */
export const createValidationRules = (schemaValidation) => {
  return {
    rules: schemaValidation.frontendRules || {},
    required: schemaValidation.required || [],
    optional: schemaValidation.optional || []
  };
};

export default useSchemaValidation;
