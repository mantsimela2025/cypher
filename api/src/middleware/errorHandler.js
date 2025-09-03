const config = require('../config');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error safely (avoid circular references)
  console.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    name: err.name,
    code: err.code,
    stack: err.stack
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    const message = 'Database connection failed';
    error = { message, statusCode: 500 };
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique constraint violation
    const message = 'Duplicate entry';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23503') { // Foreign key constraint violation
    const message = 'Referenced record does not exist';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23502') { // Not null constraint violation
    const message = 'Required field is missing';
    error = { message, statusCode: 400 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    ...(config.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
