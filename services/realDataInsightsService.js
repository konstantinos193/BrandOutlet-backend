const { connectDB } = require('../config/database');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const aiInsightsGenerator = require('./aiInsightsGenerator');

class RealDataInsightsService {
  constructor() {
    this.db = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  async initialize() {
    if (!this.db) {
      const { db } = await connectDB();
      this.db = db;
    }
  }

  // Get cached data or generate new data
  async getCachedData(key, generator, ttl = this.cacheTimeout) {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }
    
    const data = await generator();
    this.cache.set(key, {
      data,
      timestamp: now
    });
    
    return data;
  }

  // Generate comprehensive insights from real data
  async generateInsights(focus = 'all', useAI = true) {
    await this.initialize();
    
    const cacheKey = `real-insights-${focus}-${useAI ? 'ai' : 'rule'}`;
    return this.getCachedData(cacheKey, async () => {
      // Get all real data
      const realData = await this.gatherAllRealData();
      
      let insights;
      if (useAI) {
        // Try AI generation first
        try {
          insights = await aiInsightsGenerator.generateAIInsights(realData, focus);
        } catch (error) {
          console.warn('AI generation failed, falling back to rule-based:', error.message);
          insights = await this.generateRuleBasedInsights(realData, focus);
        }
      } else {
        // Use rule-based generation
        insights = await this.generateRuleBasedInsights(realData, focus);
      }
      
      return {
        ...insights,
        dataSource: useAI ? 'ai-enhanced' : 'real-rule-based',
        realDataTimestamp: realData.timestamp
      };
    });
  }

