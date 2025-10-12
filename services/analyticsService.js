const { getDB } = require('../config/database');

class AnalyticsService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      try {
        this.db = getDB();
        console.log('✅ Analytics service database connection established');
      } catch (error) {
        console.error('❌ Failed to connect to database in analytics service:', error);
        throw error;
      }
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
    try {
      const productsCollection = this.db.collection('products');
      
      console.log('📊 Fetching product metrics from database...');
      
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

      console.log(`📊 Found ${totalProducts} total products, ${activeProducts} active products`);

      return {
        totalProducts,
        activeProducts,
        verifiedProducts,
        pendingVerifications,
        lowStockProducts,
        topCategories,
        verificationRate: totalProducts > 0 ? ((verifiedProducts / totalProducts) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('❌ Error fetching product metrics:', error);
      // Return default values if database query fails
      return {
        totalProducts: 0,
        activeProducts: 0,
        verifiedProducts: 0,
        pendingVerifications: 0,
        lowStockProducts: 0,
        topCategories: [],
        verificationRate: 0
      };
    }
  }

  // User-related metrics
  async getUserMetrics() {
    try {
      const usersCollection = this.db.collection('users');
      const pageTrackingCollection = this.db.collection('pageViews');
      
      console.log('📊 Fetching user metrics from database...');
      
      // Get real user data from database
      const totalUsers = await usersCollection.countDocuments();
      const activeUsers = await usersCollection.countDocuments({ status: 'active' });
      
      console.log(`📊 Found ${totalUsers} total users, ${activeUsers} active users`);
    
    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // Get new user counts
    const newUsersToday = await usersCollection.countDocuments({ 
      createdAt: { $gte: today } 
    });
    const newUsersThisWeek = await usersCollection.countDocuments({ 
      createdAt: { $gte: weekAgo } 
    });
    const newUsersThisMonth = await usersCollection.countDocuments({ 
      createdAt: { $gte: monthAgo } 
    });
    
    // Calculate growth rate (month over month)
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const usersLastMonth = await usersCollection.countDocuments({ 
      createdAt: { $gte: twoMonthsAgo, $lt: monthAgo } 
    });
    const userGrowthRate = usersLastMonth > 0 ? 
      ((newUsersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1) : 0;

    // Get real page tracking data for active users
    const activeUsersTodayResult = await pageTrackingCollection.aggregate([
      { $match: { timestamp: { $gte: today } } },
      { $group: { _id: '$sessionId' } }
    ]).toArray();
    const activeUsersToday = activeUsersTodayResult.map(item => item._id);

      return {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowthRate: parseFloat(userGrowthRate),
        churnRate: 0, // Would need historical data to calculate
        retentionRate: 100, // Would need historical data to calculate
        activeUsersToday: activeUsersToday.length,
        realActiveUsers: activeUsersToday.length
      };
    } catch (error) {
      console.error('❌ Error fetching user metrics:', error);
      // Return default values if database query fails
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        userGrowthRate: 0,
        churnRate: 0,
        retentionRate: 100,
        activeUsersToday: 0,
        realActiveUsers: 0
      };
    }
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

    console.log('📊 Sales metrics calculated:', {
      totalSales,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      revenueLastMonth: Math.round(revenueLastMonth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      ordersCount: totalSales
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
    const pageTrackingCollection = this.db.collection('pageViews');
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
    
    // Calculate return visitor rate from actual data
    const returnVisitorSessions = await pageTrackingCollection.aggregate([
      {
        $group: {
          _id: '$sessionId',
          visitCount: { $sum: 1 },
          firstVisit: { $min: '$timestamp' },
          lastVisit: { $max: '$timestamp' }
        }
      },
      {
        $match: {
          $expr: {
            $gt: [
              { $divide: [{ $subtract: ['$lastVisit', '$firstVisit'] }, 1000 * 60 * 60 * 24] },
              1 // More than 1 day between first and last visit
            ]
          }
        }
      }
    ]).toArray();
    
    const returnVisitorRate = sessionDurationResult.length > 0 
      ? (returnVisitorSessions.length / sessionDurationResult.length) * 100 
      : 0;

    console.log('📊 Conversion metrics calculated:', {
      totalPageViews,
      uniqueSessions: uniqueSessions.length,
      returnVisitorSessions: returnVisitorSessions.length,
      returnVisitorRate: Math.round(returnVisitorRate * 100) / 100,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      pagesPerSession: Math.round(pagesPerSession * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100
    });

    // Calculate cart abandonment and checkout completion from orders data
    const totalCarts = await ordersCollection.countDocuments(); // Total cart attempts
    const completedCarts = await ordersCollection.countDocuments({ paymentStatus: 'completed' });
    const abandonedCarts = totalCarts - completedCarts;
    
    const cartAbandonmentRate = totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0;
    const checkoutCompletionRate = totalCarts > 0 ? (completedCarts / totalCarts) * 100 : 0;

    return {
      conversionRate: Math.round(conversionRate * 100) / 100,
      cartAbandonmentRate,
      checkoutCompletionRate,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      pagesPerSession: Math.round(pagesPerSession * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      returnVisitorRate: Math.round(returnVisitorRate * 100) / 100,
      totalPageViews,
      uniqueSessions: uniqueSessions.length
    };
  }

  // Real-time metrics
  async getRealTimeMetrics() {
    const pageTrackingCollection = this.db.collection('pageViews');
    
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

    console.log('📊 Real-time metrics calculated:', {
      pageViewsLastHour,
      pageViewsLast24Hours,
      activeUsersLastHour: activeUsersLastHour.length,
      activeUsersLast24Hours: activeUsersLast24Hours.length,
      peakHourlyTraffic: pageViewsLastHour
    });

    return {
      pageViewsLastHour,
      pageViewsLast24Hours,
      activeUsersLastHour: activeUsersLastHour.length,
      activeUsersLast24Hours: activeUsersLast24Hours.length,
      currentOnlineUsers: activeUsersLastHour.length,
      peakHourlyTraffic: pageViewsLastHour, // Real peak traffic
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
    const pageTrackingCollection = this.db.collection('pageViews');
    
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
    const pageTrackingCollection = this.db.collection('pageViews');
    
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
