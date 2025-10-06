/**
 * Database Configuration
 * 
 * MongoDB Cloud connection with native MongoDB driver
 */

const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Connect to MongoDB Cloud
 * @returns {Promise<Object>} Database connection
 */
async function connectDB() {
  try {
    if (db) {
      return db;
    }

    // Use your MongoDB Cloud URL from environment
    const mongoUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGODB_CLOUD_URL;
    
    if (!mongoUrl) {
      throw new Error('DATABASE_URL, MONGODB_URI or MONGODB_CLOUD_URL environment variable is required');
    }
    
    client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    await client.connect();
    db = client.db();
    
    console.log('✓ Connected to MongoDB Cloud');
    console.log(`✓ Database: ${db.databaseName}`);
    return db;
    
  } catch (error) {
    console.error('✗ MongoDB Cloud connection failed:', error);
    throw error;
  }
}

/**
 * Get database instance
 * @returns {Object} Database instance
 */
function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

/**
 * Get collection
 * @param {string} collectionName - Name of collection
 * @returns {Object} Collection instance
 */
function getCollection(collectionName) {
  const database = getDB();
  return database.collection(collectionName);
}

/**
 * Close database connection
 */
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB Cloud connection closed');
  }
}

/**
 * Health check for database
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    if (!db) {
      return {
        status: 'disconnected',
        message: 'Database not connected'
      };
    }

    await db.admin().ping();
    return {
      status: 'healthy',
      message: 'MongoDB Cloud connection is healthy',
      database: db.databaseName
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

module.exports = {
  connectDB,
  getDB,
  getCollection,
  closeDB,
  healthCheck
};