const { getDB } = require('../config/database');

class AnalyticsService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      this.db = getDB();
    }
  }

  // Get comprehensive dashboard metrics
  async getDashboardMetrics() {
    await this.init();
    
    const [
      productStats,
      userStats,
      salesStats,
      conversionMetrics,
      realTimeMetrics
    ] = await Promise.all([
      this.getProductMetrics(),
      this.getUserMetrics(),
      this.getSalesMetrics(),
      this.getConversionMetrics(),
      this.getRealTimeMetrics()
    ]);

    return {
      ...productStats,
      ...userStats,
      ...salesStats,
      ...conversionMetrics,
      ...realTimeMetrics
    };
  }

  // Product-related metrics
  async getProductMetrics() {
    const productsCollection = this.db.collection('products');
    
    const [
      totalProducts,
      activeProducts,
      verifiedProducts,
      pendingVerifications,
      lowStockProducts,
      topCategories
    ] = await Promise.all([
      productsCollection.countDocuments(),
      productsCollection.countDocuments({ isActive: true }),
      productsCollection.countDocuments({ 'authenticity.isVerified': true }),
      productsCollection.countDocuments({ 'authenticity.isVerified': false, isActive: true }),
      productsCollection.countDocuments({ stock: { $lte: 5 }, isActive: true }),
      this.getTopCategories()
    ]);

    return {
      totalProducts,
      activeProducts,
      verifiedProducts,
      pendingVerifications,
      lowStockProducts,
      topCategories,
      verificationRate: totalProducts > 0 ? ((verifiedProducts / totalProducts) * 100).toFixed(1) : 0
    };
  }

  // User-related metrics
  async getUserMetrics() {
    const usersCollection = this.db.collection('users');
    const pageTrackingCollection = this.db.collection('pageTracking');
    
    // Mock user data for now - replace with real user collection when available
    const mockUserStats = {
      totalUsers: 3421,
      activeUsers: 1250,
      newUsersToday: 45,
      newUsersThisWeek: 312,
      newUsersThisMonth: 1280,
      userGrowthRate: 12.5,
      churnRate: 3.2,
      retentionRate: 96.8
    };

    // Get real page tracking data for active users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeUsersTodayResult = await pageTrackingCollection.aggregate([
      { $match: { timestamp: { $gte: today } } },
      { $group: { _id: '$sessionId' } }
    ]).toArray();
    const activeUsersToday = activeUsersTodayResult.map(item => item._id);

    return {
      ...mockUserStats,
      activeUsersToday: activeUsersToday.length,
      realActiveUsers: activeUsersToday.length
    };
  }

  // Sales and revenue metrics
  async getSalesMetrics() {
    // Mock sales data - replace with real sales collection when available
    const mockSalesStats = {
      totalSales: 892,
      totalRevenue: 156789.50,
      averageOrderValue: 175.65,
      revenueThisMonth: 45678.90,
      revenueLastMonth: 38945.20,
      revenueGrowth: 17.3,
      topSellingProducts: [
        { name: 'Air Jordan 1 Retro High OG', sales: 45, revenue: 8100 },
        { name: 'Supreme Box Logo Hoodie', sales: 32, revenue: 14400 },
        { name: 'Louis Vuitton Neverfull MM', sales: 18, revenue: 21600 }
      ],
      salesByCategory: {
        'Sneakers': 456,
        'Clothing': 234,
        'Bags': 202
      }
    };

    return mockSalesStats;
  }

  // Conversion and engagement metrics
  async getConversionMetrics() {
    const pageTrackingCollection = this.db.collection('pageTracking');
    
    // Calculate conversion metrics from page tracking data
    const totalPageViews = await pageTrackingCollection.countDocuments();
    const uniqueSessionsResult = await pageTrackingCollection.aggregate([
      { $group: { _id: '$sessionId' } }
    ]).toArray();
    const uniqueSessions = uniqueSessionsResult.map(item => item._id);
    
    // Mock conversion data - replace with real data when available
    const mockConversionStats = {
      conversionRate: 2.8,
      cartAbandonmentRate: 68.5,
      checkoutCompletionRate: 31.5,
      averageSessionDuration: 4.2, // minutes
      pagesPerSession: 3.8,
      bounceRate: 42.3,
      returnVisitorRate: 35.7
    };

    return {
      ...mockConversionStats,
      totalPageViews,
      uniqueSessions: uniqueSessions.length
    };
  }

  // Real-time metrics
  async getRealTimeMetrics() {
    const pageTrackingCollection = this.db.collection('pageTracking');
    
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const [
      pageViewsLastHour,
      pageViewsLast24Hours,
      activeUsersLastHour,
      activeUsersLast24Hours
    ] = await Promise.all([
      pageTrackingCollection.countDocuments({ timestamp: { $gte: lastHour } }),
      pageTrackingCollection.countDocuments({ timestamp: { $gte: last24Hours } }),
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: lastHour } } },
        { $group: { _id: '$sessionId' } }
      ]).toArray(),
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: last24Hours } } },
        { $group: { _id: '$sessionId' } }
      ]).toArray()
    ]);

    return {
      pageViewsLastHour,
      pageViewsLast24Hours,
      activeUsersLastHour: activeUsersLastHour.length,
      activeUsersLast24Hours: activeUsersLast24Hours.length,
      currentOnlineUsers: activeUsersLastHour.length,
      peakHourlyTraffic: Math.max(pageViewsLastHour, 15), // Mock peak
      systemUptime: process.uptime(),
      lastUpdated: now
    };
  }

  // Get top product categories
  async getTopCategories() {
    const productsCollection = this.db.collection('products');
    
    const categories = await productsCollection.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    return categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      percentage: 0 // Will be calculated in frontend
    }));
  }

  // Get recent activity with more details
  async getRecentActivity(limit = 10) {
    await this.init();
    
    const productsCollection = this.db.collection('products');
    const pageTrackingCollection = this.db.collection('pageTracking');
    
    const [recentProducts, recentPageViews] = await Promise.all([
      productsCollection.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      pageTrackingCollection.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray()
    ]);

    const activities = [];

    // Add recent products
    recentProducts.forEach(product => {
      activities.push({
        id: `product_${product._id}`,
        type: 'product_added',
        title: 'New Product Added',
        description: `${product.brand.name} ${product.name}`,
        timestamp: product.createdAt,
        metadata: {
          productId: product._id,
          price: product.price,
          category: product.category
        }
      });
    });

    // Add recent page views (simplified)
    recentPageViews.slice(0, 5).forEach(pageView => {
      activities.push({
        id: `pageview_${pageView._id}`,
        type: 'page_view',
        title: 'Page View',
        description: `User visited ${pageView.page}`,
        timestamp: new Date(pageView.timestamp),
        metadata: {
          page: pageView.page,
          sessionId: pageView.sessionId
        }
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  // Get performance trends
  async getPerformanceTrends(days = 30) {
    const pageTrackingCollection = this.db.collection('pageTracking');
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const dailyStats = await pageTrackingCollection.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          pageViews: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          pageViews: 1,
          uniqueSessions: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();

    return dailyStats;
  }
}

module.exports = new AnalyticsService();
