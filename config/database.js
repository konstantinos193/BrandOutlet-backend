// Database configuration for MongoDB Atlas
const { MongoClient, ServerApiVersion } = require('mongodb');

let client = null;
let db = null;

const connectDB = async () => {
  try {
    if (client) {
      return { client, db };
    }

    const uri = process.env.DATABASE_URL;
    if (!uri) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Changed to false to allow distinct command
        deprecationErrors: true,
      }
    });

    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    
    // Get the database instance
    db = client.db(process.env.DATABASE_NAME || 'resellapi');
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📊 Database: ${db.databaseName}`);
    
    return { client, db };
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

const getClient = () => {
  if (!client) {
    throw new Error('MongoDB client not connected. Call connectDB() first.');
  }
  return client;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 MongoDB connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  getClient,
  closeDB
};
