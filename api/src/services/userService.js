const { db } = require('../db');
const { users } = require('../db/schema');
const { eq, like, or, and, desc, asc } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

const userService = {
  // Get all users with pagination and search
  getAllUsers: async ({ page = 1, limit = 10, search = '', role = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' }) => {
    try {
      const offset = (page - 1) * limit;

      let query = db.select({
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
      }).from(users);

      // Build where conditions
      const whereConditions = [];

      // Add search filter if provided
      if (search) {
        whereConditions.push(
          or(
            like(users.email, `%${search}%`),
            like(users.username, `%${search}%`),
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`)
          )
        );
      }

      // Add role filter if provided
      if (role) {
        whereConditions.push(eq(users.role, role));
      }

      // Add status filter if provided
      if (status) {
        whereConditions.push(eq(users.status, status));
      }

      // Apply where conditions
      if (whereConditions.length > 0) {
        query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
      }

      // Add sorting
      const orderBy = sortOrder === 'desc' ? desc(users[sortBy]) : asc(users[sortBy]);
      query = query.orderBy(orderBy);

      // Add pagination
      query = query.limit(limit).offset(offset);

      const result = await query;

      // Get total count for pagination (apply same filters)
      let countQuery = db.select({ count: users.id }).from(users);
      if (whereConditions.length > 0) {
        countQuery = countQuery.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
      }
      
      const [{ count }] = await countQuery;
      const totalPages = Math.ceil(count / limit);

      return {
        users: result,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  },

  // Get user by ID
  getUserById: async (id) => {
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
        .where(eq(users.id, id));

      return user || null;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  },

  // Get user by email
  getUserByEmail: async (email) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      return user || null;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const { email, username, password, firstName, lastName, role = 'user' } = userData;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          username,
          password: hashedPassword,
          passwordHash: hashedPassword, // Both fields for compatibility
          firstName,
          lastName,
          role,
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

      return newUser;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Email or username already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  // Update user
  updateUser: async (id, updateData) => {
    try {
      const { password, ...otherData } = updateData;
      
      let dataToUpdate = { ...otherData, updatedAt: new Date() };

      // Hash password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        dataToUpdate.password = hashedPassword;
        dataToUpdate.passwordHash = hashedPassword; // Both fields for compatibility
      }

      const [updatedUser] = await db
        .update(users)
        .set(dataToUpdate)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          status: users.status,
          authMethod: users.authMethod,
          updatedAt: users.updatedAt,
        });

      return updatedUser || null;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email or username already exists');
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });

      return deletedUser || null;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },
};

module.exports = userService;
