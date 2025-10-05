const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');
const analyticsService = require('../services/analyticsService');

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

module.exports = router;
