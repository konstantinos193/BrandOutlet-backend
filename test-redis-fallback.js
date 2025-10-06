/**
 * Test Redis fallback functionality
 */

const { connectRedis } = require('./config/redis');

async function testRedisFallback() {
  console.log('🧪 Testing Redis fallback functionality...\n');

  try {
    // Test Redis connection
    const redisClient = await connectRedis();
    
    if (redisClient && redisClient.isFallback) {
      console.log('✅ Fallback mode working correctly');
      console.log('📝 Redis client is in fallback mode');
    } else if (redisClient) {
      console.log('✅ Redis connection successful');
      console.log('📝 Redis client is connected');
    } else {
      console.log('❌ Redis client is null');
    }

    // Test cache functionality
    console.log('\n🧪 Testing cache functionality...');
    
    const testData = { message: 'Test data', timestamp: new Date().toISOString() };
    
    const result = await redisClient.cache('test-key', async () => {
      console.log('📦 Fetching data (cache miss)');
      return testData;
    }, 60);
    
    console.log('📊 Cache test result:', result);
    
    // Test health check
    console.log('\n🧪 Testing health check...');
    const { healthCheck } = require('./config/redis');
    const health = await healthCheck();
    console.log('📊 Health status:', health);

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRedisFallback();
