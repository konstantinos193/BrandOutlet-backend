const express = require('express');
const router = express.Router();
const analyticsDataService = require('../services/analyticsDataService');
const analyticsService = require('../services/analyticsService');

// GET /api/dashboard/data - Get dashboard widget data
router.get('/data', async (req, res) => {
  try {
    console.log('📊 Dashboard data requested');
    
    // Get comprehensive analytics data
    const analyticsData = await analyticsDataService.generateUnifiedAnalyticsData();
    const metrics = await analyticsService.getDashboardMetrics();
    
    // Transform data for dashboard widgets
    const dashboardData = {
      // Revenue widget data
      revenue: {
        value: metrics.totalRevenue || 156789,
        change: metrics.revenueGrowth || 12.5
      },
      
      // Active users widget data
      'active-users': {
        value: metrics.activeUsersToday || 1250,
        change: metrics.userGrowthRate || 8.3
      },
      
      // Conversion rate widget data
      'conversion-rate': {
        value: metrics.conversionRate || 2.8,
        change: -0.5 // This would be calculated from historical data
      },
      
      // AOV widget data
      aov: {
        value: metrics.averageOrderValue || 175.65,
        change: 5.2 // This would be calculated from historical data
      },
      
      // Page views widget data
      'page-views': {
        value: metrics.pageViews || 45678,
        change: 15.7 // This would be calculated from historical data
      },
      
      // Online users widget data
      'online-users': {
        value: metrics.onlineUsers || 89,
        change: 0
      },
      
      // Bounce rate widget data
      'bounce-rate': {
        value: metrics.bounceRate || 42.3,
        change: -2.1 // This would be calculated from historical data
      },
      
      // Session duration widget data
      'session-duration': {
        value: metrics.averageSessionDuration || 4.2,
        change: 0.8 // This would be calculated from historical data
      },
      
      // Recent activity widget data
      'recent-activity': {
        items: [
          'User registered: john_doe',
          'Product added: Air Jordan 1 Retro',
          'Sale completed: $250.00',
          'User registered: jane_smith',
          'Product added: Supreme Box Logo Hoodie',
          'Sale completed: $180.00',
          'User registered: mike_wilson',
          'Product added: Off-White Air Max 90',
          'Sale completed: $320.00'
        ]
      },
      
      // Top products widget data
      'top-products': {
        products: [
          'Air Jordan 1 Retro High',
          'Supreme Box Logo Hoodie',
          'Louis Vuitton Keepall',
          'Off-White Air Max 90',
          'Travis Scott Jordan 1'
        ]
      },
      
      // Performance chart widget data
      'performance-chart': {
        data: [10, 15, 12, 18, 22, 19, 25, 28, 24, 30, 27, 32]
      }
    };
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// GET /api/dashboard/layout/:userId - Get user's dashboard layout
router.get('/layout/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📋 Dashboard layout requested for user: ${userId}`);
    
    // In a real implementation, this would fetch from database
    // For now, return default layout
    const defaultLayout = [
      { id: '1', type: 'revenue', title: 'Revenue', size: 'medium', position: { x: 0, y: 0 }, visible: true },
      { id: '2', type: 'active-users', title: 'Active Users', size: 'small', position: { x: 0, y: 0 }, visible: true },
      { id: '3', type: 'conversion-rate', title: 'Conversion Rate', size: 'small', position: { x: 0, y: 0 }, visible: true },
      { id: '4', type: 'aov', title: 'AOV', size: 'small', position: { x: 0, y: 0 }, visible: true },
      { id: '5', type: 'recent-activity', title: 'Recent Activity', size: 'large', position: { x: 0, y: 0 }, visible: true },
    ];
    
    res.json({
      success: true,
      data: defaultLayout,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard layout',
      message: error.message
    });
  }
});

// PUT /api/dashboard/layout/:userId - Save user's dashboard layout
router.put('/layout/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { layout } = req.body;
    
    console.log(`💾 Saving dashboard layout for user: ${userId}`);
    console.log('Layout data:', JSON.stringify(layout, null, 2));
    
    // In a real implementation, this would save to database
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Dashboard layout saved successfully',
      data: {
        userId,
        layout,
        savedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save dashboard layout',
      message: error.message
    });
  }
});

// GET /api/dashboard/widgets - Get available widget types
router.get('/widgets', (req, res) => {
  try {
    console.log('🔧 Available widgets requested');
    
    const widgetTypes = {
      'revenue': {
        name: 'Revenue',
        description: 'Total revenue metrics',
        defaultSize: 'medium',
        icon: '💰'
      },
      'active-users': {
        name: 'Active Users',
        description: 'Current active users',
        defaultSize: 'small',
        icon: '👥'
      },
      'conversion-rate': {
        name: 'Conversion Rate',
        description: 'Visitor to customer conversion',
        defaultSize: 'small',
        icon: '📈'
      },
      'aov': {
        name: 'Average Order Value',
        description: 'Average order value metrics',
        defaultSize: 'small',
        icon: '🛒'
      },
      'page-views': {
        name: 'Page Views',
        description: 'Total page views',
        defaultSize: 'small',
        icon: '👁️'
      },
      'online-users': {
        name: 'Online Now',
        description: 'Users currently online',
        defaultSize: 'small',
        icon: '🟢'
      },
      'bounce-rate': {
        name: 'Bounce Rate',
        description: 'Page bounce rate',
        defaultSize: 'small',
        icon: '📊'
      },
      'session-duration': {
        name: 'Session Duration',
        description: 'Average session length',
        defaultSize: 'small',
        icon: '⏱️'
      },
      'recent-activity': {
        name: 'Recent Activity',
        description: 'Latest user activities',
        defaultSize: 'large',
        icon: '📋'
      },
      'top-products': {
        name: 'Top Products',
        description: 'Best selling products',
        defaultSize: 'medium',
        icon: '🏆'
      },
      'performance-chart': {
        name: 'Performance Chart',
        description: 'Performance over time',
        defaultSize: 'large',
        icon: '📊'
      }
    };
    
    res.json({
      success: true,
      data: widgetTypes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching widget types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch widget types',
      message: error.message
    });
  }
});

module.exports = router;
