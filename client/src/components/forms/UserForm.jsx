import React from 'react';
import SchemaValidatedForm, { ValidatedField } from './SchemaValidatedForm';
import { apiRequest } from '../../utils/api';

/**
 * Example user form using schema validation
 */
const UserForm = ({ user = null, onSuccess, onCancel }) => {
  const isEditing = !!user;

  const handleSubmit = async (formData) => {
    try {
      let response;
      if (isEditing) {
        response = await apiRequest(`users/${user.id}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        response = await apiRequest('users', {
          method: 'POST',
          body: formData
        });
      }

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      throw error;
    }
  };

  // Custom validation rules beyond schema
  const customValidation = {
    confirmPassword: {
      required: !isEditing, // Only required for new users
      type: 'password',
      errorMessages: {
        required: 'Please confirm your password',
        match: 'Passwords do not match'
      },
      validate: (value, allValues) => {
        if (!isEditing && value !== allValues.password) {
          return 'Passwords do not match';
        }
        return null;
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit User' : 'Create New User'}
      </h2>

      <SchemaValidatedForm
        schemaName="users"
        initialValues={user || {}}
        onSubmit={handleSubmit}
        excludeFields={['id', 'createdAt', 'updatedAt', 'lastLogin', 'passwordHash']}
        customValidation={customValidation}
        className="space-y-6"
      >
        {({ validation, validationRules }) => (
          <>
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedField
                name="firstName"
                label="First Name"
                validation={validation}
                placeholder="Enter first name"
              />
              
              <ValidatedField
                name="lastName"
                label="Last Name"
                validation={validation}
                placeholder="Enter last name"
              />
            </div>

            <ValidatedField
              name="email"
              label="Email Address"
              type="email"
              validation={validation}
              placeholder="user@example.com"
            />

            <ValidatedField
              name="username"
              label="Username"
              validation={validation}
              placeholder="Enter username"
            />

            {/* Role Selection */}
            <ValidatedField
              name="role"
              label="Role"
              type="select"
              validation={validation}
              options={[
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Administrator' },
                { value: 'analyst', label: 'Security Analyst' },
                { value: 'manager', label: 'Manager' }
              ]}
            />

            {/* Password fields for new users */}
            {!isEditing && (
              <>
                <ValidatedField
                  name="password"
                  label="Password"
                  type="password"
                  validation={validation}
                  placeholder="Enter password"
                />

                <ValidatedField
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  validation={validation}
                  placeholder="Confirm password"
                />
              </>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedField
                name="department"
                label="Department"
                validation={validation}
                placeholder="Enter department"
              />
              
              <ValidatedField
                name="title"
                label="Job Title"
                validation={validation}
                placeholder="Enter job title"
              />
            </div>

            <ValidatedField
              name="phone"
              label="Phone Number"
              type="tel"
              validation={validation}
              placeholder="+1 (555) 123-4567"
            />

            {/* Status */}
            <div className="flex items-center">
              <ValidatedField
                name="isActive"
                label="Active User"
                type="checkbox"
                validation={validation}
                className="flex items-center"
              />
              <span className="ml-2 text-sm text-gray-600">
                User can log in and access the system
              </span>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="submit"
                disabled={!validation.isValid}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  validation.isValid
                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isEditing ? 'Update User' : 'Create User'}
              </button>
            </div>

            {/* Validation Summary */}
            {Object.keys(validation.errors).length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {Object.entries(validation.errors).map(([field, error]) => (
                    error && <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Fields Info */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Required Fields:
              </h4>
              <p className="text-sm text-blue-700">
                Fields marked with <span className="text-red-500">*</span> are required.
                Required fields: {validation.requiredFields.join(', ')}
              </p>
            </div>
          </>
        )}
      </SchemaValidatedForm>
    </div>
  );
};

export default UserForm;
