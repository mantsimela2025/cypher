import React, { useState, useEffect } from 'react';
import { useSchemaValidation } from '../../hooks/useSchemaValidation';
import { apiRequest } from '../../utils/api';

/**
 * A form component that automatically validates based on database schema
 * @param {Object} props - Component props
 * @param {string} props.schemaName - Name of the schema to validate against
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Array} props.excludeFields - Fields to exclude from the form
 * @param {Object} props.customValidation - Additional custom validation rules
 */
const SchemaValidatedForm = ({
  schemaName,
  initialValues = {},
  onSubmit,
  excludeFields = ['id', 'createdAt', 'updatedAt'],
  customValidation = {},
  children,
  className = ''
}) => {
  const [validationRules, setValidationRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch validation rules from API
  useEffect(() => {
    const fetchValidationRules = async () => {
      try {
        setLoading(true);
        const excludeFieldsQuery = excludeFields.join(',');
        const response = await apiRequest(
          `validation/schema/${schemaName}?excludeFields=${excludeFieldsQuery}`
        );
        
        // Merge with custom validation
        const mergedRules = {
          ...response.validation,
          rules: {
            ...response.validation.rules,
            ...customValidation
          }
        };
        
        setValidationRules(mergedRules);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch validation rules:', err);
        setError('Failed to load form validation rules');
      } finally {
        setLoading(false);
      }
    };

    if (schemaName) {
      fetchValidationRules();
    }
  }, [schemaName, excludeFields, customValidation]);

  // Initialize validation hook
  const validation = useSchemaValidation(validationRules || { rules: {} }, initialValues);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validation.validateAll()) {
      return;
    }

    try {
      await onSubmit(validation.values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading form validation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Form Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children({ validation, validationRules })}
      
      {/* Form submission button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={!validation.isValid}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            validation.isValid
              ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
      </div>
    </form>
  );
};

/**
 * Form field component that integrates with schema validation
 */
export const ValidatedField = ({
  name,
  label,
  type = 'text',
  validation,
  className = '',
  placeholder,
  options = [], // For select fields
  ...props
}) => {
  const fieldProps = validation.getFieldProps(name);
  const fieldRules = validation.validationRules?.rules?.[name];

  const renderField = () => {
    switch (type) {
      case 'select':
        return (
          <select
            {...fieldProps}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              fieldProps.error ? 'border-red-300' : ''
            }`}
            {...props}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...fieldProps}
            placeholder={placeholder}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              fieldProps.error ? 'border-red-300' : ''
            }`}
            rows={4}
            {...props}
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={fieldProps.value || false}
            onChange={(e) => fieldProps.onChange(e.target.checked)}
            onBlur={fieldProps.onBlur}
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
              fieldProps.error ? 'border-red-300' : ''
            }`}
            {...props}
          />
        );

      default:
        return (
          <input
            type={type}
            {...fieldProps}
            placeholder={placeholder}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              fieldProps.error ? 'border-red-300' : ''
            }`}
            {...props}
          />
        );
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {fieldProps.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderField()}
      
      {/* Field constraints info */}
      {fieldRules && (
        <div className="mt-1 text-xs text-gray-500">
          {fieldRules.maxLength && (
            <span>Max {fieldRules.maxLength} characters. </span>
          )}
          {fieldRules.minLength && (
            <span>Min {fieldRules.minLength} characters. </span>
          )}
          {fieldRules.enum && (
            <span>Options: {fieldRules.enum.join(', ')}. </span>
          )}
        </div>
      )}
      
      {/* Error message */}
      {fieldProps.error && (
        <p className="mt-1 text-sm text-red-600">{fieldProps.error}</p>
      )}
    </div>
  );
};

export default SchemaValidatedForm;
