#!/usr/bin/env node

/**
 * Redis setup and configuration script
 * This script helps set up Redis for the caching implementation
 */

const redis = require('redis');

async function setupRedis() {
  console.log('🔧 Setting up Redis for caching...');
  
  try {
    // Create Redis client
    const client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
    });

    // Connect to Redis
    await client.connect();
    console.log('✅ Connected to Redis');

    // Test basic operations
    await client.set('test:connection', 'success');
    const testValue = await client.get('test:connection');
    console.log('✅ Basic operations test:', testValue);

    // Clean up test key
    await client.del('test:connection');

    // Set up cache configuration
    console.log('📦 Configuring cache settings...');
    
    // Set default TTL for different cache types
    const cacheConfig = {
      'config:ttl:products': 300,        // 5 minutes
      'config:ttl:analytics': 600,       // 10 minutes
      'config:ttl:search': 300,          // 5 minutes
      'config:ttl:user-preferences': 1800, // 30 minutes
      'config:ttl:admin': 60,            // 1 minute
      'config:ttl:facets': 3600,         // 1 hour
    };

    for (const [key, ttl] of Object.entries(cacheConfig)) {
      await client.set(key, ttl.toString());
      console.log(`✅ Set ${key} = ${ttl} seconds`);
    }

    // Set up cache statistics
    await client.set('stats:hits', '0');
    await client.set('stats:misses', '0');
    console.log('✅ Initialized cache statistics');

    // Test cache operations
    console.log('🧪 Testing cache operations...');
    
    // Test cache set/get
    const testData = { message: 'Hello Redis!', timestamp: new Date().toISOString() };
    await client.setEx('test:data', 60, JSON.stringify(testData));
    
    const retrievedData = await client.get('test:data');
    const parsedData = JSON.parse(retrievedData);
    console.log('✅ Cache set/get test:', parsedData.message);

    // Test cache expiration
    console.log('⏰ Testing cache expiration...');
    await client.setEx('test:expire', 2, 'expires in 2 seconds');
    
    setTimeout(async () => {
      const expiredValue = await client.get('test:expire');
      console.log('✅ Cache expiration test:', expiredValue === null ? 'EXPIRED' : 'STILL EXISTS');
    }, 3000);

    // Clean up test keys
    setTimeout(async () => {
      await client.del('test:data');
      console.log('🧹 Cleaned up test keys');
    }, 5000);

    // Get Redis info
    const info = await client.info('memory');
    console.log('📊 Redis Memory Info:');
    console.log(info);

    // Close connection
    await client.quit();
    console.log('✅ Redis setup completed successfully!');
    
    console.log('\n📋 Next steps:');
    console.log('1. Start your Redis server: redis-server');
    console.log('2. Set environment variables in .env:');
    console.log('   REDIS_HOST=localhost');
    console.log('   REDIS_PORT=6379');
    console.log('   REDIS_PASSWORD=your_password (optional)');
    console.log('   REDIS_DB=0');
    console.log('3. Start your application: npm start');

  } catch (error) {
    console.error('❌ Redis setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Redis is installed and running');
    console.log('2. Check Redis connection settings');
    console.log('3. Verify Redis server is accessible');
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupRedis();
}

module.exports = setupRedis;