  // Generate rule-based insights from real data
  async generateRuleBasedInsights(realData, focus) {
    const insights = [];
    
    // Generate different types of insights based on focus
    if (focus === 'all' || focus === 'sales') {
      insights.push(...await this.generateSalesInsights(realData));
    }
    
    if (focus === 'all' || focus === 'users') {
      insights.push(...await this.generateUserInsights(realData));
    }
    
    if (focus === 'all' || focus === 'performance') {
      insights.push(...await this.generatePerformanceInsights(realData));
    }
    
    if (focus === 'all' || focus === 'inventory') {
      insights.push(...await this.generateInventoryInsights(realData));
    }
    
    if (focus === 'all' || focus === 'marketing') {
      insights.push(...await this.generateMarketingInsights(realData));
    }
    
    // Sort by priority and confidence
    insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });
    
    return {
      insights: insights.slice(0, 20), // Limit to top 20 insights
      generatedAt: new Date().toISOString(),
      confidence: this.calculateOverallConfidence(insights),
      totalInsights: insights.length,
      focus,
      categories: this.getInsightCategories(insights)
    };
  }

  // Gather all real data from database
  async gatherAllRealData() {
    const [
      productStats,
      variantStats,
      pageTrackingData,
      seoMetrics,
      userPreferences
    ] = await Promise.all([
      this.getProductAnalytics(),
      this.getVariantAnalytics(),
      this.getPageTrackingData(),
      this.getSEOMetrics(),
      this.getUserPreferencesData()
    ]);

    return {
      products: productStats,
      variants: variantStats,
      pageTracking: pageTrackingData,
      seo: seoMetrics,
      userPreferences: userPreferences,
      timestamp: new Date()
    };
  }

  // Get real product analytics
  async getProductAnalytics() {
    const productsCollection = this.db.collection('products');
    const variantsCollection = this.db.collection('variants');
    
    const [
      totalProducts,
      activeProducts,
      verifiedProducts,
      recentProducts,
      productsByCategory,
      productsByBrand,
      priceDistribution,
      stockLevels
    ] = await Promise.all([
      productsCollection.countDocuments(),
      productsCollection.countDocuments({ isActive: true }),
      productsCollection.countDocuments({ 'authenticity.isVerified': true }),
      productsCollection.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      productsCollection.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      productsCollection.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      productsCollection.aggregate([
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            totalValue: { $sum: '$price' }
          }
        }
      ]).toArray(),
      variantsCollection.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: '$stock' },
            outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
            lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 5] }] }, 1, 0] } },
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
          }
        }
      ]).toArray()
    ]);

    return {
      totalProducts,
      activeProducts,
      verifiedProducts,
      recentProducts,
      verificationRate: totalProducts > 0 ? ((verifiedProducts / totalProducts) * 100).toFixed(1) : 0,
      productsByCategory: productsByCategory.slice(0, 10),
      productsByBrand: productsByBrand.slice(0, 10),
      priceStats: priceDistribution[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0, totalValue: 0 },
      stockStats: stockLevels[0] || { totalStock: 0, outOfStock: 0, lowStock: 0, totalValue: 0 }
    };
  }

  // Get real variant analytics
  async getVariantAnalytics() {
    const variantsCollection = this.db.collection('variants');
    
    const [
      totalVariants,
      activeVariants,
      stockDistribution,
      sizeDistribution,
      colorDistribution,
      conditionDistribution,
      priceAnalysis
    ] = await Promise.all([
      variantsCollection.countDocuments(),
      variantsCollection.countDocuments({ isActive: true }),
      variantsCollection.aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $eq: ['$stock', 0] }, then: 'outOfStock' },
                  { case: { $lte: ['$stock', 5] }, then: 'lowStock' },
                  { case: { $lte: ['$stock', 20] }, then: 'mediumStock' },
                  { case: { $gt: ['$stock', 20] }, then: 'highStock' }
                ],
                default: 'unknown'
              }
            },
            count: { $sum: 1 }
          }
        }
      ]).toArray(),
      variantsCollection.aggregate([
        { $group: { _id: '$size', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      variantsCollection.aggregate([
        { $group: { _id: '$color', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      variantsCollection.aggregate([
        { $group: { _id: '$condition', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      variantsCollection.aggregate([
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
          }
        }
      ]).toArray()
    ]);

    return {
      totalVariants,
      activeVariants,
      stockDistribution: this.formatDistribution(stockDistribution),
      sizeDistribution: this.formatDistribution(sizeDistribution),
      colorDistribution: this.formatDistribution(colorDistribution),
      conditionDistribution: this.formatDistribution(conditionDistribution),
      priceAnalysis: priceAnalysis[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0, totalValue: 0 }
    };
  }

  // Get page tracking data
  async getPageTrackingData() {
    const pageTrackingCollection = this.db.collection('pageTracking');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      todayStats,
      yesterdayStats,
      weeklyStats,
      topPages,
      topCountries,
      deviceStats
    ] = await Promise.all([
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: today } } },
        {
          $group: {
            _id: null,
            pageViews: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' }
          }
        }
      ]).toArray(),
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: yesterday, $lt: today } } },
        {
          $group: {
            _id: null,
            pageViews: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' }
          }
        }
      ]).toArray(),
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: lastWeek } } },
        {
          $group: {
            _id: null,
            pageViews: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' }
          }
        }
      ]).toArray(),
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: lastWeek } } },
        { $group: { _id: '$path', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 }
      ]).toArray(),
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: lastWeek } } },
        { $group: { _id: '$country', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 }
      ]).toArray(),
      pageTrackingCollection.aggregate([
        { $match: { timestamp: { $gte: lastWeek } } },
        { $group: { _id: '$device', views: { $sum: 1 } } },
        { $sort: { views: -1 } }
      ]).toArray()
    ]);

    const todayData = todayStats[0] || { pageViews: 0, uniqueSessions: [] };
    const yesterdayData = yesterdayStats[0] || { pageViews: 0, uniqueSessions: [] };
    const weeklyData = weeklyStats[0] || { pageViews: 0, uniqueSessions: [] };

    return {
      today: {
        pageViews: todayData.pageViews,
        uniqueSessions: todayData.uniqueSessions.length
      },
      yesterday: {
        pageViews: yesterdayData.pageViews,
        uniqueSessions: yesterdayData.uniqueSessions.length
      },
      weekly: {
        pageViews: weeklyData.pageViews,
        uniqueSessions: weeklyData.uniqueSessions.length
      },
      topPages,
      topCountries,
      deviceStats,
      growthRate: yesterdayData.pageViews > 0 ? 
        (((todayData.pageViews - yesterdayData.pageViews) / yesterdayData.pageViews) * 100).toFixed(1) : 0
    };
  }

  // Get SEO metrics
  async getSEOMetrics() {
    const seoCollection = this.db.collection('seoMetrics');
    
    const [
      totalMetrics,
      coreWebVitals,
      pagePerformance,
      seoEvents
    ] = await Promise.all([
      seoCollection.countDocuments(),
      seoCollection.aggregate([
        { $match: { metricType: 'core-web-vitals' } },
        {
          $group: {
            _id: '$metricName',
            values: { $push: '$value' },
            avg: { $avg: '$value' },
            min: { $min: '$value' },
            max: { $max: '$value' }
          }
        }
      ]).toArray(),
      seoCollection.aggregate([
        { $match: { metricType: 'page-performance' } },
        {
          $group: {
            _id: '$metricName',
            values: { $push: '$value' },
            avg: { $avg: '$value' }
          }
        }
      ]).toArray(),
      seoCollection.aggregate([
        { $match: { metricType: 'seo-event' } },
        {
          $group: {
            _id: '$metricName',
            count: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);

    return {
      totalMetrics,
      coreWebVitals: this.formatSEOMetrics(coreWebVitals),
      pagePerformance: this.formatSEOMetrics(pagePerformance),
      seoEvents: this.formatSEOMetrics(seoEvents)
    };
  }

  // Get user preferences data
  async getUserPreferencesData() {
    const userPrefsCollection = this.db.collection('userPreferences');
    
    const [
      totalUsers,
      genderDistribution,
      sizeDistribution,
      regionDistribution
    ] = await Promise.all([
      userPrefsCollection.countDocuments(),
      userPrefsCollection.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]).toArray(),
      userPrefsCollection.aggregate([
        { $group: { _id: '$clothingSize', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      userPrefsCollection.aggregate([
        { $group: { _id: '$region', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);

    return {
      totalUsers,
      genderDistribution: this.formatDistribution(genderDistribution),
      sizeDistribution: this.formatDistribution(sizeDistribution),
      regionDistribution: this.formatDistribution(regionDistribution)
    };
  }

  // Generate sales insights from real data
  async generateSalesInsights(realData) {
    const insights = [];
    const { products, variants, pageTracking } = realData;

    // Product performance insights
    if (products.verificationRate < 50) {
      insights.push({
        id: `sales-${Date.now()}-1`,
        type: 'sales',
        title: 'Low Product Verification Rate',
        content: `Only ${products.verificationRate}% of products are verified. Increasing verification can boost customer trust and sales.`,
        priority: 'high',
        confidence: 90,
        actionable: true,
        category: 'verification',
        metrics: {
          currentRate: products.verificationRate + '%',
          target: '80%',
          impact: 'High'
        }
      });
    }

    // Stock management insights
    if (variants.stockDistribution.outOfStock > 0) {
      insights.push({
        id: `sales-${Date.now()}-2`,
        type: 'sales',
        title: 'Out of Stock Items Detected',
        content: `${variants.stockDistribution.outOfStock} variants are out of stock. This could lead to lost sales opportunities.`,
        priority: 'high',
        confidence: 95,
        actionable: true,
        category: 'inventory',
        metrics: {
          outOfStock: variants.stockDistribution.outOfStock,
          totalVariants: variants.totalVariants,
          impact: 'High'
        }
      });
    }

    // Low stock alert
    if (variants.stockDistribution.lowStock > 0) {
      insights.push({
        id: `sales-${Date.now()}-3`,
        type: 'sales',
        title: 'Low Stock Alert',
        content: `${variants.stockDistribution.lowStock} variants have low stock (≤5 items). Consider restocking to avoid stockouts.`,
        priority: 'medium',
        confidence: 85,
        actionable: true,
        category: 'inventory',
        metrics: {
          lowStock: variants.stockDistribution.lowStock,
          totalVariants: variants.totalVariants,
          impact: 'Medium'
        }
      });
    }

    // Revenue potential insights
    const totalStockValue = variants.priceAnalysis.totalValue;
    if (totalStockValue > 0) {
      insights.push({
        id: `sales-${Date.now()}-4`,
        type: 'sales',
        title: 'Inventory Value Analysis',
        content: `Total inventory value is $${totalStockValue.toLocaleString()}. Average variant price is $${variants.priceAnalysis.avgPrice.toFixed(2)}.`,
        priority: 'low',
        confidence: 95,
        actionable: false,
        category: 'inventory',
        metrics: {
          totalValue: '$' + totalStockValue.toLocaleString(),
          avgPrice: '$' + variants.priceAnalysis.avgPrice.toFixed(2),
          totalVariants: variants.totalVariants
        }
      });
    }

    // Page views vs conversion insights
    if (pageTracking.today.pageViews > 0) {
      const conversionRate = (products.totalProducts / pageTracking.today.pageViews * 100).toFixed(2);
      if (parseFloat(conversionRate) < 1) {
        insights.push({
          id: `sales-${Date.now()}-5`,
          type: 'sales',
          title: 'Low Conversion Rate',
          content: `With ${pageTracking.today.pageViews} page views today and ${products.totalProducts} products, conversion rate is ${conversionRate}%. Consider improving product presentation.`,
          priority: 'medium',
          confidence: 80,
          actionable: true,
          category: 'conversion',
          metrics: {
            pageViews: pageTracking.today.pageViews,
            totalProducts: products.totalProducts,
            conversionRate: conversionRate + '%'
          }
        });
      }
    }

    return insights;
  }

  // Generate user insights from real data
  async generateUserInsights(realData) {
    const insights = [];
    const { userPreferences, pageTracking } = realData;

    // User growth insights
    if (pageTracking.growthRate > 0) {
      insights.push({
        id: `user-${Date.now()}-1`,
        type: 'users',
        title: 'Positive Traffic Growth',
        content: `Page views increased by ${pageTracking.growthRate}% compared to yesterday. This indicates growing user interest.`,
        priority: 'low',
        confidence: 85,
        actionable: false,
        category: 'growth',
        metrics: {
          growthRate: pageTracking.growthRate + '%',
          todayViews: pageTracking.today.pageViews,
          yesterdayViews: pageTracking.yesterday.pageViews
        }
      });
    } else if (pageTracking.growthRate < -10) {
      insights.push({
        id: `user-${Date.now()}-2`,
        type: 'users',
        title: 'Traffic Decline Alert',
        content: `Page views decreased by ${Math.abs(pageTracking.growthRate)}% compared to yesterday. Investigate potential issues.`,
        priority: 'high',
        confidence: 90,
        actionable: true,
        category: 'performance',
        metrics: {
          declineRate: Math.abs(pageTracking.growthRate) + '%',
          todayViews: pageTracking.today.pageViews,
          yesterdayViews: pageTracking.yesterday.pageViews
        }
      });
    }

    // User preferences insights
    if (userPreferences.totalUsers > 0) {
      const topGender = userPreferences.genderDistribution[0];
      const topSize = userPreferences.sizeDistribution[0];
      const topRegion = userPreferences.regionDistribution[0];

      if (topGender) {
        insights.push({
          id: `user-${Date.now()}-3`,
          type: 'users',
          title: 'User Demographics',
          content: `${topGender.count} users (${((topGender.count / userPreferences.totalUsers) * 100).toFixed(1)}%) are ${topGender._id}. Most popular size is ${topSize?._id || 'N/A'} and top region is ${topRegion?._id || 'N/A'}.`,
          priority: 'low',
          confidence: 95,
          actionable: false,
          category: 'demographics',
          metrics: {
            totalUsers: userPreferences.totalUsers,
            topGender: topGender._id,
            topSize: topSize?._id,
            topRegion: topRegion?._id
          }
        });
      }
    }

    // Device usage insights
    if (pageTracking.deviceStats.length > 0) {
      const topDevice = pageTracking.deviceStats[0];
      const mobilePercentage = pageTracking.deviceStats.find(d => d._id === 'Mobile')?.views || 0;
      const totalDeviceViews = pageTracking.deviceStats.reduce((sum, d) => sum + d.views, 0);
      const mobilePercent = totalDeviceViews > 0 ? ((mobilePercentage / totalDeviceViews) * 100).toFixed(1) : 0;

      if (parseFloat(mobilePercent) > 60) {
        insights.push({
          id: `user-${Date.now()}-4`,
          type: 'users',
          title: 'Mobile-First User Base',
          content: `${mobilePercent}% of users are on mobile devices. Ensure mobile experience is optimized.`,
          priority: 'medium',
          confidence: 90,
          actionable: true,
          category: 'mobile',
          metrics: {
            mobilePercentage: mobilePercent + '%',
            totalViews: totalDeviceViews,
            topDevice: topDevice._id
          }
        });
      }
    }

    return insights;
  }

  // Generate performance insights from real data
  async generatePerformanceInsights(realData) {
    const insights = [];
    const { seo, pageTracking } = realData;

    // Core Web Vitals insights
    if (seo.coreWebVitals.LCP && seo.coreWebVitals.LCP.avg > 2.5) {
      insights.push({
        id: `performance-${Date.now()}-1`,
        type: 'performance',
        title: 'Slow Largest Contentful Paint',
        content: `Average LCP is ${seo.coreWebVitals.LCP.avg.toFixed(2)}s, which is above the recommended 2.5s. Optimize images and reduce server response time.`,
        priority: 'high',
        confidence: 90,
        actionable: true,
        category: 'speed',
        metrics: {
          currentLCP: seo.coreWebVitals.LCP.avg.toFixed(2) + 's',
          target: '2.5s',
          impact: 'High'
        }
      });
    }

    // Page performance insights
    if (seo.pagePerformance.page_load_time && seo.pagePerformance.page_load_time.avg > 3) {
      insights.push({
        id: `performance-${Date.now()}-2`,
        type: 'performance',
        title: 'Slow Page Load Times',
        content: `Average page load time is ${seo.pagePerformance.page_load_time.avg.toFixed(2)}s. Consider optimizing images, enabling compression, or upgrading hosting.`,
        priority: 'medium',
        confidence: 85,
        actionable: true,
        category: 'speed',
        metrics: {
          currentTime: seo.pagePerformance.page_load_time.avg.toFixed(2) + 's',
          target: '3.0s',
          impact: 'Medium'
        }
      });
    }

    // SEO events insights
    if (seo.seoEvents.search && seo.seoEvents.search.count > 0) {
      insights.push({
        id: `performance-${Date.now()}-3`,
        type: 'performance',
        title: 'Search Activity Detected',
        content: `${seo.seoEvents.search.count} search queries have been tracked. Users are actively searching for content.`,
        priority: 'low',
        confidence: 95,
        actionable: false,
        category: 'engagement',
        metrics: {
          searchQueries: seo.seoEvents.search.count,
          totalMetrics: seo.totalMetrics
        }
      });
    }

    return insights;
  }

  // Generate inventory insights from real data
  async generateInventoryInsights(realData) {
    const insights = [];
    const { variants } = realData;

    // Stock distribution insights
    const stockStats = variants.stockDistribution;
    const totalVariants = variants.totalVariants;
    
    if (stockStats.outOfStock > 0) {
      const outOfStockPercent = ((stockStats.outOfStock / totalVariants) * 100).toFixed(1);
      insights.push({
        id: `inventory-${Date.now()}-1`,
        type: 'inventory',
        title: 'Stock Availability Issues',
        content: `${stockStats.outOfStock} variants (${outOfStockPercent}%) are out of stock. This represents lost sales opportunities.`,
        priority: 'high',
        confidence: 95,
        actionable: true,
        category: 'stock',
        metrics: {
          outOfStock: stockStats.outOfStock,
          percentage: outOfStockPercent + '%',
          totalVariants: totalVariants
        }
      });
    }

    // Size distribution insights
    if (variants.sizeDistribution.length > 0) {
      const topSize = variants.sizeDistribution[0];
      const sizeDiversity = variants.sizeDistribution.length;
      
      insights.push({
        id: `inventory-${Date.now()}-2`,
        type: 'inventory',
        title: 'Size Distribution Analysis',
        content: `Most popular size is ${topSize._id} with ${topSize.count} variants. You have ${sizeDiversity} different sizes in inventory.`,
        priority: 'low',
        confidence: 90,
        actionable: false,
        category: 'distribution',
        metrics: {
          topSize: topSize._id,
          topSizeCount: topSize.count,
          sizeDiversity: sizeDiversity
        }
      });
    }

    // Color distribution insights
    if (variants.colorDistribution.length > 0) {
      const topColor = variants.colorDistribution[0];
      const colorDiversity = variants.colorDistribution.length;
      
      insights.push({
        id: `inventory-${Date.now()}-3`,
        type: 'inventory',
        title: 'Color Preferences',
        content: `Most popular color is ${topColor._id} with ${topColor.count} variants. You offer ${colorDiversity} different colors.`,
        priority: 'low',
        confidence: 90,
        actionable: false,
        category: 'distribution',
        metrics: {
          topColor: topColor._id,
          topColorCount: topColor.count,
          colorDiversity: colorDiversity
        }
      });
    }

    return insights;
  }

  // Generate marketing insights from real data
  async generateMarketingInsights(realData) {
    const insights = [];
    const { pageTracking, products } = realData;

    // Geographic insights
    if (pageTracking.topCountries.length > 0) {
      const topCountry = pageTracking.topCountries[0];
      const totalViews = pageTracking.topCountries.reduce((sum, c) => sum + c.views, 0);
      const countryPercent = ((topCountry.views / totalViews) * 100).toFixed(1);
      
      insights.push({
        id: `marketing-${Date.now()}-1`,
        type: 'marketing',
        title: 'Geographic Focus',
        content: `${topCountry._id} generates ${countryPercent}% of your traffic (${topCountry.views} views). Consider localized marketing strategies.`,
        priority: 'medium',
        confidence: 85,
        actionable: true,
        category: 'geographic',
        metrics: {
          topCountry: topCountry._id,
          percentage: countryPercent + '%',
          views: topCountry.views,
          totalViews: totalViews
        }
      });
    }

    // Page popularity insights
    if (pageTracking.topPages.length > 0) {
      const topPage = pageTracking.topPages[0];
      const totalPageViews = pageTracking.topPages.reduce((sum, p) => sum + p.views, 0);
      const pagePercent = ((topPage.views / totalPageViews) * 100).toFixed(1);
      
      insights.push({
        id: `marketing-${Date.now()}-2`,
        type: 'marketing',
        title: 'Content Performance',
        content: `"${topPage._id}" is your most popular page with ${pagePercent}% of all views (${topPage.views} views). Leverage this content for marketing.`,
        priority: 'low',
        confidence: 90,
        actionable: true,
        category: 'content',
        metrics: {
          topPage: topPage._id,
          percentage: pagePercent + '%',
          views: topPage.views,
          totalViews: totalPageViews
        }
      });
    }

    // Brand diversity insights
    if (products.productsByBrand.length > 0) {
      const topBrand = products.productsByBrand[0];
      const brandDiversity = products.productsByBrand.length;
      const brandPercent = ((topBrand.count / products.totalProducts) * 100).toFixed(1);
      
      insights.push({
        id: `marketing-${Date.now()}-3`,
        type: 'marketing',
        title: 'Brand Portfolio Analysis',
        content: `${topBrand._id} represents ${brandPercent}% of your products (${topBrand.count} items). You carry ${brandDiversity} different brands.`,
        priority: 'low',
        confidence: 95,
        actionable: false,
        category: 'brands',
        metrics: {
          topBrand: topBrand._id,
          percentage: brandPercent + '%',
          brandCount: topBrand.count,
          brandDiversity: brandDiversity
        }
      });
    }

    return insights;
  }

  // Helper methods
  formatDistribution(distribution) {
    return distribution.map(item => ({
      _id: item._id,
      count: item.count
    }));
  }

  formatSEOMetrics(metrics) {
    const result = {};
    metrics.forEach(metric => {
      result[metric._id] = {
        values: metric.values || [],
        avg: metric.avg || 0,
        min: metric.min || 0,
        max: metric.max || 0,
        count: metric.count || 0
      };
    });
    return result;
  }

  calculateOverallConfidence(insights) {
    if (insights.length === 0) return 0;
    
    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return Math.round(totalConfidence / insights.length);
  }

  getInsightCategories(insights) {
    const categories = {};
    insights.forEach(insight => {
      if (!categories[insight.category]) {
        categories[insight.category] = 0;
      }
      categories[insight.category]++;
    });
    return categories;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new RealDataInsightsService();
