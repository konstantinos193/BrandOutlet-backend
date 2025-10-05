const express = require('express');
const router = express.Router();
const realTimeService = require('../services/realTimeService');

// GET /api/real-time/metrics - Get real-time dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await realTimeService.generateRealTimeMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get real-time metrics',
      message: error.message
    });
  }
});

// GET /api/real-time/activity - Get live activity feed
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await realTimeService.getLiveActivityFeed(limit);
    
    res.json({
      success: true,
      data: activities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting live activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get live activity',
      message: error.message
    });
  }
});

// GET /api/real-time/performance - Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const metrics = await realTimeService.getPerformanceMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

// GET /api/real-time/cache-stats - Get cache statistics
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = realTimeService.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

// POST /api/real-time/clear-cache - Clear cache
router.post('/clear-cache', async (req, res) => {
  try {
    realTimeService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

module.exports = router;
