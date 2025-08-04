const winston = require('winston');
const chalk = require('chalk');

// Define custom formats for console and file logging
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    // Color based on log level
    let coloredLevel;
    switch(level) {
      case 'error':
        coloredLevel = chalk.red.bold(level.toUpperCase());
        break;
      case 'warn':
        coloredLevel = chalk.yellow.bold(level.toUpperCase());
        break;
      case 'info':
        coloredLevel = chalk.blue.bold(level.toUpperCase());
        break;
      case 'debug':
        coloredLevel = chalk.green.bold(level.toUpperCase());
        break;
      default:
        coloredLevel = chalk.white.bold(level.toUpperCase());
    }
    
    return `[${chalk.gray(timestamp)}] ${coloredLevel}: ${message}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create logger with console and file transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info' if not specified
  transports: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: fileFormat
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: fileFormat
    })
  ]
});

// Add methods for scan-specific logging
logger.scan = {
  start: (scanType, target) => {
    logger.info(`Starting ${scanType} scan on ${target}`);
  },
  complete: (scanType, target, results) => {
    const count = Array.isArray(results) ? results.length : 
                 (typeof results === 'object' ? Object.keys(results).length : 'N/A');
    logger.info(`Completed ${scanType} scan on ${target}. Found ${count} results.`);
  },
  progress: (scanType, target, current, total, details = '') => {
    const percentage = Math.round((current / total) * 100);
    logger.debug(`${scanType} scan progress: ${percentage}% (${current}/${total}) ${details}`);
  }
};

module.exports = logger;
