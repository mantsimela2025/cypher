const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateUser, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// GET /api/v1/users - Get all users (with pagination and search)
router.get('/', userController.getAllUsers);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// POST /api/v1/users - Create new user
router.post('/', validateUser, userController.createUser);

// PUT /api/v1/users/:id - Update user
router.put('/:id', validateUserUpdate, userController.updateUser);

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
