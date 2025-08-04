const { db } = require('../db');
const { 
  reports, 
  reportTemplates, 
  reportConfigurations, 
  reportSchedules,
  reportExecutions,
  reportShares,
  reportSubscriptions,
  reportAnalytics,
  metrics,
  users
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull } = require('drizzle-orm');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const notificationService = require('./notificationService');

class ReportService {

  // ==================== REPORT TEMPLATE MANAGEMENT ====================

  /**
   * Create report template
   */
  async createTemplate(templateData, userId) {
    try {
      console.log('📊 Creating report template:', templateData.name);

      const [newTemplate] = await db.insert(reportTemplates)
        .values({
          ...templateData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newTemplate;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw error;
    }
  }

  /**
   * Get all report templates
   */
  async getAllTemplates(filters = {}, pagination = {}) {
    try {
      const { module, isSystem, search } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: reportTemplates.id,
        name: reportTemplates.name,
        description: reportTemplates.description,
        module: reportTemplates.module,
        templateData: reportTemplates.templateData,
        isSystem: reportTemplates.isSystem,
        createdBy: reportTemplates.createdBy,
        createdAt: reportTemplates.createdAt,
        updatedAt: reportTemplates.updatedAt
      })
      .from(reportTemplates);

      // Apply filters
      const conditions = [];

      if (module) {
        conditions.push(eq(reportTemplates.module, module));
      }

      if (typeof isSystem === 'boolean') {
        conditions.push(eq(reportTemplates.isSystem, isSystem));
      }

      if (search) {
        conditions.push(
          sql`(
            ${reportTemplates.name} ILIKE ${`%${search}%`} OR 
            ${reportTemplates.description} ILIKE ${`%${search}%`} OR 
            ${reportTemplates.module} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = reportTemplates[sortBy] || reportTemplates.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const templates = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(reportTemplates);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: templates,
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
      console.error('Error getting report templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId) {
    try {
      const [template] = await db.select()
        .from(reportTemplates)
        .where(eq(reportTemplates.id, templateId))
        .limit(1);

      if (!template) {
        throw new Error('Report template not found');
      }

      return template;
    } catch (error) {
      console.error('Error getting report template by ID:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updateData, userId) {
    try {
      console.log('📊 Updating report template:', templateId);

      const [updatedTemplate] = await db.update(reportTemplates)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(reportTemplates.id, templateId))
        .returning();

      return updatedTemplate;
    } catch (error) {
      console.error('Error updating report template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId, userId) {
    try {
      console.log('🗑️ Deleting report template:', templateId);

      // Check if template is being used
      const [usageCount] = await db.select({ count: count() })
        .from(reportConfigurations)
        .where(eq(reportConfigurations.templateId, templateId));

      if (usageCount.count > 0) {
        throw new Error('Cannot delete template that is being used by configurations');
      }

      await db.delete(reportTemplates)
        .where(eq(reportTemplates.id, templateId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw error;
    }
  }

  // ==================== REPORT CONFIGURATION MANAGEMENT ====================

  /**
   * Create report configuration
   */
  async createConfiguration(configData, userId) {
    try {
      console.log('⚙️ Creating report configuration:', configData.name);

      // Validate template exists
      await this.getTemplateById(configData.templateId);

      const [newConfig] = await db.insert(reportConfigurations)
        .values({
          ...configData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newConfig;
    } catch (error) {
      console.error('Error creating report configuration:', error);
      throw error;
    }
  }

  /**
   * Get all configurations
   */
  async getAllConfigurations(filters = {}, pagination = {}) {
    try {
      const { templateId, search } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: reportConfigurations.id,
        name: reportConfigurations.name,
        templateId: reportConfigurations.templateId,
        parameters: reportConfigurations.parameters,
        createdBy: reportConfigurations.createdBy,
        createdAt: reportConfigurations.createdAt,
        updatedAt: reportConfigurations.updatedAt,
        templateName: reportTemplates.name,
        templateModule: reportTemplates.module
      })
      .from(reportConfigurations)
      .leftJoin(reportTemplates, eq(reportConfigurations.templateId, reportTemplates.id));

      // Apply filters
      const conditions = [];

      if (templateId) {
        conditions.push(eq(reportConfigurations.templateId, templateId));
      }

      if (search) {
        conditions.push(
          sql`(
            ${reportConfigurations.name} ILIKE ${`%${search}%`} OR 
            ${reportTemplates.name} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = reportConfigurations[sortBy] || reportConfigurations.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const configurations = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(reportConfigurations);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: configurations,
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
      console.error('Error getting report configurations:', error);
      throw error;
    }
  }

  /**
   * Get configuration by ID
   */
  async getConfigurationById(configId) {
    try {
      const [config] = await db.select({
        id: reportConfigurations.id,
        name: reportConfigurations.name,
        templateId: reportConfigurations.templateId,
        parameters: reportConfigurations.parameters,
        createdBy: reportConfigurations.createdBy,
        createdAt: reportConfigurations.createdAt,
        updatedAt: reportConfigurations.updatedAt,
        template: {
          id: reportTemplates.id,
          name: reportTemplates.name,
          description: reportTemplates.description,
          module: reportTemplates.module,
          templateData: reportTemplates.templateData
        }
      })
      .from(reportConfigurations)
      .leftJoin(reportTemplates, eq(reportConfigurations.templateId, reportTemplates.id))
      .where(eq(reportConfigurations.id, configId))
      .limit(1);

      if (!config) {
        throw new Error('Report configuration not found');
      }

      return config;
    } catch (error) {
      console.error('Error getting report configuration by ID:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(configId, updateData, userId) {
    try {
      console.log('⚙️ Updating report configuration:', configId);

      const [updatedConfig] = await db.update(reportConfigurations)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(reportConfigurations.id, configId))
        .returning();

      return updatedConfig;
    } catch (error) {
      console.error('Error updating report configuration:', error);
      throw error;
    }
  }

  /**
   * Delete configuration
   */
  async deleteConfiguration(configId, userId) {
    try {
      console.log('🗑️ Deleting report configuration:', configId);

      // Check if configuration is being used by schedules
      const [usageCount] = await db.select({ count: count() })
        .from(reportSchedules)
        .where(eq(reportSchedules.configurationId, configId));

      if (usageCount.count > 0) {
        throw new Error('Cannot delete configuration that is being used by schedules');
      }

      await db.delete(reportConfigurations)
        .where(eq(reportConfigurations.id, configId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting report configuration:', error);
      throw error;
    }
  }

  // ==================== REPORT SCHEDULE MANAGEMENT ====================

  /**
   * Create report schedule
   */
  async createSchedule(scheduleData, userId) {
    try {
      console.log('📅 Creating report schedule:', scheduleData.name);

      // Validate configuration exists
      await this.getConfigurationById(scheduleData.configurationId);

      // Calculate next run time
      const nextRun = this.calculateNextRun(scheduleData.frequency, scheduleData.cronExpression);

      const [newSchedule] = await db.insert(reportSchedules)
        .values({
          ...scheduleData,
          nextRun,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newSchedule;
    } catch (error) {
      console.error('Error creating report schedule:', error);
      throw error;
    }
  }

  /**
   * Get all schedules
   */
  async getAllSchedules(filters = {}, pagination = {}) {
    try {
      const { configurationId, active, frequency } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: reportSchedules.id,
        name: reportSchedules.name,
        configurationId: reportSchedules.configurationId,
        frequency: reportSchedules.frequency,
        nextRun: reportSchedules.nextRun,
        lastRun: reportSchedules.lastRun,
        recipients: reportSchedules.recipients,
        active: reportSchedules.active,
        createdBy: reportSchedules.createdBy,
        createdAt: reportSchedules.createdAt,
        updatedAt: reportSchedules.updatedAt,
        configurationName: reportConfigurations.name,
        templateName: reportTemplates.name
      })
      .from(reportSchedules)
      .leftJoin(reportConfigurations, eq(reportSchedules.configurationId, reportConfigurations.id))
      .leftJoin(reportTemplates, eq(reportConfigurations.templateId, reportTemplates.id));

      // Apply filters
      const conditions = [];

      if (configurationId) {
        conditions.push(eq(reportSchedules.configurationId, configurationId));
      }

      if (typeof active === 'boolean') {
        conditions.push(eq(reportSchedules.active, active));
      }

      if (frequency) {
        conditions.push(eq(reportSchedules.frequency, frequency));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = reportSchedules[sortBy] || reportSchedules.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const schedules = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(reportSchedules);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: schedules,
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
      console.error('Error getting report schedules:', error);
      throw error;
    }
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(scheduleId) {
    try {
      const [schedule] = await db.select({
        id: reportSchedules.id,
        name: reportSchedules.name,
        configurationId: reportSchedules.configurationId,
        frequency: reportSchedules.frequency,
        cronExpression: reportSchedules.cronExpression,
        nextRun: reportSchedules.nextRun,
        lastRun: reportSchedules.lastRun,
        recipients: reportSchedules.recipients,
        deliveryMethod: reportSchedules.deliveryMethod,
        active: reportSchedules.active,
        timezone: reportSchedules.timezone,
        createdBy: reportSchedules.createdBy,
        createdAt: reportSchedules.createdAt,
        updatedAt: reportSchedules.updatedAt
      })
      .from(reportSchedules)
      .where(eq(reportSchedules.id, scheduleId))
      .limit(1);

      if (!schedule) {
        throw new Error('Report schedule not found');
      }

      return schedule;
    } catch (error) {
      console.error('Error getting report schedule by ID:', error);
      throw error;
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(scheduleId, updateData, userId) {
    try {
      console.log('📅 Updating report schedule:', scheduleId);

      // Recalculate next run if frequency changed
      if (updateData.frequency || updateData.cronExpression) {
        updateData.nextRun = this.calculateNextRun(
          updateData.frequency || undefined,
          updateData.cronExpression || undefined
        );
      }

      const [updatedSchedule] = await db.update(reportSchedules)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(reportSchedules.id, scheduleId))
        .returning();

      return updatedSchedule;
    } catch (error) {
      console.error('Error updating report schedule:', error);
      throw error;
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId, userId) {
    try {
      console.log('🗑️ Deleting report schedule:', scheduleId);

      await db.delete(reportSchedules)
        .where(eq(reportSchedules.id, scheduleId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting report schedule:', error);
      throw error;
    }
  }

  // ==================== REPORT GENERATION ====================

  /**
   * Generate report
   */
  async generateReport(reportData, userId) {
    try {
      console.log('📊 Generating report:', reportData.name);

      // Create report record
      const [newReport] = await db.insert(reports)
        .values({
          ...reportData,
          status: 'generating',
          generatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create execution record
      const [execution] = await db.insert(reportExecutions)
        .values({
          reportId: newReport.id,
          status: 'generating',
          executedBy: userId,
          startedAt: new Date()
        })
        .returning();

      try {
        // Generate report content based on type and parameters
        const reportContent = await this.generateReportContent(newReport);

        // Generate file based on format
        const filePath = await this.generateReportFile(newReport, reportContent);
        const fileStats = await fs.stat(filePath);

        // Update report with success
        const [completedReport] = await db.update(reports)
          .set({
            status: 'completed',
            filePath: filePath,
            fileSize: fileStats.size,
            generatedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(reports.id, newReport.id))
          .returning();

        // Update execution record
        await db.update(reportExecutions)
          .set({
            status: 'completed',
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
            fileSize: fileStats.size,
            recordCount: reportContent.recordCount || 0
          })
          .where(eq(reportExecutions.id, execution.id));

        // Send notifications if configured
        await this.sendReportNotifications(completedReport, userId);

        return completedReport;

      } catch (generationError) {
        console.error('Report generation failed:', generationError);

        // Update report with failure
        await db.update(reports)
          .set({
            status: 'failed',
            errorMessage: generationError.message,
            updatedAt: new Date()
          })
          .where(eq(reports.id, newReport.id));

        // Update execution record
        await db.update(reportExecutions)
          .set({
            status: 'failed',
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
            errorMessage: generationError.message
          })
          .where(eq(reportExecutions.id, execution.id));

        throw generationError;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get all reports
   */
  async getAllReports(filters = {}, pagination = {}) {
    try {
      const { type, status, generatedBy, startDate, endDate, search } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: reports.id,
        name: reports.name,
        description: reports.description,
        type: reports.type,
        status: reports.status,
        format: reports.format,
        fileSize: reports.fileSize,
        generatedAt: reports.generatedAt,
        generatedBy: reports.generatedBy,
        downloadCount: reports.downloadCount,
        expiresAt: reports.expiresAt,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt
      })
      .from(reports);

      // Apply filters
      const conditions = [];

      if (type) {
        conditions.push(eq(reports.type, type));
      }

      if (status) {
        conditions.push(eq(reports.status, status));
      }

      if (generatedBy) {
        conditions.push(eq(reports.generatedBy, generatedBy));
      }

      if (startDate) {
        conditions.push(gte(reports.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(reports.createdAt, new Date(endDate)));
      }

      if (search) {
        conditions.push(
          sql`(
            ${reports.name} ILIKE ${`%${search}%`} OR
            ${reports.description} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = reports[sortBy] || reports.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const reportList = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(reports);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: reportList,
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
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId) {
    try {
      const [report] = await db.select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      console.error('Error getting report by ID:', error);
      throw error;
    }
  }

  /**
   * Delete report
   */
  async deleteReport(reportId, userId) {
    try {
      console.log('🗑️ Deleting report:', reportId);

      const report = await this.getReportById(reportId);

      // Delete file if exists
      if (report.filePath) {
        try {
          await fs.unlink(report.filePath);
        } catch (fileError) {
          console.warn('Could not delete report file:', fileError.message);
        }
      }

      // Delete related records
      await db.delete(reportExecutions)
        .where(eq(reportExecutions.reportId, reportId));

      await db.delete(reportShares)
        .where(eq(reportShares.reportId, reportId));

      // Delete the report
      await db.delete(reports)
        .where(eq(reports.id, reportId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Calculate next run time based on frequency
   */
  calculateNextRun(frequency, cronExpression) {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      case 'yearly':
        const nextYear = new Date(now);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear;
      case 'custom':
        // For custom schedules, you would parse the cron expression
        // This is a simplified implementation
        return new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour
      default:
        return null;
    }
  }

  /**
   * Generate report content based on type and parameters
   */
  async generateReportContent(report) {
    try {
      console.log('📊 Generating content for report type:', report.type);

      const parameters = report.parameters || {};
      let data = [];
      let recordCount = 0;

      switch (report.type) {
        case 'dashboard':
          data = await this.generateDashboardReport(parameters);
          break;
        case 'metrics':
          data = await this.generateMetricsReport(parameters);
          break;
        case 'analytics':
          data = await this.generateAnalyticsReport(parameters);
          break;
        case 'compliance':
          data = await this.generateComplianceReport(parameters);
          break;
        case 'audit':
          data = await this.generateAuditReport(parameters);
          break;
        case 'security':
          data = await this.generateSecurityReport(parameters);
          break;
        case 'asset':
          data = await this.generateAssetReport(parameters);
          break;
        case 'vulnerability':
          data = await this.generateVulnerabilityReport(parameters);
          break;
        case 'user_activity':
          data = await this.generateUserActivityReport(parameters);
          break;
        case 'system_performance':
          data = await this.generateSystemPerformanceReport(parameters);
          break;
        default:
          data = await this.generateCustomReport(report.type, parameters);
      }

      recordCount = Array.isArray(data) ? data.length : (data.recordCount || 0);

      return {
        data,
        recordCount,
        generatedAt: new Date(),
        parameters
      };
    } catch (error) {
      console.error('Error generating report content:', error);
      throw error;
    }
  }

  /**
   * Generate report file in specified format
   */
  async generateReportFile(report, content) {
    try {
      const reportsDir = path.join(process.cwd(), 'storage', 'reports');
      await fs.mkdir(reportsDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;

      let filePath;

      switch (report.format) {
        case 'pdf':
          filePath = path.join(reportsDir, `${filename}.pdf`);
          await this.generatePDFFile(filePath, report, content);
          break;
        case 'excel':
          filePath = path.join(reportsDir, `${filename}.xlsx`);
          await this.generateExcelFile(filePath, report, content);
          break;
        case 'csv':
          filePath = path.join(reportsDir, `${filename}.csv`);
          await this.generateCSVFile(filePath, report, content);
          break;
        case 'json':
          filePath = path.join(reportsDir, `${filename}.json`);
          await this.generateJSONFile(filePath, report, content);
          break;
        case 'html':
          filePath = path.join(reportsDir, `${filename}.html`);
          await this.generateHTMLFile(filePath, report, content);
          break;
        default:
          throw new Error(`Unsupported report format: ${report.format}`);
      }

      return filePath;
    } catch (error) {
      console.error('Error generating report file:', error);
      throw error;
    }
  }

  /**
   * Generate PDF file
   */
  async generatePDFFile(filePath, report, content) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = require('fs').createWriteStream(filePath);

        doc.pipe(stream);

        // Add title
        doc.fontSize(20).text(report.name, 50, 50);
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);

        if (report.description) {
          doc.text(`Description: ${report.description}`, 50, 100);
        }

        // Add content based on data structure
        let yPosition = 140;

        if (Array.isArray(content.data)) {
          content.data.forEach((item, index) => {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }

            doc.text(`${index + 1}. ${JSON.stringify(item)}`, 50, yPosition);
            yPosition += 20;
          });
        } else {
          doc.text(JSON.stringify(content.data, null, 2), 50, yPosition);
        }

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel file
   */
  async generateExcelFile(filePath, report, content) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(report.name);

      // Add header information
      worksheet.addRow([report.name]);
      worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
      if (report.description) {
        worksheet.addRow([`Description: ${report.description}`]);
      }
      worksheet.addRow([]); // Empty row

      // Add data
      if (Array.isArray(content.data) && content.data.length > 0) {
        // Add column headers
        const headers = Object.keys(content.data[0]);
        worksheet.addRow(headers);

        // Add data rows
        content.data.forEach(item => {
          const row = headers.map(header => item[header]);
          worksheet.addRow(row);
        });
      } else {
        worksheet.addRow(['No data available']);
      }

      await workbook.xlsx.writeFile(filePath);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      throw error;
    }
  }

  /**
   * Generate CSV file
   */
  async generateCSVFile(filePath, report, content) {
    try {
      let csvContent = `"${report.name}"\n`;
      csvContent += `"Generated: ${new Date().toLocaleString()}"\n`;
      if (report.description) {
        csvContent += `"Description: ${report.description}"\n`;
      }
      csvContent += '\n';

      if (Array.isArray(content.data) && content.data.length > 0) {
        // Add headers
        const headers = Object.keys(content.data[0]);
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

        // Add data
        content.data.forEach(item => {
          const row = headers.map(header => `"${item[header] || ''}"`);
          csvContent += row.join(',') + '\n';
        });
      } else {
        csvContent += '"No data available"\n';
      }

      await fs.writeFile(filePath, csvContent);
    } catch (error) {
      console.error('Error generating CSV file:', error);
      throw error;
    }
  }

  /**
   * Generate JSON file
   */
  async generateJSONFile(filePath, report, content) {
    try {
      const jsonData = {
        report: {
          name: report.name,
          description: report.description,
          type: report.type,
          generatedAt: new Date().toISOString(),
          parameters: report.parameters
        },
        data: content.data,
        recordCount: content.recordCount
      };

      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error('Error generating JSON file:', error);
      throw error;
    }
  }

  /**
   * Generate HTML file
   */
  async generateHTMLFile(filePath, report, content) {
    try {
      let html = `
<!DOCTYPE html>
<html>
<head>
    <title>${report.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; }
        .meta { color: #666; margin-top: 5px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${report.name}</div>
        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
        ${report.description ? `<div class="meta">Description: ${report.description}</div>` : ''}
    </div>
`;

      if (Array.isArray(content.data) && content.data.length > 0) {
        html += '<table><thead><tr>';

        // Add headers
        const headers = Object.keys(content.data[0]);
        headers.forEach(header => {
          html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Add data rows
        content.data.forEach(item => {
          html += '<tr>';
          headers.forEach(header => {
            html += `<td>${item[header] || ''}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody></table>';
      } else {
        html += '<p>No data available</p>';
      }

      html += '</body></html>';

      await fs.writeFile(filePath, html);
    } catch (error) {
      console.error('Error generating HTML file:', error);
      throw error;
    }
  }

  /**
   * Send report notifications
   */
  async sendReportNotifications(report, userId) {
    try {
      // This would integrate with your notification system
      console.log('📧 Sending report notifications for:', report.name);

      // Example notification
      await notificationService.createNotification({
        userId: userId,
        title: 'Report Generated',
        message: `Your report "${report.name}" has been generated successfully.`,
        type: 'success',
        module: 'reports',
        eventType: 'report_generated',
        relatedId: report.id,
        relatedType: 'report',
        priority: 2,
        metadata: {
          reportName: report.name,
          reportType: report.type,
          fileSize: report.fileSize
        }
      });
    } catch (error) {
      console.error('Error sending report notifications:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  // ==================== MOCK DATA GENERATORS ====================

  /**
   * Generate dashboard report data
   */
  async generateDashboardReport(parameters) {
    // Mock implementation - replace with actual dashboard data
    return [
      { metric: 'Total Users', value: 1250, change: '+5.2%' },
      { metric: 'Active Sessions', value: 89, change: '-2.1%' },
      { metric: 'System Uptime', value: '99.9%', change: '+0.1%' }
    ];
  }

  /**
   * Generate metrics report data
   */
  async generateMetricsReport(parameters) {
    // Mock implementation - replace with actual metrics data
    return [
      { date: '2024-01-01', requests: 1500, errors: 12, response_time: 250 },
      { date: '2024-01-02', requests: 1650, errors: 8, response_time: 230 },
      { date: '2024-01-03', requests: 1400, errors: 15, response_time: 280 }
    ];
  }

  /**
   * Generate analytics report data
   */
  async generateAnalyticsReport(parameters) {
    // Mock implementation - replace with actual analytics data
    return [
      { category: 'Page Views', count: 25000, percentage: 45.5 },
      { category: 'User Sessions', count: 8500, percentage: 15.4 },
      { category: 'API Calls', count: 12000, percentage: 21.8 }
    ];
  }

  /**
   * Generate compliance report data
   */
  async generateComplianceReport(parameters) {
    // Mock implementation - replace with actual compliance data
    return [
      { control: 'Access Control', status: 'Compliant', last_review: '2024-01-15' },
      { control: 'Data Encryption', status: 'Compliant', last_review: '2024-01-10' },
      { control: 'Audit Logging', status: 'Non-Compliant', last_review: '2024-01-05' }
    ];
  }

  /**
   * Generate audit report data
   */
  async generateAuditReport(parameters) {
    // Mock implementation - replace with actual audit data
    return [
      { timestamp: '2024-01-15T10:30:00Z', user: 'admin@example.com', action: 'User Created', resource: 'users/123' },
      { timestamp: '2024-01-15T10:25:00Z', user: 'user@example.com', action: 'Login', resource: 'auth/login' },
      { timestamp: '2024-01-15T10:20:00Z', user: 'admin@example.com', action: 'Policy Updated', resource: 'policies/456' }
    ];
  }

  /**
   * Generate security report data
   */
  async generateSecurityReport(parameters) {
    // Mock implementation - replace with actual security data
    return [
      { threat_type: 'Malware', count: 5, severity: 'High', status: 'Mitigated' },
      { threat_type: 'Phishing', count: 12, severity: 'Medium', status: 'Investigating' },
      { threat_type: 'Brute Force', count: 3, severity: 'Low', status: 'Blocked' }
    ];
  }

  /**
   * Generate asset report data
   */
  async generateAssetReport(parameters) {
    // Mock implementation - replace with actual asset data
    return [
      { asset_name: 'Server-01', type: 'Server', status: 'Active', last_scan: '2024-01-15' },
      { asset_name: 'Workstation-05', type: 'Workstation', status: 'Active', last_scan: '2024-01-14' },
      { asset_name: 'Router-Main', type: 'Network', status: 'Maintenance', last_scan: '2024-01-13' }
    ];
  }

  /**
   * Generate vulnerability report data
   */
  async generateVulnerabilityReport(parameters) {
    // Mock implementation - replace with actual vulnerability data
    return [
      { cve_id: 'CVE-2024-0001', severity: 'Critical', asset: 'Server-01', status: 'Open' },
      { cve_id: 'CVE-2024-0002', severity: 'High', asset: 'Workstation-05', status: 'Patched' },
      { cve_id: 'CVE-2024-0003', severity: 'Medium', asset: 'Router-Main', status: 'Mitigated' }
    ];
  }

  /**
   * Generate user activity report data
   */
  async generateUserActivityReport(parameters) {
    // Mock implementation - replace with actual user activity data
    return [
      { user: 'admin@example.com', login_count: 25, last_login: '2024-01-15T09:30:00Z', actions: 150 },
      { user: 'user1@example.com', login_count: 18, last_login: '2024-01-15T08:45:00Z', actions: 89 },
      { user: 'user2@example.com', login_count: 12, last_login: '2024-01-14T16:20:00Z', actions: 67 }
    ];
  }

  /**
   * Generate system performance report data
   */
  async generateSystemPerformanceReport(parameters) {
    // Mock implementation - replace with actual performance data
    return [
      { timestamp: '2024-01-15T10:00:00Z', cpu_usage: 45.2, memory_usage: 67.8, disk_usage: 23.4 },
      { timestamp: '2024-01-15T09:00:00Z', cpu_usage: 52.1, memory_usage: 71.2, disk_usage: 23.4 },
      { timestamp: '2024-01-15T08:00:00Z', cpu_usage: 38.9, memory_usage: 64.5, disk_usage: 23.3 }
    ];
  }

  /**
   * Generate custom report data
   */
  async generateCustomReport(reportType, parameters) {
    // Mock implementation for custom reports
    return [
      { message: `Custom report data for type: ${reportType}`, parameters: parameters }
    ];
  }
}

module.exports = new ReportService();
