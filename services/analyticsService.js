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
    const ordersCollection = this.db.collection('orders');
    const productsCollection = this.db.collection('products');
    
    // Calculate date ranges
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    // Get real sales data from orders collection
    const [
      totalSales,
      totalRevenueResult,
      revenueThisMonthResult,
      revenueLastMonthResult,
      topSellingProductsResult,
      salesByCategoryResult
    ] = await Promise.all([
      ordersCollection.countDocuments({ paymentStatus: 'completed' }),
      ordersCollection.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]).toArray(),
      ordersCollection.aggregate([
        { 
          $match: { 
            paymentStatus: 'completed',
            createdAt: { $gte: monthAgo }
          } 
        },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]).toArray(),
      ordersCollection.aggregate([
        { 
          $match: { 
            paymentStatus: 'completed',
            createdAt: { $gte: twoMonthsAgo, $lt: monthAgo }
          } 
        },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]).toArray(),
      ordersCollection.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $unwind: '$items' },
        { 
          $group: { 
            _id: '$items.productId', 
            sales: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          } 
        },
        { $sort: { sales: -1 } },
        { $limit: 5 }
      ]).toArray(),
      ordersCollection.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $unwind: '$items' },
        { 
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        { 
          $group: { 
            _id: '$product.category', 
            count: { $sum: '$items.quantity' }
          } 
        },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);
    
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
    const revenueThisMonth = revenueThisMonthResult.length > 0 ? revenueThisMonthResult[0].totalRevenue : 0;
    const revenueLastMonth = revenueLastMonthResult.length > 0 ? revenueLastMonthResult[0].totalRevenue : 0;
    
    // Calculate growth rate
    const revenueGrowth = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
      : 0;
    
    // Calculate average order value
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Get product names for top selling products
    const topSellingProducts = await Promise.all(
      topSellingProductsResult.map(async (item) => {
        const product = await productsCollection.findOne({ _id: item._id });
        return {
          name: product ? product.name : 'Unknown Product',
          sales: item.sales,
          revenue: item.revenue
        };
      })
    );
    
    // Convert sales by category to object format
    const salesByCategory = {};
    salesByCategoryResult.forEach(item => {
      salesByCategory[item._id] = item.count;
    });

    return {
      totalSales,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      revenueLastMonth: Math.round(revenueLastMonth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      topSellingProducts,
      salesByCategory
    };
  }

  // Conversion and engagement metrics
  async getConversionMetrics() {
    const pageTrackingCollection = this.db.collection('pageTracking');
    const ordersCollection = this.db.collection('orders');
    
    // Calculate conversion metrics from page tracking data
    const totalPageViews = await pageTrackingCollection.countDocuments();
    const uniqueSessionsResult = await pageTrackingCollection.aggregate([
      { $group: { _id: '$sessionId' } }
    ]).toArray();
    const uniqueSessions = uniqueSessionsResult.map(item => item._id);
    
    // Get completed orders for conversion calculation
    const completedOrders = await ordersCollection.countDocuments({ paymentStatus: 'completed' });
    
    // Calculate conversion rate based on sessions vs completed orders
    const conversionRate = uniqueSessions.length > 0 
      ? (completedOrders / uniqueSessions.length) * 100 
      : 0;
    
    // Calculate session duration from page tracking data
    const sessionDurationResult = await pageTrackingCollection.aggregate([
      {
        $group: {
          _id: '$sessionId',
          firstView: { $min: '$timestamp' },
          lastView: { $max: '$timestamp' },
          pageCount: { $sum: 1 }
        }
      },
      {
        $project: {
          duration: { $subtract: ['$lastView', '$firstView'] },
          pageCount: 1
        }
      }
    ]).toArray();
    
    const averageSessionDuration = sessionDurationResult.length > 0
      ? sessionDurationResult.reduce((sum, session) => sum + session.duration, 0) / sessionDurationResult.length / (1000 * 60) // Convert to minutes
      : 0;
    
    const pagesPerSession = sessionDurationResult.length > 0
      ? sessionDurationResult.reduce((sum, session) => sum + session.pageCount, 0) / sessionDurationResult.length
      : 0;
    
    // Calculate bounce rate (sessions with only 1 page view)
    const bounceSessions = sessionDurationResult.filter(session => session.pageCount === 1).length;
    const bounceRate = sessionDurationResult.length > 0 
      ? (bounceSessions / sessionDurationResult.length) * 100 
      : 0;
    
    // Mock data for metrics that would need more complex tracking
    const cartAbandonmentRate = 68.5; // Would need cart tracking
    const checkoutCompletionRate = 31.5; // Would need checkout flow tracking
    const returnVisitorRate = 35.7; // Would need user identification

    return {
      conversionRate: Math.round(conversionRate * 100) / 100,
      cartAbandonmentRate,
      checkoutCompletionRate,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      pagesPerSession: Math.round(pagesPerSession * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      returnVisitorRate,
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
