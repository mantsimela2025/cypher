const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate random number between min and max
const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password with hash
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Format date to ISO string
const formatDate = (date) => {
  return new Date(date).toISOString();
};

// Get current timestamp
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

// Capitalize first letter of string
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert string to slug (URL-friendly)
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with -
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Remove sensitive fields from object
const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Generate pagination metadata
const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};

// Delay execution (for testing or rate limiting)
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate OTP (One Time Password)
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

// Mask sensitive data (e.g., email, phone)
const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '*'.repeat(username.length - 2)
    : username;
  return `${maskedUsername}@${domain}`;
};

const maskPhone = (phone) => {
  if (phone.length < 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};

// Convert bytes to human readable format
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  hashPassword,
  comparePassword,
  formatDate,
  getCurrentTimestamp,
  capitalize,
  slugify,
  isValidEmail,
  isValidUrl,
  sanitizeUser,
  deepClone,
  isEmpty,
  getPaginationMeta,
  delay,
  generateOTP,
  maskEmail,
  maskPhone,
  formatBytes,
};
