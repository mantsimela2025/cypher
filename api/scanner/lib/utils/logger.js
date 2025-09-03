// Simple console-based logger to replace winston dependency
const chalk = {
  red: { bold: (text) => `\x1b[31m\x1b[1m${text}\x1b[0m` },
  yellow: { bold: (text) => `\x1b[33m\x1b[1m${text}\x1b[0m` },
  blue: { bold: (text) => `\x1b[34m\x1b[1m${text}\x1b[0m` },
  green: { bold: (text) => `\x1b[32m\x1b[1m${text}\x1b[0m` },
  white: { bold: (text) => `\x1b[37m\x1b[1m${text}\x1b[0m` },
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

const formatLog = (level, message) => {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
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
};

// Create logger with same interface as winston
const logger = {
  level: process.env.LOG_LEVEL || 'info',
  info: (message) => console.log(formatLog('info', message)),
  warn: (message) => console.warn(formatLog('warn', message)),
  error: (message) => console.error(formatLog('error', message)),
  debug: (message) => {
    if (logger.level === 'debug') {
      console.log(formatLog('debug', message));
    }
  }
};

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
