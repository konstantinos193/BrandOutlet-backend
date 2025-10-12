const { connectDB } = require('../config/database');
const cacheService = require('./cacheService');

class RealTimeService {
  constructor() {
    this.db = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    if (!this.db) {
      this.db = await connectDB();
    }
  }

  // Get cached data or generate new data using Redis
  async getCachedData(key, generator, ttl = this.cacheTimeout) {
    return await cacheService.cacheWithTTL(key, generator, ttl);
  }

  // Generate real-time dashboard metrics
  async generateRealTimeMetrics() {
    await this.initialize();
    
    const cacheKey = 'realtime-metrics';
    return this.getCachedData(cacheKey, async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Generate mock real-time data
      const metrics = {
        // Current session metrics
        currentUsers: Math.floor(Math.random() * 500) + 100,
        activeSessions: Math.floor(Math.random() * 200) + 50,
        pageViews: Math.floor(Math.random() * 1000) + 500,
        
        // Revenue metrics
        todayRevenue: Math.floor(Math.random() * 50000) + 10000,
        hourlyRevenue: Math.floor(Math.random() * 5000) + 1000,
        conversionRate: (Math.random() * 5 + 2).toFixed(2),
        avgOrderValue: Math.floor(Math.random() * 200) + 100,
        
        // Product metrics
        totalProducts: Math.floor(Math.random() * 10000) + 5000,
        lowStockProducts: Math.floor(Math.random() * 50) + 10,
        outOfStockProducts: Math.floor(Math.random() * 20) + 5,
        
        // User metrics
        newUsersToday: Math.floor(Math.random() * 100) + 20,
        returningUsers: Math.floor(Math.random() * 200) + 100,
        userGrowthRate: (Math.random() * 20 + 5).toFixed(1),
        
        // Performance metrics
        avgPageLoadTime: (Math.random() * 2 + 1).toFixed(2),
        bounceRate: (Math.random() * 20 + 30).toFixed(1),
        sessionDuration: Math.floor(Math.random() * 300) + 120,
        
        // Geographic data
        topCountries: [
          { country: 'United States', users: Math.floor(Math.random() * 1000) + 500, revenue: Math.floor(Math.random() * 20000) + 10000 },
          { country: 'United Kingdom', users: Math.floor(Math.random() * 500) + 200, revenue: Math.floor(Math.random() * 10000) + 5000 },
          { country: 'Canada', users: Math.floor(Math.random() * 300) + 100, revenue: Math.floor(Math.random() * 8000) + 3000 },
          { country: 'Germany', users: Math.floor(Math.random() * 400) + 150, revenue: Math.floor(Math.random() * 12000) + 4000 },
          { country: 'France', users: Math.floor(Math.random() * 350) + 120, revenue: Math.floor(Math.random() * 10000) + 3500 }
        ],
        
        // Device breakdown
        deviceBreakdown: [
          { device: 'Desktop', percentage: 45, users: Math.floor(Math.random() * 500) + 200 },
          { device: 'Mobile', percentage: 40, users: Math.floor(Math.random() * 500) + 180 },
          { device: 'Tablet', percentage: 15, users: Math.floor(Math.random() * 200) + 80 }
        ],
        
        // Top selling products (last hour)
        topSellingProducts: this.generateTopSellingProducts(),
        
        // Recent orders
        recentOrders: this.generateRecentOrders(),
        
        // Alerts and notifications
        alerts: this.generateAlerts(),
        
        // System health
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          responseTime: (Math.random() * 100 + 50).toFixed(0),
          errorRate: (Math.random() * 0.5).toFixed(2)
        },
        
        lastUpdated: now.toISOString()
      };
      
      return metrics;
    }, 30000); // 30 second cache for real-time data
  }

  // Generate top selling products
  generateTopSellingProducts() {
    const products = [
      'Nike Air Jordan 1 Retro High',
      'Supreme Box Logo Hoodie',
      'Yeezy 350 V2 Cream White',
      'Off-White x Nike Air Presto',
      'Travis Scott x Jordan 1 Low',
      'Dior x Jordan 1 High',
      'Gucci Ace Sneakers',
      'Louis Vuitton Archlight',
      'Nike Dunk Low Panda',
      'Adidas Yeezy Boost 700'
    ];
    
    return products.slice(0, 5).map((product, index) => ({
      name: product,
      sales: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 10000) + 2000,
      rank: index + 1,
      change: (Math.random() * 40 - 20).toFixed(1) + '%'
    }));
  }

  // Generate recent orders
  generateRecentOrders() {
    const orders = [];
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      const orderTime = new Date(now.getTime() - Math.random() * 60 * 60 * 1000);
      orders.push({
        id: `ORD-${Date.now()}-${i}`,
        customer: `Customer ${Math.floor(Math.random() * 1000) + 1}`,
        product: 'Nike Air Jordan 1',
        amount: Math.floor(Math.random() * 500) + 100,
        status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
        timestamp: orderTime.toISOString(),
        country: ['US', 'UK', 'CA', 'DE', 'FR'][Math.floor(Math.random() * 5)]
      });
    }
    
    return orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Generate alerts
  generateAlerts() {
    const alerts = [];
    
    // Randomly generate some alerts
    if (Math.random() > 0.7) {
      alerts.push({
        id: 'alert-1',
        type: 'warning',
        title: 'High Bounce Rate',
        message: 'Bounce rate is 15% higher than usual',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }
    
    if (Math.random() > 0.8) {
      alerts.push({
        id: 'alert-2',
        type: 'info',
        title: 'Peak Traffic',
        message: 'Traffic is 25% higher than average',
        severity: 'low',
        timestamp: new Date().toISOString()
      });
    }
    
    if (Math.random() > 0.9) {
      alerts.push({
        id: 'alert-3',
        type: 'error',
        title: 'Low Stock Alert',
        message: '5 products are running low on stock',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  // Get live activity feed
  async getLiveActivityFeed(limit = 50) {
    await this.initialize();
    
    const cacheKey = 'live-activity';
    return this.getCachedData(cacheKey, async () => {
      const activities = [];
      const now = new Date();
      
      const activityTypes = [
        'user_registered',
        'product_viewed',
        'order_placed',
        'payment_completed',
        'product_added',
        'review_submitted',
        'search_performed',
        'cart_abandoned'
      ];
      
      for (let i = 0; i < limit; i++) {
        const activityTime = new Date(now.getTime() - Math.random() * 60 * 60 * 1000);
        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        activities.push({
          id: `activity-${i}`,
          type,
          user: `User ${Math.floor(Math.random() * 1000) + 1}`,
          description: this.getActivityDescription(type),
          timestamp: activityTime.toISOString(),
          metadata: this.getActivityMetadata(type)
        });
      }
      
      return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, 10000); // 10 second cache for live data
  }

  // Get activity description
  getActivityDescription(type) {
    const descriptions = {
      'user_registered': 'New user registered',
      'product_viewed': 'Viewed product',
      'order_placed': 'Placed an order',
      'payment_completed': 'Completed payment',
      'product_added': 'Added product to cart',
      'review_submitted': 'Submitted a review',
      'search_performed': 'Performed a search',
      'cart_abandoned': 'Abandoned cart'
    };
    
    return descriptions[type] || 'Unknown activity';
  }

  // Get activity metadata
  getActivityMetadata(type) {
    const metadata = {
      'user_registered': { source: 'organic' },
      'product_viewed': { product: 'Nike Air Jordan 1', price: 150 },
      'order_placed': { orderId: `ORD-${Date.now()}`, amount: 250 },
      'payment_completed': { method: 'credit_card', amount: 250 },
      'product_added': { product: 'Supreme Hoodie', quantity: 1 },
      'review_submitted': { rating: 5, product: 'Yeezy 350' },
      'search_performed': { query: 'Nike Jordan', results: 25 },
      'cart_abandoned': { items: 2, value: 300 }
    };
    
    return metadata[type] || {};
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    await this.initialize();
    
    const cacheKey = 'performance-metrics';
    return this.getCachedData(cacheKey, async () => {
      const now = new Date();
      const metrics = [];
      
      // Generate hourly performance data for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        
        metrics.push({
          timestamp: hour.toISOString(),
          responseTime: Math.floor(Math.random() * 200) + 50,
          throughput: Math.floor(Math.random() * 1000) + 500,
          errorRate: Math.random() * 2,
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          activeConnections: Math.floor(Math.random() * 500) + 100
        });
      }
      
      return metrics;
    }, 60000); // 1 minute cache
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = new RealTimeService();
