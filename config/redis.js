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

  const redisUrl = process.env.REDIS_URL || process.env.REDIS_CLOUD_URL || 'redis://localhost:6379';
  
  client = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis max retry attempts reached');
          return new Error('Redis max retry attempts reached');
        }
        return Math.min(retries * 100, 3000);
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

  return client;
}

/**
 * Get Redis client
 * @returns {Object} Redis client
 */
function getRedisClient() {
  if (!client) {
    return createRedisClient();
  }
  return client;
}

/**
 * Connect to Redis
 * @returns {Promise<Object>} Redis client
 */
async function connectRedis() {
  try {
    const redisClient = getRedisClient();
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    // Return a mock client for development
    return {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve('OK'),
      del: () => Promise.resolve(1),
      exists: () => Promise.resolve(0),
      expire: () => Promise.resolve(1),
      disconnect: () => Promise.resolve()
    };
  }
}

/**
 * Health check for Redis
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    if (!client) {
      return {
        status: 'disconnected',
        message: 'Redis not connected'
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