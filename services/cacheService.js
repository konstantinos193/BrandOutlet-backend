/**
 * Cache service for API queries with Redis
 */

const redisClient = require('../config/redis');
const crypto = require('crypto');

class CacheService {
  constructor() {
    this.defaultTTL = {
      products: 300,        // 5 minutes
      analytics: 600,       // 10 minutes
      search: 300,          // 5 minutes
      userPreferences: 1800, // 30 minutes
      admin: 60,            // 1 minute
      facets: 3600,         // 1 hour
    };
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const paramString = JSON.stringify(sortedParams);
    const hash = crypto.createHash('md5').update(paramString).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Cache products query
   */
  async cacheProducts(params, fetchFunction) {
    const key = this.generateKey('products', params);
    return await redisClient.cache(key, fetchFunction, this.defaultTTL.products);
  }

  /**
   * Cache analytics data
   */
  async cacheAnalytics(params, fetchFunction) {
    const key = this.generateKey('analytics', params);
    return await redisClient.cache(key, fetchFunction, this.defaultTTL.analytics);
  }

  /**
   * Cache search results
   */
  async cacheSearch(params, fetchFunction) {
    const key = this.generateKey('search', params);
    return await redisClient.cache(key, fetchFunction, this.defaultTTL.search);
  }

  /**
   * Cache user preferences
   */
  async cacheUserPreferences(userId, fetchFunction) {
    const key = this.generateKey('user-preferences', { userId });
    return await redisClient.cache(key, fetchFunction, this.defaultTTL.userPreferences);
  }

  /**
   * Cache admin dashboard data
   */
  async cacheAdminDashboard(params, fetchFunction) {
    const key = this.generateKey('admin-dashboard', params);
    return await redisClient.cache(key, fetchFunction, this.defaultTTL.admin);
  }

  /**
   * Cache facets data
   */
  async cacheFacets(params, fetchFunction) {
    const key = this.generateKey('facets', params);
    return await redisClient.cache(key, fetchFunction, this.defaultTTL.facets);
  }

  /**
   * Cache with custom TTL
   */
  async cacheWithTTL(key, fetchFunction, ttl) {
    return await redisClient.cache(key, fetchFunction, ttl);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern) {
    return await redisClient.invalidatePattern(pattern);
  }

  /**
   * Invalidate products cache
   */
  async invalidateProducts() {
    return await this.invalidatePattern('products:*');
  }

  /**
   * Invalidate analytics cache
   */
  async invalidateAnalytics() {
    return await this.invalidatePattern('analytics:*');
  }

  /**
   * Invalidate search cache
   */
  async invalidateSearch() {
    return await this.invalidatePattern('search:*');
  }

  /**
   * Invalidate user preferences cache
   */
  async invalidateUserPreferences(userId) {
    return await this.invalidatePattern(`user-preferences:*${userId}*`);
  }

  /**
   * Invalidate admin cache
   */
  async invalidateAdmin() {
    return await this.invalidatePattern('admin:*');
  }

  /**
   * Invalidate all cache
   */
  async invalidateAll() {
    return await redisClient.flush();
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!redisClient.isConnected) {
      return {
        connected: false,
        message: 'Redis not connected'
      };
    }

    try {
      const info = await redisClient.client.info('memory');
      const keyspace = await redisClient.client.info('keyspace');
      
      return {
        connected: true,
        memory: info,
        keyspace: keyspace,
        uptime: await redisClient.client.info('server')
      };
    } catch (error) {
      return {
        connected: true,
        error: error.message
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return await redisClient.ping();
  }

  /**
   * Cache middleware for Express routes
   */
  cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
      const originalSend = res.send;
      const cacheKey = this.generateKey(req.path, req.query);

      // Try to get from cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache HIT: ${cacheKey}`);
        return res.json(cached);
      }

      // Override res.send to cache the response
      res.send = function(data) {
        // Cache the response
        redisClient.set(cacheKey, JSON.parse(data), ttl)
          .then(() => console.log(`📦 Cached: ${cacheKey}`))
          .catch(err => console.error('Cache error:', err));

        // Send original response
        originalSend.call(this, data);
      };

      next();
    };
  }
}

module.exports = new CacheService();
