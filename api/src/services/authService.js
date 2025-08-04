const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');
const config = require('../config');

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const { email, username, password, firstName, lastName } = userData;

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (existingUsername.length > 0) {
        throw new Error('Username already taken');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          username,
          password: hashedPassword,
          passwordHash: hashedPassword, // Both fields for compatibility
          firstName,
          lastName,
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        });

      // Generate tokens
      const tokens = generateTokens(newUser);

      return {
        user: newUser,
        ...tokens,
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Account is deactivated or suspended');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = generateTokens(user);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
      
      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId));

      if (!user || user.status !== 'active') {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      return tokens;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  },

  // Logout user (in a real app, you might want to blacklist the refresh token)
  logout: async (refreshToken) => {
    try {
      // In a production app, you would typically:
      // 1. Add the refresh token to a blacklist/revoked tokens table
      // 2. Or store active sessions and remove them
      // For now, we'll just return success
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  },

  // Get user profile
  getUserProfile: async (userId) => {
    try {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          status: users.status,
          authMethod: users.authMethod,
          certificateSubject: users.certificateSubject,
          certificateExpiry: users.certificateExpiry,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  },
};

// Helper function to generate JWT tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token
  });

  const refreshToken = jwt.sign(
    { userId: user.id },
    config.JWT_SECRET,
    {
      expiresIn: '7d', // Long-lived refresh token
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
};

module.exports = authService;
