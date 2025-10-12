const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getDB } = require('../config/database');
const analyticsService = require('../services/analyticsService');
const aiInsightsService = require('../services/aiInsightsService');
const CustomOrder = require('../models/CustomOrder');
const authModule = require('./auth');
const { verifyToken } = authModule;
const authRateLimit = require('../middleware/authRateLimit');

// Apply authentication middleware to all admin routes
router.use(verifyToken);

// Apply authenticated rate limiting to admin routes
router.use(authRateLimit);

// Helper function to get comprehensive dashboard data
const getDashboardData = async () => {
  try {
    const [
      metrics,
      recentActivity
    ] = await Promise.all([
      analyticsService.getDashboardMetrics(),
      analyticsService.getRecentActivity(10)
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
      sales: recentActivity
        .filter(activity => activity.type === 'sale')
        .map(activity => ({
          id: activity.metadata.saleId || activity.id,
          product: {
            brand: activity.description.split(' ')[0],
            name: activity.description.split(' ').slice(1).join(' ')
          },
          price: activity.metadata.price || 0,
          createdAt: activity.timestamp
        })),
      users: recentActivity
        .filter(activity => activity.type === 'user_registered')
        .map(activity => ({
          id: activity.metadata.userId || activity.id,
          username: activity.description.split(' ')[0],
          email: activity.metadata.email || 'user@example.com',
          createdAt: activity.timestamp
        }))
    };
    
    // Debug: Log the transformed data
    console.log('Transformed recentActivity:', JSON.stringify(transformedRecentActivity, null, 2));

    // Transform data into frontend-ready format
    const frontendReadyData = {
      metrics,
      recentActivity: transformRecentActivityForFrontend(transformedRecentActivity)
    };

    return frontendReadyData;
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
};


// Transform recent activity data for frontend consumption
const transformRecentActivityForFrontend = (recentActivity) => {
  const activities = [];
  
  // Transform products
  if (recentActivity.products && Array.isArray(recentActivity.products)) {
    recentActivity.products.forEach(product => {
      activities.push({
        id: product.id,
        type: 'product_added',
        description: `New ${product.brand.name} ${product.name} added by ${product.seller.username}`,
        timestamp: product.createdAt,
        status: 'success',
      });
    });
  }
  
  // Transform sales
  if (recentActivity.sales && Array.isArray(recentActivity.sales)) {
    recentActivity.sales.forEach(sale => {
      activities.push({
        id: sale.id,
        type: 'sale',
        description: `${sale.product.brand} ${sale.product.name} sold for $${sale.price}`,
        timestamp: sale.createdAt,
        status: 'success',
      });
    });
  }
  
  // Transform users
  if (recentActivity.users && Array.isArray(recentActivity.users)) {
    recentActivity.users.forEach(user => {
      activities.push({
        id: user.id,
        type: 'user_registered',
        description: `New user ${user.username} registered`,
        timestamp: user.createdAt,
        status: 'success',
      });
    });
  }
  
  // Sort by timestamp (most recent first)
  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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


// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    console.log('📈 Admin stats requested');
    
    const metrics = await analyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics,
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
          active: metrics.activeProducts
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
  
  // Product quality (25 points) - based on active products and low stock
  const activeProductRate = metrics.totalProducts > 0 ? (metrics.activeProducts / metrics.totalProducts) * 100 : 0;
  if (activeProductRate > 90) score += 25;
  else if (activeProductRate > 70) score += 20;
  else if (activeProductRate > 50) score += 10;
  else score += 0;
  factors += 25;
  
  return Math.round((score / factors) * 100);
};

// Helper function to get urgent actions
const getUrgentActions = async () => {
  const actions = [];
  const metrics = await analyticsService.getDashboardMetrics();
  
  
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
  const activeProductRate = metrics.totalProducts > 0 ? (metrics.activeProducts / metrics.totalProducts) * 100 : 0;
  if (activeProductRate > 90) return { score: 100, status: 'excellent' };
  if (activeProductRate > 70) return { score: 80, status: 'good' };
  if (activeProductRate > 50) return { score: 60, status: 'fair' };
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

// GET /api/admin/custom-orders - Get all custom orders
router.get('/custom-orders', async (req, res) => {
  try {
    console.log('📋 Custom orders requested');
    
    const { status, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
    
    const [orders, total] = await Promise.all([
      CustomOrder.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CustomOrder.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: total,
          limit: parseInt(limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching custom orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom orders',
      message: error.message
    });
  }
});

// GET /api/admin/custom-orders/:id - Get specific custom order
router.get('/custom-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Custom order ${id} requested`);
    
    const order = await CustomOrder.findById(id).lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching custom order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom order',
      message: error.message
    });
  }
});

// PUT /api/admin/custom-orders/:id/status - Update custom order status
router.put('/custom-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse, quote } = req.body;
    
    console.log(`📋 Updating custom order ${id} status to ${status}`);
    
    const updateData = { 
      status,
      updatedAt: new Date()
    };
    
    if (adminResponse) {
      updateData.adminResponse = adminResponse;
    }
    
    if (quote) {
      updateData.quote = quote;
    }
    
    const order = await CustomOrder.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: `Custom order status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating custom order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update custom order status',
      message: error.message
    });
  }
});

// PUT /api/admin/custom-orders/:id/respond - Add admin response to custom order
router.put('/custom-orders/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse, quote } = req.body;
    
    console.log(`📋 Adding response to custom order ${id}`);
    
    const updateData = {
      adminResponse,
      updatedAt: new Date()
    };
    
    if (quote) {
      updateData.quote = quote;
    }
    
    const order = await CustomOrder.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: 'Response added to custom order',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding response to custom order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add response to custom order',
      message: error.message
    });
  }
});

// GET /api/admin/custom-orders/stats - Get custom orders statistics
router.get('/custom-orders/stats', async (req, res) => {
  try {
    console.log('📊 Custom orders statistics requested');
    
    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      recentOrders
    ] = await Promise.all([
      CustomOrder.countDocuments(),
      CustomOrder.countDocuments({ status: 'pending' }),
      CustomOrder.countDocuments({ status: 'in_progress' }),
      CustomOrder.countDocuments({ status: 'completed' }),
      CustomOrder.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('customerName instagramHandle description status createdAt')
        .lean()
    ]);
    
    const stats = {
      total: totalOrders,
      pending: pendingOrders,
      inProgress: inProgressOrders,
      completed: completedOrders,
      recent: recentOrders
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching custom orders stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom orders statistics',
      message: error.message
    });
  }
});

// DELETE /api/admin/custom-orders/:id - Delete custom order
router.delete('/custom-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting custom order ${id}`);
    
    const order = await CustomOrder.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Custom order deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting custom order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete custom order',
      message: error.message
    });
  }
});

module.exports = router;
