/**
 * Redis Configuration
 * 
 * Redis client setup and configuration
 */

const redis = require('redis');

let client = null;

/**
 * Create Redis client
 * @returns {Object} Redis client
 */
function createRedisClient() {
  if (client) {
    return client;
  }

  // Check if Redis is available in the environment
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_CLOUD_URL;
  
  // If no Redis URL is provided, return null to use fallback mode
  if (!redisUrl) {
    console.log('⚠️ No Redis URL provided, using fallback mode');
    return null;
  }

  console.log('🔗 Attempting to connect to Redis:', redisUrl.replace(/\/\/.*@/, '//***@')); // Hide credentials in logs
  
  client = redis.createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000, // 5 second timeout
      lazyConnect: true, // Don't connect immediately
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.error('Redis max retry attempts reached');
          return new Error('Redis max retry attempts reached');
        }
        return Math.min(retries * 100, 1000);
      }
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✓ Connected to Redis');
  });

  client.on('ready', () => {
    console.log('✓ Redis client ready');
  });

  client.on('end', () => {
    console.log('Redis connection ended');
  });

  // Add cache method to the client
  client.cache = async (key, fetchFunction, ttl = 300) => {
    try {
      // Try to get from cache first
      const cached = await client.get(key);
      if (cached) {
        console.log(`📦 Cache HIT for key: ${key}`);
        return JSON.parse(cached);
      }

      // Cache miss - fetch data
      console.log(`📦 Cache MISS for key: ${key}`);
      const data = await fetchFunction();
      
      // Store in cache
      await client.set(key, JSON.stringify(data));
      if (ttl > 0) {
        await client.expire(key, ttl);
      }
      
      return data;
    } catch (error) {
      console.error('Cache error:', error);
      // Fallback to direct fetch
      return await fetchFunction();
    }
  };

  // Add invalidatePattern method
  client.invalidatePattern = async (pattern) => {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        return await client.del(keys);
      }
      return 0;
    } catch (error) {
      console.error('Error invalidating pattern:', error);
      return 0;
    }
  };

  // Add flush method
  client.flush = async () => {
    try {
      return await client.flushAll();
    } catch (error) {
      console.error('Error flushing cache:', error);
      return 'ERROR';
    }
  };

  // Add isConnected property
  Object.defineProperty(client, 'isConnected', {
    get: function() {
      return this.isOpen;
    }
  });

  return client;
}

/**
 * Get Redis client
 * @returns {Object} Redis client or null
 */
function getRedisClient() {
  if (!client) {
    return createRedisClient();
  }
  return client;
}

/**
 * Connect to Redis
 * @returns {Promise<Object>} Redis client or fallback client
 */
async function connectRedis() {
  try {
    const redisClient = getRedisClient();
    
    // If no Redis client available, use fallback
    if (!redisClient) {
      console.log('⚠️ Redis not available, using fallback mode');
      return createFallbackClient();
    }
    
    // Check if already connected
    if (redisClient.isOpen) {
      console.log('✓ Redis already connected');
      return redisClient;
    }
    
    await redisClient.connect();
    console.log('✓ Redis connected successfully');
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    console.log('⚠️ Using fallback Redis client');
    return createFallbackClient();
  }
}

/**
 * Create a fallback Redis client for when Redis is not available
 * @returns {Object} Mock Redis client
 */
function createFallbackClient() {
  return {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
    del: () => Promise.resolve(1),
    exists: () => Promise.resolve(0),
    expire: () => Promise.resolve(1),
    disconnect: () => Promise.resolve(),
    isOpen: true,
    ping: () => Promise.resolve('PONG'),
    isFallback: true,
    cache: async (key, fetchFunction, ttl) => {
      // In fallback mode, just execute the function without caching
      console.log(`⚠️ Cache fallback for key: ${key}`);
      return await fetchFunction();
    },
    invalidatePattern: async (pattern) => {
      console.log(`⚠️ Cache fallback - invalidatePattern: ${pattern}`);
      return 0;
    },
    flush: async () => {
      console.log('⚠️ Cache fallback - flush');
      return 'OK';
    },
    keys: async (pattern) => {
      console.log(`⚠️ Cache fallback - keys: ${pattern}`);
      return [];
    },
    flushAll: async () => {
      console.log('⚠️ Cache fallback - flushAll');
      return 'OK';
    },
    info: async (section) => {
      console.log(`⚠️ Cache fallback - info: ${section}`);
      return 'fallback mode';
    }
  };
}

/**
 * Health check for Redis
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    if (!client) {
      return {
        status: 'fallback',
        message: 'Redis not available, using fallback mode'
      };
    }

    await client.ping();
    return {
      status: 'healthy',
      message: 'Redis connection is healthy'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

module.exports = {
  createRedisClient,
  getRedisClient,
  connectRedis,
  healthCheck
};