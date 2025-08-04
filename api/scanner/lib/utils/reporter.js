const fs = require('fs').promises;
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const logger = require('./logger');
const { formatResults } = require('./comprehensive-formatter');

/**
 * Reporter class to handle scan result outputs in different formats
 */
class Reporter {
  /**
   * Formats and writes scan results to a file
   * @param {Array|Object} results - The scan results to output
   * @param {Object} options - Output options
   * @param {string} options.filename - Output filename (optional)
   * @param {string} options.format - Output format (json or csv)
   * @param {string} options.scanType - Type of scan performed
   * @param {boolean} options.comprehensive - Whether to use comprehensive format (default: false)
   * @param {string} options.scanTitle - Title of the scan for comprehensive format
   * @param {Array} options.targetHosts - Target hosts for comprehensive format
   * @param {Array} options.excludedHosts - Excluded hosts for comprehensive format
   * @returns {Promise<string>} - Path to the output file or stringified results
   */
  async writeResults(results, options = {}) {
    const { 
      filename, 
      format = 'json', 
      scanType, 
      comprehensive = false,
      scanTitle,
      targetHosts,
      excludedHosts
    } = options;
    
    // Format results if comprehensive format is requested
    const formattedResults = comprehensive ? formatResults(results, {
      scanType,
      scanTitle,
      targetHosts,
      excludedHosts
    }) : results;
    
    // Return stringified results if no filename provided
    if (!filename) {
      return format === 'json' 
        ? JSON.stringify(formattedResults, null, 2) 
        : this.convertToCsvString(formattedResults);
    }

    try {
      // Ensure the directory exists
      const dir = path.dirname(filename);
      await fs.mkdir(dir, { recursive: true });
      
      if (format.toLowerCase() === 'json') {
        await fs.writeFile(filename, JSON.stringify(formattedResults, null, 2), 'utf8');
      } else if (format.toLowerCase() === 'csv') {
        await this.writeCsvFile(formattedResults, filename);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
      
      logger.info(`Scan results saved to ${filename}`);
      return filename;
    } catch (error) {
      logger.error(`Failed to write results to ${filename}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Converts results to CSV format and writes to file
   * @param {Array|Object} results - Scan results to convert
   * @param {string} filename - Output filename
   * @returns {Promise<void>}
   */
  async writeCsvFile(results, filename) {
    // Convert object to array if needed
    const dataArray = Array.isArray(results) ? results : [results];
    
    // Get all possible headers from all objects
    const headers = new Set();
    dataArray.forEach(item => {
      Object.keys(item).forEach(key => headers.add(key));
    });
    
    // Create CSV writer with dynamic headers
    const csvWriter = createObjectCsvWriter({
      path: filename,
      header: Array.from(headers).map(id => ({ id, title: id }))
    });
    
    await csvWriter.writeRecords(dataArray);
  }

  /**
   * Converts results to a CSV string
   * @param {Array|Object} results - Results to convert
   * @returns {string} - CSV string representation
   */
  convertToCsvString(results) {
    // Convert to array if object
    const dataArray = Array.isArray(results) ? results : [results];
    
    if (dataArray.length === 0) {
      return 'No data';
    }

    // Get all unique headers
    const headers = new Set();
    dataArray.forEach(item => {
      Object.keys(item).forEach(key => headers.add(key));
    });
    
    const headerRow = Array.from(headers).join(',');
    const dataRows = dataArray.map(row => {
      return Array.from(headers)
        .map(header => {
          const value = row[header] === undefined ? '' : row[header];
          // Escape values with quotes if they contain commas or quotes
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',');
    });
    
    return [headerRow, ...dataRows].join('\n');
  }
}

module.exports = new Reporter();
