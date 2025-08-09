/**
 * API Caching Utility for Performance Optimization
 * 
 * Features:
 * - In-memory caching with TTL (Time To Live)
 * - Request deduplication
 * - Cache invalidation
 * - Storage size limits
 * - Performance metrics
 */

class APICache {
  constructor(options = {}) {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.metrics = {
      hits: 0,
      misses: 0,
      requests: 0,
    };
  }

  /**
   * Generate cache key from URL and options
   */
  generateKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    const params = new URLSearchParams(options.params || {}).toString();
    return `${method}:${url}:${params}:${body}`;
  }

  /**
   * Check if cache entry is still valid
   */
  isValid(entry) {
    return Date.now() < entry.expiry;
  }

  /**
   * Get cached response
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return entry.data;
  }

  /**
   * Set cached response
   */
  set(key, data, ttl = this.defaultTTL) {
    // Enforce size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const entry = {
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear specific cache entry
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    return {
      size: this.cache.size,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0,
      totalRequests,
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
}

// Global cache instance
const apiCache = new APICache({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
});

/**
 * Enhanced fetch with caching and request deduplication
 */
export const cachedFetch = async (url, options = {}) => {
  const cacheKey = apiCache.generateKey(url, options);
  
  // Check cache first
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse) {
    return Promise.resolve(cachedResponse);
  }

  // Check for pending request
  if (apiCache.pendingRequests.has(cacheKey)) {
    return apiCache.pendingRequests.get(cacheKey);
  }

  // Create new request
  const request = fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Cache successful responses
      if (response.status === 200 && options.method !== 'POST') {
        const ttl = options.cacheTTL || apiCache.defaultTTL;
        apiCache.set(cacheKey, data, ttl);
      }
      
      return data;
    })
    .catch((error) => {
      console.error('API request failed:', error);
      throw error;
    })
    .finally(() => {
      apiCache.pendingRequests.delete(cacheKey);
      apiCache.metrics.requests++;
    });

  // Store pending request
  apiCache.pendingRequests.set(cacheKey, request);
  
  return request;
};

/**
 * Cached API request utility
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1';
  const url = `${baseURL}${endpoint}`;
  
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Authorization': token ? `Bearer ${token}` : undefined,
    ...options.headers,
  };

  return cachedFetch(url, {
    ...options,
    headers: Object.fromEntries(
      Object.entries(headers).filter(([_, value]) => value !== undefined)
    ),
  });
};

/**
 * Cache management utilities
 */
export const cacheUtils = {
  clear: () => apiCache.clear(),
  cleanup: () => apiCache.cleanup(),
  stats: () => apiCache.getStats(),
  invalidate: (pattern) => apiCache.invalidatePattern(pattern),
  
  // Invalidate specific resource caches
  invalidateResource: (resource) => {
    return apiCache.invalidatePattern(`GET:.*/${resource}`);
  },
  
  // Invalidate user-specific caches on logout
  invalidateUserData: () => {
    const patterns = ['user', 'profile', 'dashboard', 'notifications'];
    let totalInvalidated = 0;
    patterns.forEach(pattern => {
      totalInvalidated += apiCache.invalidatePattern(pattern);
    });
    return totalInvalidated;
  },
};

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000);

export default apiCache;