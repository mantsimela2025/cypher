const { body } = require('express-validator');

// User registration validation
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name must be 1-50 characters long'),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name must be 1-50 characters long'),
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// User creation validation (for admin creating users)
const validateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name must be 1-50 characters long'),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name must be 1-50 characters long'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be one of: user, admin, moderator'),
];

// User update validation
const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  
  body('password')
    .optional()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name must be 1-50 characters long'),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name must be 1-50 characters long'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be one of: user, admin, moderator'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUser,
  validateUserUpdate,
};
