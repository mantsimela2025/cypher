const { db } = require('../db');
const {
  artifacts,
  artifactCategories,
  users
} = require('../db/schema');
const { categories } = require('../db/schema/categories');
const { eq, and, desc, asc, sql, count, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');
const notificationService = require('./notificationService');
const auditService = require('./auditLogService');

class CategoriesService {

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create a new category
   */
  async createCategory(categoryData, userId) {
    try {
      console.log('📁 Creating category:', categoryData.name);

      // Check if parent exists if parentId is provided
      if (categoryData.parentId) {
        const parentExists = await this.getCategoryById(categoryData.parentId);
        if (!parentExists) {
          throw new Error('Parent category not found');
        }
      }

      // Check for duplicate names at the same level
      await this.checkDuplicateName(categoryData.name, categoryData.parentId);

      const [newCategory] = await db.insert(categories)
        .values({
          name: categoryData.name,
          description: categoryData.description || '',
          parentId: categoryData.parentId || null,
          status: categoryData.status || 'active',
          metadata: categoryData.metadata || {},
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Log audit trail
      await auditService.logAction(userId, 'category', 'create', newCategory.id, null, newCategory);

      // Send notification
      await this.sendCategoryNotification('category_created', newCategory, userId);

      return await this.getCategoryById(newCategory.id);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Get all categories with filtering, pagination, and hierarchy
   */
  async getAllCategories(filters = {}, pagination = {}) {
    try {
      const { 
        search, 
        status, 
        parentId, 
        hasParent,
        createdBy,
        includeDocumentCount = true
      } = filters;
      
      const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc' } = pagination;

      let query = db.select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        parentId: categories.parentId,
        status: categories.status,
        metadata: categories.metadata,
        createdBy: categories.createdBy,
        updatedBy: categories.updatedBy,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        creatorName: users.firstName,
        creatorLastName: users.lastName
      })
      .from(categories)
      .leftJoin(users, eq(categories.createdBy, users.id));

      // Apply filters
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(categories.name, `%${search}%`),
            ilike(categories.description, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(categories.status, status));
      }

      if (parentId !== undefined) {
        if (parentId === null) {
          conditions.push(isNull(categories.parentId));
        } else {
          conditions.push(eq(categories.parentId, parentId));
        }
      }

      if (hasParent !== undefined) {
        if (hasParent) {
          conditions.push(isNotNull(categories.parentId));
        } else {
          conditions.push(isNull(categories.parentId));
        }
      }

      if (createdBy) {
        conditions.push(eq(categories.createdBy, createdBy));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = categories[sortBy] || categories.name;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const categoriesList = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(categories);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      // Enhance results with additional information
      const enhancedCategories = await Promise.all(
        categoriesList.map(async (category) => {
          const enhanced = {
            ...category,
            creatorFullName: category.creatorName && category.creatorLastName 
              ? `${category.creatorName} ${category.creatorLastName}` 
              : 'Unknown'
          };

          // Get parent name if parentId exists
          if (category.parentId) {
            try {
              const parent = await this.getCategoryById(category.parentId);
              enhanced.parentName = parent.name;
            } catch (error) {
              enhanced.parentName = 'Unknown';
            }
          }

          // Get document count if requested
          if (includeDocumentCount) {
            enhanced.documentCount = await this.getCategoryDocumentCount(category.id);
          }

          // Get subcategory count
          enhanced.subcategoryCount = await this.getSubcategoryCount(category.id);

          return enhanced;
        })
      );

      return {
        data: enhancedCategories,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get category by ID with full details
   */
  async getCategoryById(categoryId) {
    try {
      const [category] = await db.select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        parentId: categories.parentId,
        status: categories.status,
        metadata: categories.metadata,
        createdBy: categories.createdBy,
        updatedBy: categories.updatedBy,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        creatorName: users.firstName,
        creatorLastName: users.lastName
      })
      .from(categories)
      .leftJoin(users, eq(categories.createdBy, users.id))
      .where(eq(categories.id, categoryId))
      .limit(1);

      if (!category) {
        throw new Error('Category not found');
      }

      // Get parent information if exists
      let parentInfo = null;
      if (category.parentId) {
        try {
          const parent = await this.getCategoryById(category.parentId);
          parentInfo = {
            id: parent.id,
            name: parent.name,
            description: parent.description
          };
        } catch (error) {
          console.warn('Parent category not found:', category.parentId);
        }
      }

      // Get subcategories
      const subcategories = await this.getSubcategories(categoryId);

      // Get document count
      const documentCount = await this.getCategoryDocumentCount(categoryId);

      return {
        ...category,
        creatorFullName: category.creatorName && category.creatorLastName 
          ? `${category.creatorName} ${category.creatorLastName}` 
          : 'Unknown',
        parent: parentInfo,
        subcategories,
        documentCount,
        subcategoryCount: subcategories.length
      };
    } catch (error) {
      console.error('Error getting category by ID:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(categoryId, updateData, userId) {
    try {
      console.log('📝 Updating category:', categoryId);

      // Get current category for audit log
      const currentCategory = await this.getCategoryById(categoryId);

      // Validate parent if being changed
      if (updateData.parentId !== undefined && updateData.parentId !== currentCategory.parentId) {
        if (updateData.parentId) {
          // Check parent exists
          const parentExists = await this.getCategoryById(updateData.parentId);
          if (!parentExists) {
            throw new Error('Parent category not found');
          }

          // Check for circular reference
          if (await this.wouldCreateCircularReference(categoryId, updateData.parentId)) {
            throw new Error('Cannot set parent - would create circular reference');
          }
        }
      }

      // Check for duplicate names if name is being changed
      if (updateData.name && updateData.name !== currentCategory.name) {
        await this.checkDuplicateName(updateData.name, updateData.parentId || currentCategory.parentId, categoryId);
      }

      const [updatedCategory] = await db.update(categories)
        .set({
          ...updateData,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(categories.id, categoryId))
        .returning();

      // Log audit trail
      await auditService.logAction(userId, 'category', 'update', categoryId, currentCategory, updateData);

      // Send notification
      await this.sendCategoryNotification('category_updated', updatedCategory, userId);

      return await this.getCategoryById(categoryId);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId, userId) {
    try {
      console.log('🗑️ Deleting category:', categoryId);

      // Get category details for cleanup and audit
      const category = await this.getCategoryById(categoryId);

      // Check if category has subcategories
      const subcategories = await this.getSubcategories(categoryId);
      if (subcategories.length > 0) {
        throw new Error('Cannot delete category with subcategories. Please delete or move subcategories first.');
      }

      // Check if category has documents
      const documentCount = await this.getCategoryDocumentCount(categoryId);
      if (documentCount > 0) {
        throw new Error(`Cannot delete category with ${documentCount} associated documents. Please remove documents from this category first.`);
      }

      // Delete from database
      await db.delete(categories)
        .where(eq(categories.id, categoryId));

      // Log audit trail
      await auditService.logAction(userId, 'category', 'delete', categoryId, category, null);

      // Send notification
      await this.sendCategoryNotification('category_deleted', category, userId);

      return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // ==================== HIERARCHY OPERATIONS ====================

  /**
   * Get subcategories of a category
   */
  async getSubcategories(categoryId) {
    try {
      const subcategories = await db.select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        status: categories.status,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt
      })
      .from(categories)
      .where(eq(categories.parentId, categoryId))
      .orderBy(asc(categories.name));

      // Add document count to each subcategory
      const enhancedSubcategories = await Promise.all(
        subcategories.map(async (subcategory) => ({
          ...subcategory,
          documentCount: await this.getCategoryDocumentCount(subcategory.id)
        }))
      );

      return enhancedSubcategories;
    } catch (error) {
      console.error('Error getting subcategories:', error);
      return [];
    }
  }

  /**
   * Get category hierarchy (tree structure)
   */
  async getCategoryHierarchy() {
    try {
      // Get all root categories (no parent)
      const rootCategories = await db.select()
        .from(categories)
        .where(isNull(categories.parentId))
        .orderBy(asc(categories.name));

      // Build hierarchy recursively
      const buildHierarchy = async (categories) => {
        return Promise.all(
          categories.map(async (category) => {
            const subcategories = await this.getSubcategories(category.id);
            const documentCount = await this.getCategoryDocumentCount(category.id);
            
            return {
              ...category,
              documentCount,
              subcategories: subcategories.length > 0 ? await buildHierarchy(subcategories) : []
            };
          })
        );
      };

      return await buildHierarchy(rootCategories);
    } catch (error) {
      console.error('Error getting category hierarchy:', error);
      throw error;
    }
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(categoryId) {
    try {
      const path = [];
      let currentId = categoryId;

      while (currentId) {
        const category = await this.getCategoryById(currentId);
        path.unshift({
          id: category.id,
          name: category.name
        });
        currentId = category.parentId;
      }

      return path;
    } catch (error) {
      console.error('Error getting category path:', error);
      return [];
    }
  }

  // ==================== DOCUMENT OPERATIONS ====================

  /**
   * Get documents in a category
   */
  async getCategoryDocuments(categoryId, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;

      // Get artifacts associated with this category
      const query = db.select({
        id: artifacts.id,
        name: artifacts.name,
        description: artifacts.description,
        fileName: artifacts.fileName,
        fileSize: artifacts.fileSize,
        mimeType: artifacts.mimeType,
        reviewStatus: artifacts.reviewStatus,
        createdAt: artifacts.createdAt,
        updatedAt: artifacts.updatedAt
      })
      .from(artifacts)
      .innerJoin(artifactCategories, eq(artifacts.id, artifactCategories.artifactId))
      .where(eq(artifactCategories.categoryId, categoryId))
      .orderBy(desc(artifacts.createdAt));

      // Apply pagination
      const offset = (page - 1) * limit;
      const documents = await query.limit(limit).offset(offset);

      // Get total count
      const [{ count: totalCount }] = await db.select({ count: count() })
        .from(artifacts)
        .innerJoin(artifactCategories, eq(artifacts.id, artifactCategories.artifactId))
        .where(eq(artifactCategories.categoryId, categoryId));

      return {
        data: documents,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting category documents:', error);
      throw error;
    }
  }

  // ==================== STATISTICS AND ANALYTICS ====================

  /**
   * Get category statistics
   */
  async getCategoryStatistics() {
    try {
      // Total categories
      const [{ count: totalCategories }] = await db.select({ count: count() })
        .from(categories);

      // Active categories
      const [{ count: activeCategories }] = await db.select({ count: count() })
        .from(categories)
        .where(eq(categories.status, 'active'));

      // Root categories (no parent)
      const [{ count: rootCategories }] = await db.select({ count: count() })
        .from(categories)
        .where(isNull(categories.parentId));

      // Total documents across all categories
      const [{ count: totalDocuments }] = await db.select({ count: count() })
        .from(artifactCategories)
        .innerJoin(artifacts, eq(artifactCategories.artifactId, artifacts.id));

      return {
        total: totalCategories,
        active: activeCategories,
        root: rootCategories,
        documents: totalDocuments,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting category statistics:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check for duplicate category names at the same level
   */
  async checkDuplicateName(name, parentId, excludeId = null) {
    try {
      let query = db.select({ count: count() })
        .from(categories)
        .where(
          and(
            ilike(categories.name, name),
            parentId ? eq(categories.parentId, parentId) : isNull(categories.parentId)
          )
        );

      if (excludeId) {
        query = query.where(and(
          ilike(categories.name, name),
          parentId ? eq(categories.parentId, parentId) : isNull(categories.parentId),
          sql`${categories.id} != ${excludeId}`
        ));
      }

      const [{ count: duplicateCount }] = await query;

      if (duplicateCount > 0) {
        throw new Error(`Category name "${name}" already exists at this level`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if setting a parent would create a circular reference
   */
  async wouldCreateCircularReference(categoryId, parentId) {
    try {
      let currentId = parentId;
      
      while (currentId) {
        if (currentId === categoryId) {
          return true; // Circular reference detected
        }
        
        const parent = await this.getCategoryById(currentId);
        currentId = parent.parentId;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking circular reference:', error);
      return true; // Err on the side of caution
    }
  }

  /**
   * Get document count for a category
   */
  async getCategoryDocumentCount(categoryId) {
    try {
      const [{ count: documentCount }] = await db.select({ count: count() })
        .from(artifactCategories)
        .innerJoin(artifacts, eq(artifactCategories.artifactId, artifacts.id))
        .where(eq(artifactCategories.categoryId, categoryId));

      return documentCount;
    } catch (error) {
      console.error('Error getting category document count:', error);
      return 0;
    }
  }

  /**
   * Get subcategory count for a category
   */
  async getSubcategoryCount(categoryId) {
    try {
      const [{ count: subcategoryCount }] = await db.select({ count: count() })
        .from(categories)
        .where(eq(categories.parentId, categoryId));

      return subcategoryCount;
    } catch (error) {
      console.error('Error getting subcategory count:', error);
      return 0;
    }
  }

  /**
   * Send category-related notifications
   */
  async sendCategoryNotification(eventType, category, userId) {
    try {
      const notificationMap = {
        'category_created': {
          title: 'Category Created',
          message: `New category created: ${category.name}`,
          type: 'info'
        },
        'category_updated': {
          title: 'Category Updated',
          message: `Category updated: ${category.name}`,
          type: 'info'
        },
        'category_deleted': {
          title: 'Category Deleted',
          message: `Category deleted: ${category.name}`,
          type: 'warning'
        }
      };

      const notification = notificationMap[eventType];
      if (notification) {
        await notificationService.createNotification({
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'categories',
          eventType: eventType,
          relatedId: category.id,
          relatedType: 'category',
          metadata: category
        });
      }
    } catch (error) {
      console.error('Error sending category notification:', error);
    }
  }
}

module.exports = new CategoriesService();