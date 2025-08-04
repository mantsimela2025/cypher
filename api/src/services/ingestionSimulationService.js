const { db } = require('../db');
const { ingestionJobs } = require('../db/schema/ingestionSchema');
const { eq } = require('drizzle-orm');

class IngestionSimulationService {
  async getAllJobs(filters = {}, options = {}) {
    try {
      const query = db.select().from(ingestionJobs);

      if (filters.sourceSystem) {
        query.where(eq(ingestionJobs.sourceSystem, filters.sourceSystem));
      }

      // Add pagination
      if (options.limit) {
        query.limit(options.limit);
      }
      if (options.offset) {
        query.offset(options.offset);
      }

      const jobs = await query.execute();
      return { success: true, data: jobs };
    } catch (error) {
      console.error('Error fetching ingestion jobs:', error);
      return { success: false, message: error.message };
    }
  }

  async getJobById(id) {
    try {
      const job = await db.select().from(ingestionJobs).where(eq(ingestionJobs.id, id)).execute();
      if (job.length === 0) {
        return { success: false, message: 'Job not found' };
      }
      return { success: true, data: job[0] };
    } catch (error) {
      console.error('Error fetching ingestion job by id:', error);
      return { success: false, message: error.message };
    }
  }

  async createJob(data) {
    try {
      const result = await db.insert(ingestionJobs).values(data).returning();
      return { success: true, data: result[0], message: 'Job created successfully' };
    } catch (error) {
      console.error('Error creating ingestion job:', error);
      return { success: false, message: error.message };
    }
  }

  async updateJob(id, data) {
    try {
      const result = await db.update(ingestionJobs).set(data).where(eq(ingestionJobs.id, id)).returning();
      if (result.length === 0) {
        return { success: false, message: 'Job not found' };
      }
      return { success: true, data: result[0], message: 'Job updated successfully' };
    } catch (error) {
      console.error('Error updating ingestion job:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteJob(id) {
    try {
      const result = await db.delete(ingestionJobs).where(eq(ingestionJobs.id, id)).returning();
      if (result.length === 0) {
        return { success: false, message: 'Job not found' };
      }
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      console.error('Error deleting ingestion job:', error);
      return { success: false, message: error.message };
    }
  }

  async simulateRenewedScan(id) {
    try {
      // Simulate updating existing data for a renewed scan
      const job = await this.getJobById(id);
      if (!job.success) {
        return job;
      }

      // Update job with new simulated data (e.g., updated timestamp, status)
      const updatedData = {
        lastScanDate: new Date(),
        status: 'updated',
      };

      return await this.updateJob(id, updatedData);
    } catch (error) {
      console.error('Error simulating renewed scan:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new IngestionSimulationService();
