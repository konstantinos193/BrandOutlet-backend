const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getDB } = require('../config/database');
const analyticsService = require('../services/analyticsService');
const aiInsightsService = require('../services/aiInsightsService');

// Helper function to get comprehensive dashboard data
const getDashboardData = async () => {
  try {
    const [
      metrics,
      recentActivity,
      pendingVerifications
    ] = await Promise.all([
      analyticsService.getDashboardMetrics(),
      analyticsService.getRecentActivity(10),
      getPendingVerifications()
    ]);

    return {
      metrics,
      recentActivity,
      pendingVerifications
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
};

// Helper function to get pending verifications
const getPendingVerifications = async () => {
  const pendingVerifications = await Product.findAll({
    'authenticity.isVerified': false,
    isActive: true
  });

  return pendingVerifications.map(product => ({
    id: product.id,
    productId: product.id,
    productName: product.name,
    brand: product.brand.name,
    price: product.price,
    seller: { username: 'admin' }, // Replace with real seller data
    images: product.images,
    submittedAt: product.createdAt.toISOString()
  }));
};

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Admin dashboard data requested');
    
    const dashboardData = await getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// PUT /api/admin/products/:id/verify
router.put('/products/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    console.log(`🔍 Product verification request: ${action} for product ${id}`);
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "approve" or "reject"'
      });
    }
    
    // Simulate verification processing
    setTimeout(() => {
      res.json({
        success: true,
        message: `Product ${id} ${action}d successfully`,
        data: {
          productId: id,
          action,
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'admin'
        }
      });
    }, 200);
  } catch (error) {
    console.error('Error updating product verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product verification',
      message: error.message
    });
  }
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    console.log('📈 Admin stats requested');
    
    res.json({
      success: true,
      data: mockDashboardData.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

// GET /api/admin/verifications
router.get('/verifications', async (req, res) => {
  try {
    console.log('🔍 Pending verifications requested');
    
    const pendingVerifications = await getPendingVerifications();
    
    res.json({
      success: true,
      data: pendingVerifications,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verifications',
      message: error.message
    });
  }
});

// GET /api/admin/metrics - Get detailed metrics
router.get('/metrics', async (req, res) => {
  try {
    console.log('📈 Detailed metrics requested');
    
    const metrics = await analyticsService.getDashboardMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

// GET /api/admin/trends - Get performance trends
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    console.log(`📊 Performance trends requested for ${days} days`);
    
    const trends = await analyticsService.getPerformanceTrends(parseInt(days));
    
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends',
      message: error.message
    });
  }
});

// GET /api/admin/activity - Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    console.log(`📋 Recent activity requested (limit: ${limit})`);
    
    const activity = await analyticsService.getRecentActivity(parseInt(limit));
    
    res.json({
      success: true,
      data: activity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity',
      message: error.message
    });
  }
});

// GET /api/admin/insights - Get AI-powered insights
router.get('/insights', async (req, res) => {
  try {
    console.log('🤖 AI insights requested');
    
    // Get current metrics
    const metrics = await analyticsService.getDashboardMetrics();
    
    // Generate AI insights
    const insights = await aiInsightsService.generateInsights(metrics);
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: error.message
    });
  }
});

// POST /api/admin/insights/regenerate - Regenerate insights with specific focus
router.post('/insights/regenerate', async (req, res) => {
  try {
    const { focus } = req.body; // 'sales', 'users', 'performance', 'all'
    console.log(`🤖 Regenerating AI insights with focus: ${focus || 'all'}`);
    
    const metrics = await analyticsService.getDashboardMetrics();
    let insights;
    
    if (focus === 'sales') {
      insights = {
        insights: [await aiInsightsService.generateSalesInsight(metrics)],
        generatedAt: new Date(),
        confidence: aiInsightsService.calculateConfidence(metrics)
      };
    } else if (focus === 'users') {
      insights = {
        insights: [await aiInsightsService.generateUserInsight(metrics)],
        generatedAt: new Date(),
        confidence: aiInsightsService.calculateConfidence(metrics)
      };
    } else if (focus === 'performance') {
      insights = {
        insights: [await aiInsightsService.generatePerformanceInsight(metrics)],
        generatedAt: new Date(),
        confidence: aiInsightsService.calculateConfidence(metrics)
      };
    } else {
      insights = await aiInsightsService.generateInsights(metrics);
    }
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error regenerating AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate insights',
      message: error.message
    });
  }
});

module.exports = router;
