const compression = require('compression');
const responseTime = require('response-time');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Create cache instance for API responses
const apiCache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance, but be careful with object mutations
});

/**
 * Compression middleware for responses
 */
const compressionMiddleware = compression({
  // Only compress if size is above threshold
  threshold: 1024, // 1KB
  // Compress specific content types
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  // Compression level (1-9, 6 is default)
  level: 6,
});

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

/**
 * Strict rate limiting for auth endpoints
 */
const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit auth requests to 50 per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Response time tracking middleware
 */
const responseTimeMiddleware = responseTime((req, res, time) => {
  // Log slow responses
  if (time > 1000) { // Log if response takes more than 1 second
    console.warn(`🐌 Slow response: ${req.method} ${req.url} took ${time.toFixed(2)}ms`);
  }
  
  // Add performance metrics header
  res.set('X-Response-Time', `${time.toFixed(2)}ms`);
});

/**
 * Cache middleware for GET requests
 */
const cacheMiddleware = (duration = 300) => { // Default 5 minutes
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for auth endpoints
    if (req.path.includes('/auth/')) {
      return next();
    }

    // Create cache key from URL and query params
    const cacheKey = `${req.originalUrl}`;
    
    try {
      // Check if we have cached response
      const cachedResponse = apiCache.get(cacheKey);
      
      if (cachedResponse) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-TTL', apiCache.getTtl(cacheKey) || 0);
        return res.json(cachedResponse);
      }

      // Store original res.json method
      const originalJson = res.json.bind(res);

      // Override res.json to cache successful responses
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode === 200) {
          apiCache.set(cacheKey, body, duration);
          res.set('X-Cache', 'MISS');
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation utility
 */
const invalidateCache = (pattern = null) => {
  try {
    if (pattern) {
      // Invalidate keys matching pattern
      const keys = apiCache.keys();
      const regex = new RegExp(pattern);
      let invalidatedCount = 0;

      keys.forEach(key => {
        if (regex.test(key)) {
          apiCache.del(key);
          invalidatedCount++;
        }
      });

      console.log(`🧹 Cache invalidation: ${invalidatedCount} entries removed matching pattern: ${pattern}`);
      return invalidatedCount;
    } else {
      // Clear all cache
      const keyCount = apiCache.keys().length;
      apiCache.flushAll();
      console.log(`🧹 Cache cleared: ${keyCount} entries removed`);
      return keyCount;
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
};

/**
 * Cache statistics
 */
const getCacheStats = () => {
  try {
    const stats = apiCache.getStats();
    return {
      keys: apiCache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
};

/**
 * Performance headers middleware
 */
const performanceHeaders = (req, res, next) => {
  // Security and performance headers
  res.set({
    'X-DNS-Prefetch-Control': 'off',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-XSS-Protection': '0',
    // Cache control for static assets
    ...(req.url.includes('/static/') && {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }),
    // API response cache headers
    ...(req.url.includes('/api/') && {
      'Cache-Control': 'private, max-age=0, no-cache, no-store, must-revalidate',
      'Expires': '0',
      'Pragma': 'no-cache'
    })
  });
  next();
};

/**
 * Request optimization middleware
 */
const requestOptimization = (req, res, next) => {
  // Add request ID for tracing
  req.id = require('crypto').randomUUID();
  res.set('X-Request-ID', req.id);
  
  // Log request start
  const startTime = Date.now();
  req.startTime = startTime;
  
  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = duration > 1000 ? 'warn' : 'info';
    console[logLevel](`📡 ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.id}`);
  });
  
  next();
};

module.exports = {
  compression: compressionMiddleware,
  rateLimit: rateLimitMiddleware,
  authRateLimit: authRateLimitMiddleware,
  responseTime: responseTimeMiddleware,
  cache: cacheMiddleware,
  invalidateCache,
  getCacheStats,
  performanceHeaders,
  requestOptimization,
  apiCache, // Export cache instance for direct access
};