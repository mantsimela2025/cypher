# 🔧 **CYPHER Validation System**

## Overview

The CYPHER validation system provides a seamless bridge between your Drizzle database schemas and frontend form validation. It automatically extracts validation rules from your database schema definitions and provides them to both API endpoints and React forms.

## 🏗️ **Architecture**

```
Database Schema (Drizzle) 
    ↓
Schema Validation Utility
    ↓
┌─────────────────┬─────────────────┐
│   API Validation │  Frontend Forms │
│   (Joi schemas)  │  (React hooks)  │
└─────────────────┴─────────────────┘
```

## 🎯 **How Required Fields Work**

### 1. **Database Schema Level**
Required fields are determined by Drizzle schema definitions:

```javascript
// In your schema file
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(), // REQUIRED
  firstName: varchar('first_name', { length: 100 }).notNull(), // REQUIRED
  lastName: varchar('last_name', { length: 100 }), // OPTIONAL
  phone: varchar('phone', { length: 20 }), // OPTIONAL
  createdAt: timestamp('created_at').defaultNow().notNull(), // NOT REQUIRED (has default)
});
```

**Rules for Required Fields:**
- Field has `.notNull()` AND no default value = **REQUIRED**
- Field has `.notNull()` but has default value = **NOT REQUIRED** (auto-filled)
- Field without `.notNull()` = **OPTIONAL**

### 2. **API Validation Level**
The system generates Joi schemas automatically:

```javascript
// Auto-generated from schema
const userValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional()
});
```

### 3. **Frontend Form Level**
React forms automatically get validation rules:

```javascript
// Auto-generated validation rules
{
  email: { required: true, type: 'email', maxLength: 255 },
  firstName: { required: true, type: 'string', maxLength: 100 },
  lastName: { required: false, type: 'string', maxLength: 100 },
  phone: { required: false, type: 'string', maxLength: 20 }
}
```

## 🚀 **Usage Examples**

### **1. Backend API Validation**

```javascript
const { createJoiSchema } = require('../utils/schemaValidation');
const { users } = require('../db/schema');

// Create validation middleware
const validateUser = (req, res, next) => {
  const schema = createJoiSchema(users, ['id', 'createdAt', 'updatedAt']);
  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ 
      errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
    });
  }
  
  next();
};

// Use in routes
router.post('/users', validateUser, createUser);
```

### **2. Frontend Form Validation**

```jsx
import SchemaValidatedForm, { ValidatedField } from './SchemaValidatedForm';

const UserForm = () => {
  return (
    <SchemaValidatedForm
      schemaName="users"
      onSubmit={handleSubmit}
      excludeFields={['id', 'createdAt', 'updatedAt']}
    >
      {({ validation }) => (
        <>
          <ValidatedField
            name="email"
            label="Email Address"
            type="email"
            validation={validation}
          />
          
          <ValidatedField
            name="firstName"
            label="First Name"
            validation={validation}
          />
          
          <ValidatedField
            name="lastName"
            label="Last Name"
            validation={validation}
          />
        </>
      )}
    </SchemaValidatedForm>
  );
};
```

### **3. Getting Validation Rules via API**

```javascript
// Get validation rules for a schema
GET /api/v1/validation/schema/users

// Response:
{
  "schemaName": "users",
  "tableName": "users",
  "validation": {
    "required": ["email", "firstName"],
    "optional": ["lastName", "phone"],
    "rules": {
      "email": {
        "required": true,
        "type": "email",
        "maxLength": 255,
        "errorMessages": {
          "required": "email is required",
          "type": "Please enter a valid email address"
        }
      }
    }
  }
}
```

## 🔍 **Field Type Detection**

The system automatically detects field types and applies appropriate validation:

| Field Pattern | Detected Type | Validation Applied |
|---------------|---------------|-------------------|
| `*email*` | email | Email format validation |
| `*phone*` | phone | Phone number pattern |
| `*url*`, `*link*` | url | URL format validation |
| `*password*` | password | Strong password rules |
| `varchar(n)` | string | Max length validation |
| `integer`, `serial` | number | Numeric validation |
| `boolean` | boolean | Boolean validation |
| `timestamp`, `date` | date | Date validation |
| `jsonb` | object | Object validation |
| Enum columns | enum | Enum value validation |

