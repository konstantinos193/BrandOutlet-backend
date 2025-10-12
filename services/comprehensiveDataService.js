const { getDB } = require('../config/database');
const geoip = require('geoip-lite');

class ComprehensiveDataService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    if (!this.db) {
      this.db = await getDB();
    }
  }

  // Get comprehensive data for AI insights
  async getComprehensiveData() {
    try {
      await this.initialize();
      
      const [
        productData,
        userData,
        salesData,
        seoData,
        geolocationData,
        performanceData,
        inventoryData,
        searchData,
        pageTrackingData,
        userPreferencesData,
        realTimeData,
        financialData
      ] = await Promise.all([
        this.getProductData(),
        this.getUserData(),
        this.getSalesData(),
        this.getSEOData(),
        this.getGeolocationData(),
        this.getPerformanceData(),
        this.getInventoryData(),
        this.getSearchData(),
        this.getPageTrackingData(),
        this.getUserPreferencesData(),
        this.getRealTimeData(),
        this.getFinancialData()
      ]);

      return {
        timestamp: new Date().toISOString(),
        dataSource: 'comprehensive',
        products: productData,
        users: userData,
        sales: salesData,
        seo: seoData,
        geolocation: geolocationData,
        performance: performanceData,
        inventory: inventoryData,
        search: searchData,
        pageTracking: pageTrackingData,
        userPreferences: userPreferencesData,
        realTime: realTimeData,
        financial: financialData
      };
    } catch (error) {
      console.error('Error getting comprehensive data:', error);
      throw error;
    }
  }

  // Product data with detailed analytics
  async getProductData() {
    try {
      const productsCollection = this.db.collection('products');
      const variantsCollection = this.db.collection('variants');
      
      const [
        totalProducts,
        activeProducts,
        productsByCategory,
        productsByBrand,
        priceDistribution,
        stockLevels,
        recentProducts,
        topSellingProducts,
        productPerformance
      ] = await Promise.all([
        productsCollection.countDocuments(),
        productsCollection.countDocuments({ isActive: true }),
        this.getProductsByCategory(),
        this.getProductsByBrand(),
        this.getPriceDistribution(),
        this.getStockLevels(),
        this.getRecentProducts(),
        this.getTopSellingProducts(),
        this.getProductPerformance()
      ]);

      return {
        totalProducts,
        activeProducts,
        activeProductRate: totalProducts > 0 ? ((activeProducts / totalProducts) * 100).toFixed(1) : 0,
        productsByCategory,
        productsByBrand,
        priceStats: priceDistribution[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0, totalValue: 0 },
        stockStats: stockLevels[0] || { totalStock: 0, outOfStock: 0, lowStock: 0, totalValue: 0 },
        recentProducts,
        topSellingProducts,
        performance: productPerformance
      };
    } catch (error) {
      console.error('Error getting product data:', error);
      return {};
    }
  }

  // User data with demographics and behavior
  async getUserData() {
    try {
      const usersCollection = this.db.collection('users');
      const pageViewsCollection = this.db.collection('pageViews');
      
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowthRate,
        userDemographics,
        userBehavior,
        userEngagement
      ] = await Promise.all([
        usersCollection.countDocuments(),
        this.getActiveUsers(),
        this.getNewUsersToday(),
        this.getNewUsersThisWeek(),
        this.getNewUsersThisMonth(),
        this.getUserGrowthRate(),
        this.getUserDemographics(),
        this.getUserBehavior(),
        this.getUserEngagement()
      ]);

      return {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowthRate,
        demographics: userDemographics,
        behavior: userBehavior,
        engagement: userEngagement
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return {};
    }
  }

  // Sales data with detailed metrics
  async getSalesData() {
    try {
      const ordersCollection = this.db.collection('orders');
      const salesCollection = this.db.collection('sales');
      
      const [
        totalSales,
        totalRevenue,
        averageOrderValue,
        revenueThisMonth,
        revenueLastMonth,
        revenueGrowth,
        salesByCategory,
        salesByTime,
        conversionFunnel,
        topSellingProducts
      ] = await Promise.all([
        this.getTotalSales(),
        this.getTotalRevenue(),
        this.getAverageOrderValue(),
        this.getRevenueThisMonth(),
        this.getRevenueLastMonth(),
        this.getRevenueGrowth(),
        this.getSalesByCategory(),
        this.getSalesByTime(),
        this.getConversionFunnel(),
        this.getTopSellingProducts()
      ]);

      return {
        totalSales,
        totalRevenue,
        averageOrderValue,
        revenueThisMonth,
        revenueLastMonth,
        revenueGrowth,
        salesByCategory,
        salesByTime,
        conversionFunnel,
        topSellingProducts
      };
    } catch (error) {
      console.error('Error getting sales data:', error);
      return {};
    }
  }

  // SEO data with rankings and performance
  async getSEOData() {
    try {
      const seoCollection = this.db.collection('seoMetrics');
      const pageViewsCollection = this.db.collection('pageViews');
      
      const [
        seoMetrics,
        keywordRankings,
        pagePerformance,
        backlinks,
        technicalSEO,
        contentSEO
      ] = await Promise.all([
        this.getSEOMetrics(),
        this.getKeywordRankings(),
        this.getPagePerformance(),
        this.getBacklinks(),
        this.getTechnicalSEO(),
        this.getContentSEO()
      ]);

      return {
        metrics: seoMetrics,
        keywordRankings,
        pagePerformance,
        backlinks,
        technical: technicalSEO,
        content: contentSEO
      };
    } catch (error) {
      console.error('Error getting SEO data:', error);
      return {};
    }
  }

  // Geolocation data with user locations
  async getGeolocationData() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const usersCollection = this.db.collection('users');
      
      const [
        userLocations,
        trafficByCountry,
        trafficByCity,
        timezoneDistribution,
        languageDistribution,
        deviceLocations
      ] = await Promise.all([
        this.getUserLocations(),
        this.getTrafficByCountry(),
        this.getTrafficByCity(),
        this.getTimezoneDistribution(),
        this.getLanguageDistribution(),
        this.getDeviceLocations()
      ]);

      return {
        userLocations,
        trafficByCountry,
        trafficByCity,
        timezoneDistribution,
        languageDistribution,
        deviceLocations
      };
    } catch (error) {
      console.error('Error getting geolocation data:', error);
      return {};
    }
  }

  // Performance data with speed and optimization
  async getPerformanceData() {
    try {
      const performanceCollection = this.db.collection('performanceMetrics');
      const pageViewsCollection = this.db.collection('pageViews');
      
      const [
        pageLoadTimes,
        coreWebVitals,
        serverPerformance,
        databasePerformance,
        cachePerformance,
        cdnPerformance
      ] = await Promise.all([
        this.getPageLoadTimes(),
        this.getCoreWebVitals(),
        this.getServerPerformance(),
        this.getDatabasePerformance(),
        this.getCachePerformance(),
        this.getCDNPerformance()
      ]);

      return {
        pageLoadTimes,
        coreWebVitals,
        server: serverPerformance,
        database: databasePerformance,
        cache: cachePerformance,
        cdn: cdnPerformance
      };
    } catch (error) {
      console.error('Error getting performance data:', error);
      return {};
    }
  }

  // Inventory data with stock levels and movements
  async getInventoryData() {
    try {
      const inventoryCollection = this.db.collection('inventory');
      const stockMovementsCollection = this.db.collection('stockMovements');
      
      const [
        inventoryMetrics,
        stockMovements,
        lowStockItems,
        supplierPerformance,
        reorderSuggestions
      ] = await Promise.all([
        this.getInventoryMetrics(),
        this.getStockMovements(),
        this.getLowStockItems(),
        this.getSupplierPerformance(),
        this.getReorderSuggestions()
      ]);

      return {
        metrics: inventoryMetrics,
        movements: stockMovements,
        lowStockItems,
        supplierPerformance,
        reorderSuggestions
      };
    } catch (error) {
      console.error('Error getting inventory data:', error);
      return {};
    }
  }

  // Search data with queries and analytics
  async getSearchData() {
    try {
      const searchCollection = this.db.collection('search_queries');
      const searchAnalyticsCollection = this.db.collection('searchAnalytics');
      
      const [
        searchQueries,
        searchTrends,
        searchPerformance,
        noResultsQueries,
        searchSuggestions
      ] = await Promise.all([
        this.getSearchQueries(),
        this.getSearchTrends(),
        this.getSearchPerformance(),
        this.getNoResultsQueries(),
        this.getSearchSuggestions()
      ]);

      return {
        queries: searchQueries,
        trends: searchTrends,
        performance: searchPerformance,
        noResults: noResultsQueries,
        suggestions: searchSuggestions
      };
    } catch (error) {
      console.error('Error getting search data:', error);
      return {};
    }
  }

  // Page tracking data with detailed analytics
  async getPageTrackingData() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      
      const [
        pageViews,
        popularPages,
        pagePerformance,
        userJourney,
        exitPages,
        entryPages
      ] = await Promise.all([
        this.getPageViews(),
        this.getPopularPages(),
        this.getPagePerformance(),
        this.getUserJourney(),
        this.getExitPages(),
        this.getEntryPages()
      ]);

      return {
        pageViews,
        popularPages,
        performance: pagePerformance,
        userJourney,
        exitPages,
        entryPages
      };
    } catch (error) {
      console.error('Error getting page tracking data:', error);
      return {};
    }
  }

  // User preferences data
  async getUserPreferencesData() {
    try {
      const preferencesCollection = this.db.collection('userPreferences');
      
      const [
        genderDistribution,
        sizeDistribution,
        preferenceTrends,
        personalizationData
      ] = await Promise.all([
        this.getGenderDistribution(),
        this.getSizeDistribution(),
        this.getPreferenceTrends(),
        this.getPersonalizationData()
      ]);

      return {
        genderDistribution,
        sizeDistribution,
        trends: preferenceTrends,
        personalization: personalizationData
      };
    } catch (error) {
      console.error('Error getting user preferences data:', error);
      return {};
    }
  }

  // Real-time data
  async getRealTimeData() {
    try {
      const [
        currentUsers,
        currentSessions,
        realTimeEvents,
        liveChatData,
        realTimeSales
      ] = await Promise.all([
        this.getCurrentUsers(),
        this.getCurrentSessions(),
        this.getRealTimeEvents(),
        this.getLiveChatData(),
        this.getRealTimeSales()
      ]);

      return {
        currentUsers,
        currentSessions,
        events: realTimeEvents,
        liveChat: liveChatData,
        sales: realTimeSales
      };
    } catch (error) {
      console.error('Error getting real-time data:', error);
      return {};
    }
  }

  // Financial data with detailed metrics
  async getFinancialData() {
    try {
      const [
        revenueMetrics,
        costAnalysis,
        profitMargins,
        financialTrends,
        budgetAnalysis
      ] = await Promise.all([
        this.getRevenueMetrics(),
        this.getCostAnalysis(),
        this.getProfitMargins(),
        this.getFinancialTrends(),
        this.getBudgetAnalysis()
      ]);

      return {
        revenue: revenueMetrics,
        costs: costAnalysis,
        margins: profitMargins,
        trends: financialTrends,
        budget: budgetAnalysis
      };
    } catch (error) {
      console.error('Error getting financial data:', error);
      return {};
    }
  }

  // Helper methods for specific data collection
  async getProductsByCategory() {
    try {
      const productsCollection = this.db.collection('products');
      return await productsCollection.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  async getProductsByBrand() {
    try {
      const productsCollection = this.db.collection('products');
      return await productsCollection.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting products by brand:', error);
      return [];
    }
  }

  async getPriceDistribution() {
    try {
      const productsCollection = this.db.collection('products');
      return await productsCollection.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting price distribution:', error);
      return [];
    }
  }

  async getStockLevels() {
    try {
      const productsCollection = this.db.collection('products');
      return await productsCollection.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: '$stock' },
            outOfStock: {
              $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
            },
            lowStock: {
              $sum: { $cond: [{ $lte: ['$stock', 5] }, 1, 0] }
            },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting stock levels:', error);
      return [];
    }
  }

  async getRecentProducts() {
    try {
      const productsCollection = this.db.collection('products');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return await productsCollection.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });
    } catch (error) {
      console.error('Error getting recent products:', error);
      return 0;
    }
  }

  async getTopSellingProducts() {
    try {
      const productsCollection = this.db.collection('products');
      return await productsCollection.find({ isActive: true })
        .sort({ salesCount: -1 })
        .limit(10)
        .toArray();
    } catch (error) {
      console.error('Error getting top selling products:', error);
      return [];
    }
  }

  async getProductPerformance() {
    try {
      const productsCollection = this.db.collection('products');
      return await productsCollection.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            averageSalesCount: { $avg: '$salesCount' },
            totalSalesCount: { $sum: '$salesCount' },
            averagePrice: { $avg: '$price' },
            averageStock: { $avg: '$stock' }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting product performance:', error);
      return [];
    }
  }

  async getActiveUsers() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const uniqueUsers = await pageViewsCollection.distinct('userId', {
        timestamp: { $gte: oneDayAgo }
      });
      return uniqueUsers.length;
    } catch (error) {
      console.error('Error getting active users:', error);
      return 0;
    }
  }

  async getNewUsersToday() {
    try {
      const usersCollection = this.db.collection('users');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await usersCollection.countDocuments({
        createdAt: { $gte: today }
      });
    } catch (error) {
      console.error('Error getting new users today:', error);
      return 0;
    }
  }

  async getNewUsersThisWeek() {
    try {
      const usersCollection = this.db.collection('users');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return await usersCollection.countDocuments({
        createdAt: { $gte: oneWeekAgo }
      });
    } catch (error) {
      console.error('Error getting new users this week:', error);
      return 0;
    }
  }

  async getNewUsersThisMonth() {
    try {
      const usersCollection = this.db.collection('users');
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return await usersCollection.countDocuments({
        createdAt: { $gte: oneMonthAgo }
      });
    } catch (error) {
      console.error('Error getting new users this month:', error);
      return 0;
    }
  }

  async getUserGrowthRate() {
    try {
      const usersCollection = this.db.collection('users');
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      const [thisMonthUsers, lastMonthUsers] = await Promise.all([
        usersCollection.countDocuments({ createdAt: { $gte: thisMonth } }),
        usersCollection.countDocuments({ 
          createdAt: { $gte: lastMonth, $lt: thisMonth } 
        })
      ]);

      return lastMonthUsers > 0 ? 
        ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0;
    } catch (error) {
      console.error('Error getting user growth rate:', error);
      return 0;
    }
  }

  async getUserDemographics() {
    try {
      const preferencesCollection = this.db.collection('userPreferences');
      return await preferencesCollection.aggregate([
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting user demographics:', error);
      return [];
    }
  }

  async getUserBehavior() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      return await pageViewsCollection.aggregate([
        {
          $group: {
            _id: null,
            averageSessionDuration: { $avg: '$sessionDuration' },
            averagePagesPerSession: { $avg: '$pagesPerSession' },
            totalSessions: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            averageSessionDuration: 1,
            averagePagesPerSession: 1,
            totalSessions: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting user behavior:', error);
      return [];
    }
  }

  async getUserEngagement() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneDayAgo } } },
        {
          $group: {
            _id: null,
            totalPageViews: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            averageBounceRate: { $avg: '$bounceRate' },
            averageTimeOnPage: { $avg: '$timeOnPage' }
          }
        },
        {
          $project: {
            totalPageViews: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            averageBounceRate: 1,
            averageTimeOnPage: 1
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting user engagement:', error);
      return [];
    }
  }

  // Sales data methods
  async getTotalSales() {
    try {
      const ordersCollection = this.db.collection('orders');
      return await ordersCollection.countDocuments({ status: 'completed' });
    } catch (error) {
      console.error('Error getting total sales:', error);
      return 0;
    }
  }

  async getTotalRevenue() {
    try {
      const ordersCollection = this.db.collection('orders');
      const result = await ordersCollection.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]).toArray();
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error getting total revenue:', error);
      return 0;
    }
  }

  async getAverageOrderValue() {
    try {
      const ordersCollection = this.db.collection('orders');
      const result = await ordersCollection.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, average: { $avg: '$total' } } }
      ]).toArray();
      return result[0]?.average || 0;
    } catch (error) {
      console.error('Error getting average order value:', error);
      return 0;
    }
  }

  async getRevenueThisMonth() {
    try {
      const ordersCollection = this.db.collection('orders');
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const result = await ordersCollection.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: thisMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]).toArray();
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error getting revenue this month:', error);
      return 0;
    }
  }

  async getRevenueLastMonth() {
    try {
      const ordersCollection = this.db.collection('orders');
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const result = await ordersCollection.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: lastMonth, $lt: thisMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]).toArray();
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error getting revenue last month:', error);
      return 0;
    }
  }

  async getRevenueGrowth() {
    try {
      const [thisMonth, lastMonth] = await Promise.all([
        this.getRevenueThisMonth(),
        this.getRevenueLastMonth()
      ]);
      
      return lastMonth > 0 ? 
        ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0;
    } catch (error) {
      console.error('Error getting revenue growth:', error);
      return 0;
    }
  }

  async getSalesByCategory() {
    try {
      const ordersCollection = this.db.collection('orders');
      return await ordersCollection.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.category',
            totalSales: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting sales by category:', error);
      return [];
    }
  }

  async getSalesByTime() {
    try {
      const ordersCollection = this.db.collection('orders');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await ordersCollection.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: oneWeekAgo }
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]).toArray();
    } catch (error) {
      console.error('Error getting sales by time:', error);
      return [];
    }
  }

  async getConversionFunnel() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const ordersCollection = this.db.collection('orders');
      
      const [visitors, addToCart, checkout, completed] = await Promise.all([
        pageViewsCollection.distinct('userId').then(users => users.length),
        pageViewsCollection.countDocuments({ page: '/cart' }),
        pageViewsCollection.countDocuments({ page: '/checkout' }),
        ordersCollection.countDocuments({ status: 'completed' })
      ]);

      return {
        visitors,
        addToCart,
        checkout,
        completed,
        conversionRate: visitors > 0 ? ((completed / visitors) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      return {};
    }
  }

  // SEO data methods
  async getSEOMetrics() {
    try {
      const seoCollection = this.db.collection('seoMetrics');
      return await seoCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting SEO metrics:', error);
      return {};
    }
  }

  async getKeywordRankings() {
    try {
      const seoCollection = this.db.collection('keywordRankings');
      return await seoCollection.find({}).sort({ position: 1 }).limit(20).toArray();
    } catch (error) {
      console.error('Error getting keyword rankings:', error);
      return [];
    }
  }

  async getPagePerformance() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      return await pageViewsCollection.aggregate([
        {
          $group: {
            _id: '$page',
            views: { $sum: 1 },
            avgTimeOnPage: { $avg: '$timeOnPage' },
            bounceRate: { $avg: '$bounceRate' }
          }
        },
        { $sort: { views: -1 } },
        { $limit: 20 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting page performance:', error);
      return [];
    }
  }

  async getBacklinks() {
    try {
      const seoCollection = this.db.collection('backlinks');
      return await seoCollection.find({}).sort({ domainAuthority: -1 }).limit(50).toArray();
    } catch (error) {
      console.error('Error getting backlinks:', error);
      return [];
    }
  }

  async getTechnicalSEO() {
    try {
      const seoCollection = this.db.collection('technicalSEO');
      return await seoCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting technical SEO:', error);
      return {};
    }
  }

  async getContentSEO() {
    try {
      const seoCollection = this.db.collection('contentSEO');
      return await seoCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting content SEO:', error);
      return {};
    }
  }

  // Geolocation data methods
  async getUserLocations() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const views = await pageViewsCollection.find({
        timestamp: { $gte: oneWeekAgo },
        ip: { $exists: true }
      }).toArray();

      const locations = views.map(view => {
        const geo = geoip.lookup(view.ip);
        return {
          ip: view.ip,
          country: geo?.country || 'Unknown',
          city: geo?.city || 'Unknown',
          region: geo?.region || 'Unknown',
          timezone: geo?.timezone || 'Unknown',
          coordinates: geo?.ll || [0, 0]
        };
      });

      return locations;
    } catch (error) {
      console.error('Error getting user locations:', error);
      return [];
    }
  }

  async getTrafficByCountry() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const views = await pageViewsCollection.find({
        timestamp: { $gte: oneWeekAgo },
        ip: { $exists: true }
      }).toArray();

      const countryStats = {};
      views.forEach(view => {
        const geo = geoip.lookup(view.ip);
        const country = geo?.country || 'Unknown';
        countryStats[country] = (countryStats[country] || 0) + 1;
      });

      return Object.entries(countryStats)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    } catch (error) {
      console.error('Error getting traffic by country:', error);
      return [];
    }
  }

  async getTrafficByCity() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const views = await pageViewsCollection.find({
        timestamp: { $gte: oneWeekAgo },
        ip: { $exists: true }
      }).toArray();

      const cityStats = {};
      views.forEach(view => {
        const geo = geoip.lookup(view.ip);
        const city = geo?.city || 'Unknown';
        const country = geo?.country || 'Unknown';
        const key = `${city}, ${country}`;
        cityStats[key] = (cityStats[key] || 0) + 1;
      });

      return Object.entries(cityStats)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    } catch (error) {
      console.error('Error getting traffic by city:', error);
      return [];
    }
  }

  async getTimezoneDistribution() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const views = await pageViewsCollection.find({
        timestamp: { $gte: oneWeekAgo },
        ip: { $exists: true }
      }).toArray();

      const timezoneStats = {};
      views.forEach(view => {
        const geo = geoip.lookup(view.ip);
        const timezone = geo?.timezone || 'Unknown';
        timezoneStats[timezone] = (timezoneStats[timezone] || 0) + 1;
      });

      return Object.entries(timezoneStats)
        .map(([timezone, count]) => ({ timezone, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting timezone distribution:', error);
      return [];
    }
  }

  async getLanguageDistribution() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting language distribution:', error);
      return [];
    }
  }

  async getDeviceLocations() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        {
          $group: {
            _id: {
              device: '$deviceType',
              country: '$country'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting device locations:', error);
      return [];
    }
  }

  // Performance data methods
  async getPageLoadTimes() {
    try {
      const performanceCollection = this.db.collection('performanceMetrics');
      return await performanceCollection.aggregate([
        {
          $group: {
            _id: '$page',
            avgLoadTime: { $avg: '$loadTime' },
            minLoadTime: { $min: '$loadTime' },
            maxLoadTime: { $max: '$loadTime' },
            count: { $sum: 1 }
          }
        },
        { $sort: { avgLoadTime: -1 } },
        { $limit: 20 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting page load times:', error);
      return [];
    }
  }

  async getCoreWebVitals() {
    try {
      const performanceCollection = this.db.collection('coreWebVitals');
      return await performanceCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting core web vitals:', error);
      return {};
    }
  }

  async getServerPerformance() {
    try {
      const performanceCollection = this.db.collection('serverMetrics');
      return await performanceCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting server performance:', error);
      return {};
    }
  }

  async getDatabasePerformance() {
    try {
      const performanceCollection = this.db.collection('databaseMetrics');
      return await performanceCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting database performance:', error);
      return {};
    }
  }

  async getCachePerformance() {
    try {
      const performanceCollection = this.db.collection('cacheMetrics');
      return await performanceCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting cache performance:', error);
      return {};
    }
  }

  async getCDNPerformance() {
    try {
      const performanceCollection = this.db.collection('cdnMetrics');
      return await performanceCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting CDN performance:', error);
      return {};
    }
  }

  // Inventory data methods
  async getInventoryMetrics() {
    try {
      const inventoryCollection = this.db.collection('inventory');
      return await inventoryCollection.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$currentStock', '$cost'] } },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ['$currentStock', '$reorderPoint'] }, 1, 0]
              }
            },
            outOfStockCount: {
              $sum: {
                $cond: [{ $eq: ['$currentStock', 0] }, 1, 0]
              }
            }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting inventory metrics:', error);
      return [];
    }
  }

  async getStockMovements() {
    try {
      const inventoryCollection = this.db.collection('inventory');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await inventoryCollection.aggregate([
        { $unwind: '$stockMovements' },
        { $match: { 'stockMovements.timestamp': { $gte: oneWeekAgo } } },
        { $sort: { 'stockMovements.timestamp': -1 } },
        { $limit: 100 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting stock movements:', error);
      return [];
    }
  }

  async getLowStockItems() {
    try {
      const inventoryCollection = this.db.collection('inventory');
      return await inventoryCollection.find({
        $or: [
          { currentStock: 0 },
          { $expr: { $lte: ['$currentStock', '$reorderPoint'] } }
        ],
        status: 'active'
      }).limit(20).toArray();
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  async getSupplierPerformance() {
    try {
      const suppliersCollection = this.db.collection('suppliers');
      return await suppliersCollection.find({ status: 'active' })
        .sort({ rating: -1 })
        .limit(10)
        .toArray();
    } catch (error) {
      console.error('Error getting supplier performance:', error);
      return [];
    }
  }

  async getReorderSuggestions() {
    try {
      const inventoryCollection = this.db.collection('inventory');
      return await inventoryCollection.find({
        $or: [
          { currentStock: 0 },
          { $expr: { $lte: ['$currentStock', '$reorderPoint'] } }
        ],
        status: 'active'
      }).limit(20).toArray();
    } catch (error) {
      console.error('Error getting reorder suggestions:', error);
      return [];
    }
  }

  // Search data methods
  async getSearchQueries() {
    try {
      const searchCollection = this.db.collection('search_queries');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await searchCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting search queries:', error);
      return [];
    }
  }

  async getSearchTrends() {
    try {
      const searchCollection = this.db.collection('search_queries');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await searchCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]).toArray();
    } catch (error) {
      console.error('Error getting search trends:', error);
      return [];
    }
  }

  async getSearchPerformance() {
    try {
      const searchCollection = this.db.collection('search_queries');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await searchCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            avgResultsPerSearch: { $avg: '$resultCount' },
            avgSearchTime: { $avg: '$searchTime' },
            noResultsCount: {
              $sum: { $cond: [{ $eq: ['$resultCount', 0] }, 1, 0] }
            }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting search performance:', error);
      return [];
    }
  }

  async getNoResultsQueries() {
    try {
      const searchCollection = this.db.collection('search_queries');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await searchCollection.find({
        timestamp: { $gte: oneWeekAgo },
        resultCount: 0
      }).sort({ timestamp: -1 }).limit(20).toArray();
    } catch (error) {
      console.error('Error getting no results queries:', error);
      return [];
    }
  }

  async getSearchSuggestions() {
    try {
      const searchCollection = this.db.collection('searchSuggestions');
      return await searchCollection.find({}).sort({ popularity: -1 }).limit(50).toArray();
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Page tracking data methods
  async getPageViews() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.countDocuments({
        timestamp: { $gte: oneWeekAgo }
      });
    } catch (error) {
      console.error('Error getting page views:', error);
      return 0;
    }
  }

  async getPopularPages() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $group: { _id: '$page', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 20 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting popular pages:', error);
      return [];
    }
  }

  async getPagePerformance() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        {
          $group: {
            _id: '$page',
            views: { $sum: 1 },
            avgTimeOnPage: { $avg: '$timeOnPage' },
            bounceRate: { $avg: '$bounceRate' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            views: 1,
            avgTimeOnPage: 1,
            bounceRate: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { views: -1 } },
        { $limit: 20 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting page performance:', error);
      return [];
    }
  }

  async getUserJourney() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $sort: { userId: 1, timestamp: 1 } },
        {
          $group: {
            _id: '$userId',
            pages: { $push: '$page' },
            sessionDuration: { $sum: '$timeOnPage' }
          }
        },
        { $limit: 100 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting user journey:', error);
      return [];
    }
  }

  async getExitPages() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $sort: { userId: 1, timestamp: -1 } },
        {
          $group: {
            _id: '$userId',
            lastPage: { $first: '$page' }
          }
        },
        { $group: { _id: '$lastPage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting exit pages:', error);
      return [];
    }
  }

  async getEntryPages() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await pageViewsCollection.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $sort: { userId: 1, timestamp: 1 } },
        {
          $group: {
            _id: '$userId',
            firstPage: { $first: '$page' }
          }
        },
        { $group: { _id: '$firstPage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray();
    } catch (error) {
      console.error('Error getting entry pages:', error);
      return [];
    }
  }

  // User preferences data methods
  async getGenderDistribution() {
    try {
      const preferencesCollection = this.db.collection('userPreferences');
      return await preferencesCollection.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
    } catch (error) {
      console.error('Error getting gender distribution:', error);
      return [];
    }
  }

  async getSizeDistribution() {
    try {
      const preferencesCollection = this.db.collection('userPreferences');
      return await preferencesCollection.aggregate([
        { $group: { _id: '$clothingSize', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
    } catch (error) {
      console.error('Error getting size distribution:', error);
      return [];
    }
  }

  async getPreferenceTrends() {
    try {
      const preferencesCollection = this.db.collection('userPreferences');
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      return await preferencesCollection.aggregate([
        { $match: { createdAt: { $gte: oneMonthAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]).toArray();
    } catch (error) {
      console.error('Error getting preference trends:', error);
      return [];
    }
  }

  async getPersonalizationData() {
    try {
      const preferencesCollection = this.db.collection('userPreferences');
      return await preferencesCollection.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            avgPreferences: { $avg: { $size: { $objectToArray: '$$ROOT' } } },
            completionRate: {
              $avg: {
                $cond: [
                  { $and: ['$gender', '$clothingSize', '$shoeSize'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error getting personalization data:', error);
      return [];
    }
  }

  // Real-time data methods
  async getCurrentUsers() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const uniqueUsers = await pageViewsCollection.distinct('userId', {
        timestamp: { $gte: fiveMinutesAgo }
      });
      return uniqueUsers.length;
    } catch (error) {
      console.error('Error getting current users:', error);
      return 0;
    }
  }

  async getCurrentSessions() {
    try {
      const pageViewsCollection = this.db.collection('pageViews');
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return await pageViewsCollection.countDocuments({
        timestamp: { $gte: fiveMinutesAgo }
      });
    } catch (error) {
      console.error('Error getting current sessions:', error);
      return 0;
    }
  }

  async getRealTimeEvents() {
    try {
      const eventsCollection = this.db.collection('realTimeEvents');
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return await eventsCollection.find({
        timestamp: { $gte: fiveMinutesAgo }
      }).sort({ timestamp: -1 }).limit(50).toArray();
    } catch (error) {
      console.error('Error getting real-time events:', error);
      return [];
    }
  }

  async getLiveChatData() {
    try {
      const chatCollection = this.db.collection('liveChat');
      return await chatCollection.find({ status: 'active' }).toArray();
    } catch (error) {
      console.error('Error getting live chat data:', error);
      return [];
    }
  }

  async getRealTimeSales() {
    try {
      const ordersCollection = this.db.collection('orders');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const [totalSales, totalRevenue] = await Promise.all([
        ordersCollection.countDocuments({
          status: 'completed',
          createdAt: { $gte: oneHourAgo }
        }),
        ordersCollection.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: { $gte: oneHourAgo }
            }
          },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]).toArray()
      ]);

      return {
        totalSales,
        totalRevenue: totalRevenue[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting real-time sales:', error);
      return { totalSales: 0, totalRevenue: 0 };
    }
  }

  // Financial data methods
  async getRevenueMetrics() {
    try {
      const ordersCollection = this.db.collection('orders');
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const [thisMonthRevenue, lastMonthRevenue, totalRevenue] = await Promise.all([
        this.getRevenueThisMonth(),
        this.getRevenueLastMonth(),
        this.getTotalRevenue()
      ]);

      return {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        total: totalRevenue,
        growth: lastMonthRevenue > 0 ? 
          ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      return {};
    }
  }

  async getCostAnalysis() {
    try {
      const inventoryCollection = this.db.collection('inventory');
      const ordersCollection = this.db.collection('orders');
      
      const [inventoryCosts, operationalCosts] = await Promise.all([
        inventoryCollection.aggregate([
          { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$cost'] } } } }
        ]).toArray(),
        ordersCollection.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$shippingCost' } } }
        ]).toArray()
      ]);

      return {
        inventory: inventoryCosts[0]?.total || 0,
        operational: operationalCosts[0]?.total || 0,
        total: (inventoryCosts[0]?.total || 0) + (operationalCosts[0]?.total || 0)
      };
    } catch (error) {
      console.error('Error getting cost analysis:', error);
      return {};
    }
  }

  async getProfitMargins() {
    try {
      const ordersCollection = this.db.collection('orders');
      const inventoryCollection = this.db.collection('inventory');
      
      const [revenue, costs] = await Promise.all([
        this.getTotalRevenue(),
        this.getCostAnalysis()
      ]);

      const profit = revenue - costs.total;
      const margin = revenue > 0 ? (profit / revenue * 100).toFixed(1) : 0;

      return {
        revenue,
        costs: costs.total,
        profit,
        margin
      };
    } catch (error) {
      console.error('Error getting profit margins:', error);
      return {};
    }
  }

  async getFinancialTrends() {
    try {
      const ordersCollection = this.db.collection('orders');
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      
      return await ordersCollection.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: oneYearAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]).toArray();
    } catch (error) {
      console.error('Error getting financial trends:', error);
      return [];
    }
  }

  async getBudgetAnalysis() {
    try {
      const budgetCollection = this.db.collection('budgets');
      return await budgetCollection.findOne({}, { sort: { createdAt: -1 } }) || {};
    } catch (error) {
      console.error('Error getting budget analysis:', error);
      return {};
    }
  }
}

module.exports = new ComprehensiveDataService();
