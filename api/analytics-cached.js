const express = require('express');
const router = express.Router();

// Try to load cache service, fallback if Redis is not available
let cacheService;
let analyticsService;

try {
  cacheService = require('../services/cacheService');
  analyticsService = require('../services/analyticsService');
} catch (error) {
  console.warn('⚠️ Cache service not available, using fallback:', error.message);
  // Fallback cache service
  cacheService = {
    cacheAnalytics: async (params, fetchFunction) => {
      return await fetchFunction();
    }
  };
  analyticsService = {
    getDashboardMetrics: async () => ({ message: 'Analytics service not available' }),
    getPerformanceTrends: async () => ({ message: 'Analytics service not available' }),
    getRevenueAnalytics: async () => ({ message: 'Analytics service not available' }),
    getUserAnalytics: async () => ({ message: 'Analytics service not available' }),
    getProductAnalytics: async () => ({ message: 'Analytics service not available' })
  };
}

// GET /api/analytics/dashboard - Get dashboard analytics with caching
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard analytics with caching');

    const result = await cacheService.cacheAnalytics({ type: 'dashboard' }, async () => {
      console.log('📦 Cache MISS - Fetching analytics from database');
      return await analyticsService.getDashboardMetrics();
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/performance - Get performance analytics with caching
router.get('/performance', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    console.log(`📈 Fetching performance analytics for ${days} days with caching`);

    const result = await cacheService.cacheAnalytics({ 
      type: 'performance', 
      days: parseInt(days) 
    }, async () => {
      console.log('📦 Cache MISS - Fetching performance analytics from database');
      return await analyticsService.getPerformanceTrends(parseInt(days));
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/revenue - Get revenue analytics with caching
router.get('/revenue', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    console.log(`💰 Fetching revenue analytics for ${period} with caching`);

    const result = await cacheService.cacheAnalytics({ 
      type: 'revenue', 
      period 
    }, async () => {
      console.log('📦 Cache MISS - Fetching revenue analytics from database');
      return await analyticsService.getRevenueAnalytics(period);
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/users - Get user analytics with caching
router.get('/users', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    console.log(`👥 Fetching user analytics for ${period} with caching`);

    const result = await cacheService.cacheAnalytics({ 
      type: 'users', 
      period 
    }, async () => {
      console.log('📦 Cache MISS - Fetching user analytics from database');
      return await analyticsService.getUserAnalytics(period);
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/products - Get product analytics with caching
router.get('/products', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    console.log(`🛍️ Fetching product analytics for ${period} with caching`);

    const result = await cacheService.cacheAnalytics({ 
      type: 'products', 
      period 
    }, async () => {
      console.log('📦 Cache MISS - Fetching product analytics from database');
      return await analyticsService.getProductAnalytics(period);
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product analytics',
      message: error.message
    });
  }
});

// Cache invalidation endpoints
router.post('/invalidate-cache', async (req, res) => {
  try {
    console.log('🗑️ Invalidating analytics cache');
    
    await cacheService.invalidateAnalytics();
    
    res.json({
      success: true,
      message: 'Analytics cache invalidated successfully'
    });
  } catch (error) {
    console.error('Error invalidating analytics cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate analytics cache',
      message: error.message
    });
  }
});

// Cache statistics endpoint
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics',
      message: error.message
    });
  }
});

// Analytics tracking endpoints
const { connectDB } = require('../config/database');

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
  return db;
};

// POST /api/analytics/track - Track analytics events
router.post('/track', async (req, res) => {
  try {
    const event = req.body;
    
    // Validate required fields
    if (!event.eventName || !event.timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventName, timestamp'
      });
    }

    // Add metadata
    const trackedEvent = {
      ...event,
      id: Date.now() + Math.random(),
      receivedAt: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      createdAt: new Date()
    };

    // Store event in MongoDB
    const database = await initializeDB();
    const analyticsCollection = database.collection('analyticsEvents');
    await analyticsCollection.insertOne(trackedEvent);

    console.log(`📊 Analytics event tracked: ${event.eventName}`);

    res.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: trackedEvent.id
    });

  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: error.message
    });
  }
});

// POST /api/analytics/performance - Track performance metrics
router.post('/performance', async (req, res) => {
  try {
    const metrics = req.body;
    
    // Validate required fields
    if (!metrics.timestamp || !metrics.url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: timestamp, url'
      });
    }

    // Add metadata
    const performanceEvent = {
      ...metrics,
      id: Date.now() + Math.random(),
      receivedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    // Store performance metrics in MongoDB
    const database = await initializeDB();
    const analyticsCollection = database.collection('analyticsEvents');
    await analyticsCollection.insertOne({
      eventName: 'performance_metrics',
      eventData: performanceEvent,
      timestamp: performanceEvent.timestamp,
      receivedAt: performanceEvent.receivedAt,
      createdAt: new Date()
    });

    console.log(`📈 Performance metrics tracked for ${metrics.url}`);

    res.json({
      success: true,
      message: 'Performance metrics tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track performance metrics',
      message: error.message
    });
  }
});

// POST /api/analytics/performance-alert - Track performance alerts
router.post('/performance-alert', async (req, res) => {
  try {
    const alert = req.body;
    
    // Validate required fields
    if (!alert.metric || !alert.value || !alert.threshold) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: metric, value, threshold'
      });
    }

    // Add metadata
    const alertEvent = {
      ...alert,
      id: Date.now() + Math.random(),
      receivedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    // Store performance alert in MongoDB
    const database = await initializeDB();
    const analyticsCollection = database.collection('analyticsEvents');
    await analyticsCollection.insertOne({
      eventName: 'performance_alert',
      eventData: alertEvent,
      timestamp: alertEvent.timestamp || new Date(),
      receivedAt: alertEvent.receivedAt,
      createdAt: new Date()
    });

    console.log(`⚠️ Performance alert tracked: ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`);

    res.json({
      success: true,
      message: 'Performance alert tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking performance alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track performance alert',
      message: error.message
    });
  }
});

module.exports = router;