## 🎨 **UI Integration**

### **Required Field Indicators**
Forms automatically show required field indicators:

```jsx
// Automatically rendered
<label>
  Email Address
  <span className="text-red-500 ml-1">*</span> {/* Auto-added for required fields */}
</label>
```

### **Real-time Validation**
- **On Change**: Clears errors when user starts typing
- **On Blur**: Validates field when user leaves it
- **On Submit**: Validates entire form before submission

### **Error Messages**
Contextual error messages based on field type:

```javascript
// Auto-generated error messages
{
  required: "Email is required",
  type: "Please enter a valid email address",
  maxLength: "Email must be no more than 255 characters"
}
```

## 🛠️ **Advanced Features**

### **Custom Validation Rules**
Add custom validation beyond schema:

```jsx
const customValidation = {
  confirmPassword: {
    required: true,
    validate: (value, allValues) => {
      if (value !== allValues.password) {
        return 'Passwords do not match';
      }
      return null;
    }
  }
};

<SchemaValidatedForm
  schemaName="users"
  customValidation={customValidation}
>
```

### **Conditional Requirements**
Make fields required based on other field values:

```jsx
const conditionalValidation = {
  department: {
    required: (allValues) => allValues.role === 'manager',
    errorMessages: {
      required: 'Department is required for managers'
    }
  }
};
```

### **Field Exclusion**
Exclude fields from validation:

```jsx
<SchemaValidatedForm
  schemaName="users"
  excludeFields={['id', 'createdAt', 'updatedAt', 'passwordHash']}
>
```

## 📋 **API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/validation/schemas` | GET | List all available schemas |
| `/api/v1/validation/schema/:name` | GET | Get validation rules for schema |
| `/api/v1/validation/schema/:name/fields` | GET | Get field information for schema |
| `/api/v1/validation/validate/:name` | POST | Validate data against schema |
| `/api/v1/validation/schemas` | POST | Get multiple schema validations |

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Validation settings
VALIDATION_CACHE_TTL=1800  # Cache validation rules for 30 minutes
VALIDATION_STRICT_MODE=true  # Strict validation mode
```

### **Schema Validation Options**
```javascript
// In schemaValidation.js
const options = {
  excludeFields: ['id', 'createdAt', 'updatedAt'],
  strictMode: true,
  customTypeMapping: {
    'custom_type': 'string'
  }
};
```

## 🎯 **Best Practices**

1. **Define Clear Schema Constraints**
   ```javascript
   // Good: Clear constraints
   email: varchar('email', { length: 255 }).notNull(),
   
   // Better: With additional validation hints
   email: varchar('email', { length: 255 }).notNull(), // Will auto-detect email validation
   ```

2. **Use Descriptive Field Names**
   ```javascript
   // Good: Auto-detects phone validation
   phoneNumber: varchar('phone_number', { length: 20 }),
   
   // Good: Auto-detects URL validation
   websiteUrl: varchar('website_url', { length: 500 }),
   ```

3. **Handle Optional Fields Properly**
   ```javascript
   // Optional field
   middleName: varchar('middle_name', { length: 100 }),
   
   // Required field
   lastName: varchar('last_name', { length: 100 }).notNull(),
   ```

4. **Use Enums for Constrained Values**
   ```javascript
   const roleEnum = pgEnum('role', ['user', 'admin', 'manager']);
   role: roleEnum('role').notNull(), // Auto-generates select options
   ```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Field Not Showing as Required**
   - Check if field has `.notNull()` in schema
   - Verify field doesn't have a default value
   - Ensure field isn't in `excludeFields` array

2. **Validation Rules Not Loading**
   - Check API endpoint: `/api/v1/validation/schema/yourSchemaName`
   - Verify schema name matches exactly
   - Check browser console for errors

3. **Custom Validation Not Working**
   - Ensure custom validation object is properly formatted
   - Check that field names match schema field names
   - Verify validation functions return string (error) or null (success)

This validation system provides a robust, type-safe way to ensure data integrity from database to UI while minimizing code duplication and maintenance overhead.
