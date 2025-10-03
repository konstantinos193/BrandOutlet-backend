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

    // Debug: Log the original recentActivity
    console.log('Original recentActivity:', JSON.stringify(recentActivity, null, 2));
    
    // Transform recentActivity to match frontend expectations
    const transformedRecentActivity = {
      products: recentActivity
        .filter(activity => activity.type === 'product_added')
        .map(activity => ({
          id: activity.metadata.productId,
          brand: { name: activity.description.split(' ')[0] }, // Extract brand from description
          name: activity.description.split(' ').slice(1).join(' '), // Extract product name
          seller: { username: 'admin' }, // Default seller
          createdAt: activity.timestamp
        })),
      sales: [], // Mock sales data - replace with real data when available
      users: [] // Mock users data - replace with real data when available
    };
    
    // Debug: Log the transformed data
    console.log('Transformed recentActivity:', JSON.stringify(transformedRecentActivity, null, 2));

    return {
      metrics,
      recentActivity: transformedRecentActivity,
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

// GET /api/admin/quick-insights - Get at-a-glance insights for quick decision-making
router.get('/quick-insights', async (req, res) => {
  try {
    console.log('⚡ Quick insights requested');
    
    const [
      metrics,
      alerts,
      healthScore,
      urgentActions
    ] = await Promise.all([
      analyticsService.getDashboardMetrics(),
      getSystemAlerts(),
      calculateHealthScore(),
      getUrgentActions()
    ]);
    
    const quickInsights = {
      overview: {
        healthScore,
        status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : 'needs_attention',
        lastUpdated: new Date().toISOString()
      },
      alerts: alerts,
      urgentActions: urgentActions,
      keyMetrics: {
        revenue: {
          current: metrics.totalRevenue,
          growth: metrics.revenueGrowth,
          trend: metrics.revenueGrowth > 0 ? 'up' : 'down'
        },
        users: {
          active: metrics.activeUsersToday,
          growth: metrics.userGrowthRate,
          trend: metrics.userGrowthRate > 0 ? 'up' : 'down'
        },
        products: {
          total: metrics.totalProducts,
          verified: metrics.verifiedProducts,
          pending: metrics.pendingVerifications
        },
        performance: {
          conversion: metrics.conversionRate,
          bounce: metrics.bounceRate,
          trend: metrics.conversionRate > 3 ? 'good' : 'needs_improvement'
        }
      }
    };
    
    res.json({
      success: true,
      data: quickInsights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching quick insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick insights',
      message: error.message
    });
  }
});

// GET /api/admin/alerts - Get system alerts and warnings
router.get('/alerts', async (req, res) => {
  try {
    console.log('🚨 System alerts requested');
    
    const alerts = await getSystemAlerts();
    
    res.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// GET /api/admin/health-score - Get overall system health score
router.get('/health-score', async (req, res) => {
  try {
    console.log('💚 Health score requested');
    
    const healthScore = await calculateHealthScore();
    const metrics = await analyticsService.getDashboardMetrics();
    
    res.json({
      success: true,
      data: {
        score: healthScore,
        status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : 'needs_attention',
        breakdown: {
          revenue: calculateRevenueHealth(metrics),
          users: calculateUserHealth(metrics),
          products: calculateProductHealth(metrics),
          performance: calculatePerformanceHealth(metrics)
        },
        recommendations: generateHealthRecommendations(healthScore, metrics)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating health score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate health score',
      message: error.message
    });
  }
});

// Helper function to get system alerts
const getSystemAlerts = async () => {
  const alerts = [];
  const metrics = await analyticsService.getDashboardMetrics();
  
  // Revenue alerts
  if (metrics.revenueGrowth < 0) {
    alerts.push({
      type: 'warning',
      category: 'revenue',
      title: 'Revenue Decline',
      message: `Revenue decreased by ${Math.abs(metrics.revenueGrowth)}% this period`,
      priority: 'high',
      action: 'Review pricing strategy and promotional campaigns'
    });
  }
  
  // User engagement alerts
  if (metrics.bounceRate > 60) {
    alerts.push({
      type: 'warning',
      category: 'engagement',
      title: 'High Bounce Rate',
      message: `Bounce rate is ${metrics.bounceRate}% - above recommended threshold`,
      priority: 'medium',
      action: 'Improve page load speed and content relevance'
    });
  }
  
  // Product verification alerts
  if (metrics.pendingVerifications > 10) {
    alerts.push({
      type: 'info',
      category: 'products',
      title: 'Pending Verifications',
      message: `${metrics.pendingVerifications} products awaiting verification`,
      priority: 'medium',
      action: 'Review and verify pending products'
    });
  }
  
  // Low stock alerts
  if (metrics.lowStockProducts > 0) {
    alerts.push({
      type: 'warning',
      category: 'inventory',
      title: 'Low Stock Alert',
      message: `${metrics.lowStockProducts} products are low in stock`,
      priority: 'high',
      action: 'Restock low inventory items'
    });
  }
  
  return alerts;
};

// Helper function to calculate overall health score
const calculateHealthScore = async () => {
  const metrics = await analyticsService.getDashboardMetrics();
  
  let score = 0;
  let factors = 0;
  
  // Revenue health (25 points)
  if (metrics.revenueGrowth > 10) score += 25;
  else if (metrics.revenueGrowth > 0) score += 20;
  else if (metrics.revenueGrowth > -5) score += 10;
  else score += 0;
  factors += 25;
  
  // User engagement (25 points)
  if (metrics.bounceRate < 30) score += 25;
  else if (metrics.bounceRate < 50) score += 20;
  else if (metrics.bounceRate < 70) score += 10;
  else score += 0;
  factors += 25;
  
  // Conversion rate (25 points)
  if (metrics.conversionRate > 5) score += 25;
  else if (metrics.conversionRate > 3) score += 20;
  else if (metrics.conversionRate > 1) score += 10;
  else score += 0;
  factors += 25;
  
  // Product verification (25 points)
  const verificationRate = metrics.totalProducts > 0 ? (metrics.verifiedProducts / metrics.totalProducts) * 100 : 0;
  if (verificationRate > 90) score += 25;
  else if (verificationRate > 70) score += 20;
  else if (verificationRate > 50) score += 10;
  else score += 0;
  factors += 25;
  
  return Math.round((score / factors) * 100);
};

// Helper function to get urgent actions
const getUrgentActions = async () => {
  const actions = [];
  const metrics = await analyticsService.getDashboardMetrics();
  
  if (metrics.pendingVerifications > 5) {
    actions.push({
      id: 'verify_products',
      title: 'Verify Pending Products',
      description: `${metrics.pendingVerifications} products need verification`,
      priority: 'high',
      estimatedTime: '15 minutes',
      endpoint: '/api/admin/verifications'
    });
  }
  
  if (metrics.lowStockProducts > 0) {
    actions.push({
      id: 'restock_items',
      title: 'Restock Low Inventory',
      description: `${metrics.lowStockProducts} items are low in stock`,
      priority: 'high',
      estimatedTime: '30 minutes',
      endpoint: '/api/admin/products?filter=low-stock'
    });
  }
  
  if (metrics.bounceRate > 60) {
    actions.push({
      id: 'optimize_pages',
      title: 'Optimize Page Performance',
      description: 'High bounce rate detected - review page speed',
      priority: 'medium',
      estimatedTime: '1 hour',
      endpoint: '/api/admin/performance'
    });
  }
  
  return actions;
};

// Helper functions for health score breakdown
const calculateRevenueHealth = (metrics) => {
  if (metrics.revenueGrowth > 10) return { score: 100, status: 'excellent' };
  if (metrics.revenueGrowth > 0) return { score: 80, status: 'good' };
  if (metrics.revenueGrowth > -5) return { score: 60, status: 'fair' };
  return { score: 40, status: 'poor' };
};

const calculateUserHealth = (metrics) => {
  if (metrics.bounceRate < 30) return { score: 100, status: 'excellent' };
  if (metrics.bounceRate < 50) return { score: 80, status: 'good' };
  if (metrics.bounceRate < 70) return { score: 60, status: 'fair' };
  return { score: 40, status: 'poor' };
};

const calculateProductHealth = (metrics) => {
  const verificationRate = metrics.totalProducts > 0 ? (metrics.verifiedProducts / metrics.totalProducts) * 100 : 0;
  if (verificationRate > 90) return { score: 100, status: 'excellent' };
  if (verificationRate > 70) return { score: 80, status: 'good' };
  if (verificationRate > 50) return { score: 60, status: 'fair' };
  return { score: 40, status: 'poor' };
};

const calculatePerformanceHealth = (metrics) => {
  if (metrics.conversionRate > 5) return { score: 100, status: 'excellent' };
  if (metrics.conversionRate > 3) return { score: 80, status: 'good' };
  if (metrics.conversionRate > 1) return { score: 60, status: 'fair' };
  return { score: 40, status: 'poor' };
};

const generateHealthRecommendations = (healthScore, metrics) => {
  const recommendations = [];
  
  if (healthScore < 60) {
    recommendations.push({
      priority: 'high',
      category: 'overall',
      title: 'System Health Needs Attention',
      description: 'Multiple areas need improvement. Focus on high-impact changes first.'
    });
  }
  
  if (metrics.revenueGrowth < 0) {
    recommendations.push({
      priority: 'high',
      category: 'revenue',
      title: 'Boost Revenue',
      description: 'Consider promotional campaigns, price optimization, or new product launches.'
    });
  }
  
  if (metrics.bounceRate > 60) {
    recommendations.push({
      priority: 'medium',
      category: 'engagement',
      title: 'Improve User Engagement',
      description: 'Optimize page load speed, improve content quality, and enhance user experience.'
    });
  }
  
  if (metrics.conversionRate < 2) {
    recommendations.push({
      priority: 'high',
      category: 'conversion',
      title: 'Increase Conversion Rate',
      description: 'A/B test checkout process, improve product pages, and optimize call-to-actions.'
    });
  }
  
  return recommendations;
};

module.exports = router;
