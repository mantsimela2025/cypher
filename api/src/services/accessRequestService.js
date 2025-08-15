const { db } = require('../db');
const { accessRequests, users } = require('../db/schema');
const { eq, and, desc, asc, sql, count, like, ilike, gte, lte } = require('drizzle-orm');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

class AccessRequestService {

  // ==================== CORE ACCESS REQUEST OPERATIONS ====================

  /**
   * Submit access request
   */
  async submitAccessRequest(requestData) {
    try {
      console.log('📝 Submitting access request for:', requestData.email);

      // Check if there's already a pending request for this email
      const [existingRequest] = await db.select()
        .from(accessRequests)
        .where(and(
          eq(accessRequests.email, requestData.email),
          eq(accessRequests.status, 'pending')
        ))
        .limit(1);

      if (existingRequest) {
        throw new Error('A pending access request already exists for this email address');
      }

      // Create the access request
      const [newRequest] = await db.insert(accessRequests)
        .values({
          ...requestData,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Send notification to admins
      await this.notifyAdminsOfNewRequest(newRequest);

      // Send confirmation email to requester
      await this.sendRequestConfirmationEmail(newRequest);

      return newRequest;
    } catch (error) {
      console.error('Error submitting access request:', error);
      throw error;
    }
  }

  /**
   * Get all access requests with filtering and pagination
   */
  async getAllAccessRequests(filters = {}, pagination = {}) {
    try {
      const { 
        status, 
        search,
        startDate,
        endDate,
        processedBy
      } = filters;
      
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = pagination;

      let query = db.select({
        id: accessRequests.id,
        firstName: accessRequests.firstName,
        lastName: accessRequests.lastName,
        email: accessRequests.email,
        status: accessRequests.status,
        reason: accessRequests.reason,
        rejectionReason: accessRequests.rejectionReason,
        processedAt: accessRequests.processedAt,
        processedBy: accessRequests.processedBy,
        createdAt: accessRequests.createdAt,
        updatedAt: accessRequests.updatedAt,
        processedByName: users.firstName,
        processedByLastName: users.lastName,
        processedByEmail: users.email
      })
      .from(accessRequests)
      .leftJoin(users, eq(accessRequests.processedBy, users.id));

      // Apply filters
      const conditions = [];

      if (status) {
        conditions.push(eq(accessRequests.status, status));
      }

      if (search) {
        conditions.push(
          sql`(
            ${accessRequests.firstName} ILIKE ${`%${search}%`} OR 
            ${accessRequests.lastName} ILIKE ${`%${search}%`} OR 
            ${accessRequests.email} ILIKE ${`%${search}%`} OR 
            ${accessRequests.reason} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (startDate) {
        conditions.push(gte(accessRequests.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(accessRequests.createdAt, new Date(endDate)));
      }

      if (processedBy) {
        conditions.push(eq(accessRequests.processedBy, processedBy));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = accessRequests[sortBy] || accessRequests.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const requests = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(accessRequests);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: requests,
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
      console.error('Error getting access requests:', error);
      throw error;
    }
  }

  /**
   * Get access request by ID
   */
  async getAccessRequestById(requestId) {
    try {
      const [request] = await db.select({
        id: accessRequests.id,
        firstName: accessRequests.firstName,
        lastName: accessRequests.lastName,
        email: accessRequests.email,
        status: accessRequests.status,
        reason: accessRequests.reason,
        rejectionReason: accessRequests.rejectionReason,
        processedAt: accessRequests.processedAt,
        processedBy: accessRequests.processedBy,
        createdAt: accessRequests.createdAt,
        updatedAt: accessRequests.updatedAt,
        processedByName: users.firstName,
        processedByLastName: users.lastName,
        processedByEmail: users.email
      })
      .from(accessRequests)
      .leftJoin(users, eq(accessRequests.processedBy, users.id))
      .where(eq(accessRequests.id, requestId))
      .limit(1);

      if (!request) {
        throw new Error('Access request not found');
      }

      return request;
    } catch (error) {
      console.error('Error getting access request by ID:', error);
      throw error;
    }
  }

  /**
   * Approve access request
   */
  async approveAccessRequest(requestId, adminUserId) {
    try {
      console.log('✅ Approving access request:', requestId);

      // Get the request details
      const request = await this.getAccessRequestById(requestId);
      
      if (request.status !== 'pending') {
        throw new Error('Access request has already been processed');
      }

      // Update the request status
      const [updatedRequest] = await db.update(accessRequests)
        .set({
          status: 'approved',
          processedAt: new Date(),
          processedBy: adminUserId,
          updatedAt: new Date()
        })
        .where(eq(accessRequests.id, requestId))
        .returning();

      // Create user account (you might want to customize this based on your user creation logic)
      await this.createUserFromApprovedRequest(updatedRequest);

      // Send approval notification to requester
      await this.sendApprovalNotificationEmail(updatedRequest);

      // Create notification for requester (if they have an account now)
      await this.createApprovalNotification(updatedRequest);

      return updatedRequest;
    } catch (error) {
      console.error('Error approving access request:', error);
      throw error;
    }
  }

  /**
   * Reject access request
   */
  async rejectAccessRequest(requestId, adminUserId, rejectionReason) {
    try {
      console.log('❌ Rejecting access request:', requestId);

      // Get the request details
      const request = await this.getAccessRequestById(requestId);
      
      if (request.status !== 'pending') {
        throw new Error('Access request has already been processed');
      }

      // Update the request status
      const [updatedRequest] = await db.update(accessRequests)
        .set({
          status: 'rejected',
          rejectionReason,
          processedAt: new Date(),
          processedBy: adminUserId,
          updatedAt: new Date()
        })
        .where(eq(accessRequests.id, requestId))
        .returning();

      // Send rejection notification to requester
      await this.sendRejectionNotificationEmail(updatedRequest);

      return updatedRequest;
    } catch (error) {
      console.error('Error rejecting access request:', error);
      throw error;
    }
  }

  /**
   * Get access request statistics
   */
  async getAccessRequestStats() {
    try {
      // Get overall stats
      const [overallStats] = await db.select({
        total: count(),
        pending: sql`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
        approved: sql`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        rejected: sql`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`
      })
      .from(accessRequests);

      // Get stats by month for the last 12 months
      const monthlyStats = await db.select({
        month: sql`DATE_TRUNC('month', created_at)`,
        total: count(),
        pending: sql`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
        approved: sql`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        rejected: sql`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`
      })
      .from(accessRequests)
      .where(gte(accessRequests.createdAt, sql`NOW() - INTERVAL '12 months'`))
      .groupBy(sql`DATE_TRUNC('month', created_at)`)
      .orderBy(sql`DATE_TRUNC('month', created_at) DESC`);

      // Get recent activity (last 30 days)
      const [recentActivity] = await db.select({
        total: count(),
        pending: sql`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
        approved: sql`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        rejected: sql`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`
      })
      .from(accessRequests)
      .where(gte(accessRequests.createdAt, sql`NOW() - INTERVAL '30 days'`));

      return {
        overall: overallStats,
        monthly: monthlyStats,
        recent: recentActivity
      };
    } catch (error) {
      console.error('Error getting access request stats:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION AND EMAIL METHODS ====================

  /**
   * Notify admins of new access request
   */
  async notifyAdminsOfNewRequest(request) {
    try {
      console.log('📧 Notifying admins of new access request');

      // Get admin users (you might want to customize this query based on your role system)
      const adminUsers = await db.select()
        .from(users)
        .where(eq(users.role, 'admin'));

      // Create notifications for each admin
      for (const admin of adminUsers) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'New Access Request',
          message: `${request.firstName} ${request.lastName} (${request.email}) has requested access to the system.`,
          type: 'info',
          module: 'access_requests',
          eventType: 'new_request',
          relatedId: request.id,
          relatedType: 'access_request',
          priority: 2,
          metadata: {
            requesterName: `${request.firstName} ${request.lastName}`,
            requesterEmail: request.email,
            reason: request.reason
          }
        });
      }

      // Send email notifications to admins
      const adminEmails = adminUsers.map(admin => admin.email);
      if (adminEmails.length > 0) {
        const emailBody = `
          <h2>New Access Request</h2>
          <p>A new access request has been submitted and requires your review:</p>
          <ul>
            <li><strong>Name:</strong> ${request.firstName} ${request.lastName}</li>
            <li><strong>Email:</strong> ${request.email}</li>
            <li><strong>Reason:</strong> ${request.reason || 'Not provided'}</li>
            <li><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleString()}</li>
          </ul>
          <p>Please review and process this request in the admin panel.</p>
        `;
        
        // Send email to each admin individually due to SES sandbox limitations
        for (const adminEmail of adminEmails) {
          await emailService.sendNotificationEmail(
            adminEmail,
            'New Access Request - Action Required',
            emailBody
          );
        }
      }
    } catch (error) {
      console.error('Error notifying admins of new request:', error);
      // Don't throw error here to avoid failing the main request
    }
  }

  /**
   * Send confirmation email to requester
   */
  async sendRequestConfirmationEmail(request) {
    try {
      console.log('📧 Sending confirmation email to requester');

      const confirmationBody = `
        <h2>Access Request Received</h2>
        <p>Dear ${request.firstName} ${request.lastName},</p>
        <p>Thank you for your interest in accessing our system. We have received your access request and it is currently being reviewed by our administrators.</p>
        <p><strong>Request Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${request.firstName} ${request.lastName}</li>
          <li><strong>Email:</strong> ${request.email}</li>
          <li><strong>Reason:</strong> ${request.reason || 'Not provided'}</li>
          <li><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleString()}</li>
        </ul>
        <p>You will receive an email notification once your request has been processed.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>System Administration Team</p>
      `;
      
      await emailService.sendNotificationEmail(
        request.email,
        'Access Request Received',
        confirmationBody
      );
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw error here to avoid failing the main request
    }
  }

  /**
   * Send approval notification email
   */
  async sendApprovalNotificationEmail(request) {
    try {
      console.log('📧 Sending approval notification email');

      const approvalBody = `
        <h2>Access Request Approved</h2>
        <p>Dear ${request.firstName} ${request.lastName},</p>
        <p>Great news! Your access request has been approved and your account has been created.</p>
        <p><strong>Account Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${request.email}</li>
          <li><strong>Approved:</strong> ${new Date(request.processedAt).toLocaleString()}</li>
        </ul>
        <p>You can now log in to the system using your email address. If you haven't set a password yet, please use the password reset feature on the login page.</p>
        <p>Welcome to the system!</p>
        <p>Best regards,<br>System Administration Team</p>
      `;
      
      await emailService.sendNotificationEmail(
        request.email,
        'Access Request Approved - Welcome!',
        approvalBody
      );
    } catch (error) {
      console.error('Error sending approval notification email:', error);
      // Don't throw error here to avoid failing the main operation
    }
  }

  /**
   * Send rejection notification email
   */
  async sendRejectionNotificationEmail(request) {
    try {
      console.log('📧 Sending rejection notification email');

      const rejectionBody = `
        <h2>Access Request Update</h2>
        <p>Dear ${request.firstName} ${request.lastName},</p>
        <p>Thank you for your interest in accessing our system. After careful review, we are unable to approve your access request at this time.</p>
        ${request.rejectionReason ? `
          <p><strong>Reason:</strong></p>
          <p>${request.rejectionReason}</p>
        ` : ''}
        <p><strong>Request Details:</strong></p>
        <ul>
          <li><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleString()}</li>
          <li><strong>Processed:</strong> ${new Date(request.processedAt).toLocaleString()}</li>
        </ul>
        <p>If you believe this decision was made in error or if your circumstances have changed, please feel free to submit a new request or contact our support team.</p>
        <p>Best regards,<br>System Administration Team</p>
      `;
      
      await emailService.sendNotificationEmail(
        request.email,
        'Access Request Update',
        rejectionBody
      );
    } catch (error) {
      console.error('Error sending rejection notification email:', error);
      // Don't throw error here to avoid failing the main operation
    }
  }

  /**
   * Create approval notification for user
   */
  async createApprovalNotification(request) {
    try {
      // Try to find the user account that was created
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, request.email))
        .limit(1);

      if (user) {
        await notificationService.createNotification({
          userId: user.id,
          title: 'Welcome! Your Access Request Has Been Approved',
          message: 'Your access request has been approved and your account is now active. Welcome to the system!',
          type: 'success',
          module: 'access_requests',
          eventType: 'request_approved',
          relatedId: request.id,
          relatedType: 'access_request',
          priority: 2,
          metadata: {
            approvedAt: request.processedAt,
            processedBy: request.processedBy
          }
        });
      }
    } catch (error) {
      console.error('Error creating approval notification:', error);
      // Don't throw error here to avoid failing the main operation
    }
  }

  /**
   * Create user account from approved request
   */
  async createUserFromApprovedRequest(request) {
    try {
      console.log('👤 Creating user account from approved request');

      // Check if user already exists
      const [existingUser] = await db.select()
        .from(users)
        .where(eq(users.email, request.email))
        .limit(1);

      if (existingUser) {
        console.log('User already exists, skipping account creation');
        return existingUser;
      }

      // Generate a temporary password (user will need to reset it)
      const crypto = require('crypto');
      const bcrypt = require('bcrypt');
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create new user account
      const [newUser] = await db.insert(users)
        .values({
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          username: request.email, // Use email as username
          password: 'password', // Default placeholder - user must reset
          passwordHash: hashedPassword, // Hashed temporary password
          role: 'user', // Default role
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('✅ User account created successfully:', newUser.email);
      return newUser;
    } catch (error) {
      console.error('Error creating user from approved request:', error);
      throw error;
    }
  }

  /**
   * Delete access request
   */
  async deleteAccessRequest(requestId, adminUserId) {
    try {
      console.log('🗑️ Deleting access request:', requestId);

      // Get the request details first
      const request = await this.getAccessRequestById(requestId);

      // Delete the request
      await db.delete(accessRequests)
        .where(eq(accessRequests.id, requestId));

      return { success: true, deletedRequest: request };
    } catch (error) {
      console.error('Error deleting access request:', error);
      throw error;
    }
  }
}

module.exports = new AccessRequestService();
