const { getDB } = require('../config/database');

class SEOService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      this.db = getDB();
    }
  }

  // Get comprehensive SEO analytics
  async getSEOAnalytics(timeframe = '7d', page = null) {
    await this.init();
    
    const seoCollection = this.db.collection('seoMetrics');
    
    // Build query
    const query = {};
    if (page) {
      query.page = page;
    }
    
    // Add time filter
    const timeFilter = this.getTimeFilter(timeframe);
    if (timeFilter) {
      query.timestamp = { $gte: timeFilter };
    }

    const metrics = await seoCollection.find(query).toArray();
    
    return this.calculateSEOAnalytics(metrics);
  }

  // Get SEO insights and recommendations
  async getSEOInsights(timeframe = '7d') {
    await this.init();
    
    const analytics = await this.getSEOAnalytics(timeframe);
    return this.generateSEOInsights(analytics);
  }

  // Get Core Web Vitals summary
  async getCoreWebVitalsSummary(timeframe = '7d') {
    await this.init();
    
    const seoCollection = this.db.collection('seoMetrics');
    
    const query = {
      metricType: 'core-web-vitals',
      timestamp: { $gte: this.getTimeFilter(timeframe) }
    };

    const metrics = await seoCollection.find(query).toArray();
    
    const summary = {
      LCP: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      FID: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      CLS: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      FCP: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      TTFB: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 }
    };

    metrics.forEach(metric => {
      const metricName = metric.metricName;
      if (summary[metricName]) {
        summary[metricName].values.push(metric.value);
        
        const category = this.categorizeWebVital(metricName, metric.value);
        summary[metricName][category]++;
      }
    });

    // Calculate averages
    Object.keys(summary).forEach(metric => {
      const values = summary[metric].values;
      if (values.length > 0) {
        summary[metric].average = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    return summary;
  }

  // Get page performance metrics
  async getPagePerformanceMetrics(timeframe = '7d') {
    await this.init();
    
    const seoCollection = this.db.collection('seoMetrics');
    
    const query = {
      metricType: 'page-performance',
      timestamp: { $gte: this.getTimeFilter(timeframe) }
    };

    const metrics = await seoCollection.find(query).toArray();
    
    const performance = {
      loadTimes: [],
      imageLoadTimes: [],
      averageLoadTime: 0,
      pageStats: {}
    };

    metrics.forEach(metric => {
      if (metric.metricName === 'page_load_time') {
        performance.loadTimes.push(metric.value);
        
        if (!performance.pageStats[metric.page]) {
          performance.pageStats[metric.page] = { loadTimes: [] };
        }
        performance.pageStats[metric.page].loadTimes.push(metric.value);
      } else if (metric.metricName === 'image_load') {
        performance.imageLoadTimes.push(metric.value);
      }
    });

    // Calculate averages
    if (performance.loadTimes.length > 0) {
      performance.averageLoadTime = 
        performance.loadTimes.reduce((sum, time) => sum + time, 0) / performance.loadTimes.length;
    }

    // Calculate page-specific averages
    Object.keys(performance.pageStats).forEach(page => {
      const stats = performance.pageStats[page];
      if (stats.loadTimes.length > 0) {
        stats.averageLoadTime = 
          stats.loadTimes.reduce((sum, time) => sum + time, 0) / stats.loadTimes.length;
      }
    });

    return performance;
  }

  // Get SEO engagement metrics
  async getSEOEngagementMetrics(timeframe = '7d') {
    await this.init();
    
    const seoCollection = this.db.collection('seoMetrics');
    
    const query = {
      metricType: 'seo-event',
      timestamp: { $gte: this.getTimeFilter(timeframe) }
    };

    const metrics = await seoCollection.find(query).toArray();
    
    const engagement = {
      internalLinkClicks: 0,
      searchQueries: [],
      pageViews: 0,
      bounceRate: 0,
      topSearchQueries: [],
      linkClickDistribution: {}
    };

    metrics.forEach(metric => {
      if (metric.metricName === 'internal_link_click') {
        engagement.internalLinkClicks++;
        
        const link = metric.additionalData?.link || 'unknown';
        engagement.linkClickDistribution[link] = (engagement.linkClickDistribution[link] || 0) + 1;
      } else if (metric.metricName === 'search') {
        const query = metric.additionalData?.search_term || 'unknown';
        engagement.searchQueries.push({
          query,
          timestamp: metric.timestamp
        });
      } else if (metric.metricName === 'page_view') {
        engagement.pageViews++;
      }
    });

    // Get top search queries
    const queryCounts = {};
    engagement.searchQueries.forEach(item => {
      queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
    });
    
    engagement.topSearchQueries = Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return engagement;
  }

  // Get SEO recommendations
  async getSEORecommendations(timeframe = '7d') {
    const [coreWebVitals, pagePerformance, engagement] = await Promise.all([
      this.getCoreWebVitalsSummary(timeframe),
      this.getPagePerformanceMetrics(timeframe),
      this.getSEOEngagementMetrics(timeframe)
    ]);

    const recommendations = [];

    // Core Web Vitals recommendations
    Object.keys(coreWebVitals).forEach(metric => {
      const data = coreWebVitals[metric];
      if (data.values.length > 0) {
        const goodPercentage = (data.good / data.values.length) * 100;
        const poorPercentage = (data.poor / data.values.length) * 100;

        if (goodPercentage < 75) {
          recommendations.push({
            type: 'performance',
            metric,
            priority: poorPercentage > 25 ? 'high' : 'medium',
            title: `${metric} Performance Issue`,
            description: `Only ${goodPercentage.toFixed(1)}% of ${metric} measurements are in the "good" range.`,
            action: this.getPerformanceRecommendation(metric),
            impact: 'User experience and search rankings'
          });
        }
      }
    });

    // Page load time recommendations
    if (pagePerformance.averageLoadTime > 3000) {
      recommendations.push({
        type: 'performance',
        metric: 'page_load_time',
        priority: 'high',
        title: 'Slow Page Load Times',
        description: `Average page load time is ${Math.round(pagePerformance.averageLoadTime)}ms, which is above the recommended 3 seconds.`,
        action: 'Optimize images, enable compression, minimize JavaScript bundles, and use a CDN',
        impact: 'User experience and search rankings'
      });
    }

    // Engagement recommendations
    if (engagement.internalLinkClicks < 10) {
      recommendations.push({
        type: 'engagement',
        metric: 'internal_linking',
        priority: 'low',
        title: 'Low Internal Link Engagement',
        description: 'Low internal link engagement detected. Consider improving internal linking strategy.',
        action: 'Add more relevant internal links, improve link placement, and use descriptive anchor text',
        impact: 'User engagement and page authority distribution'
      });
    }

    // Search query insights
    if (engagement.topSearchQueries.length > 0) {
      const topQuery = engagement.topSearchQueries[0];
      recommendations.push({
        type: 'content',
        metric: 'search_queries',
        priority: 'medium',
        title: 'Popular Search Query',
        description: `"${topQuery.query}" is your most searched term with ${topQuery.count} searches.`,
        action: 'Create more content around this topic and optimize existing content for this query',
        impact: 'Content strategy and user satisfaction'
      });
    }

    return {
      recommendations,
      summary: {
        total: recommendations.length,
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      }
    };
  }

  // Helper function to calculate comprehensive SEO analytics
  calculateSEOAnalytics(metrics) {
    const coreWebVitals = {
      LCP: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      FID: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      CLS: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      FCP: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 },
      TTFB: { values: [], average: 0, good: 0, needsImprovement: 0, poor: 0 }
    };

    const pagePerformance = {
      loadTimes: [],
      imageLoadTimes: [],
      averageLoadTime: 0,
      pageStats: {}
    };

    const seoEvents = {
      internalLinkClicks: 0,
      searchQueries: [],
      pageViews: 0,
      bounceRate: 0
    };

    metrics.forEach(metric => {
      // Core Web Vitals
      if (metric.metricType === 'core-web-vitals' && coreWebVitals[metric.metricName]) {
        const metricName = metric.metricName;
        coreWebVitals[metricName].values.push(metric.value);
        
        const category = this.categorizeWebVital(metricName, metric.value);
        coreWebVitals[metricName][category]++;
      }

      // Page Performance
      if (metric.metricType === 'page-performance') {
        if (metric.metricName === 'page_load_time') {
          pagePerformance.loadTimes.push(metric.value);
          
          if (!pagePerformance.pageStats[metric.page]) {
            pagePerformance.pageStats[metric.page] = { loadTimes: [] };
          }
          pagePerformance.pageStats[metric.page].loadTimes.push(metric.value);
        } else if (metric.metricName === 'image_load') {
          pagePerformance.imageLoadTimes.push(metric.value);
        }
      }

      // SEO Events
      if (metric.metricType === 'seo-event') {
        if (metric.metricName === 'internal_link_click') {
          seoEvents.internalLinkClicks++;
        } else if (metric.metricName === 'search') {
          seoEvents.searchQueries.push({
            query: metric.additionalData?.search_term || 'unknown',
            timestamp: metric.timestamp
          });
        } else if (metric.metricName === 'page_view') {
          seoEvents.pageViews++;
        }
      }
    });

    // Calculate averages
    Object.keys(coreWebVitals).forEach(metric => {
      const values = coreWebVitals[metric].values;
      if (values.length > 0) {
        coreWebVitals[metric].average = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    if (pagePerformance.loadTimes.length > 0) {
      pagePerformance.averageLoadTime = 
        pagePerformance.loadTimes.reduce((sum, time) => sum + time, 0) / pagePerformance.loadTimes.length;
    }

    // Calculate page-specific averages
    Object.keys(pagePerformance.pageStats).forEach(page => {
      const stats = pagePerformance.pageStats[page];
      if (stats.loadTimes.length > 0) {
        stats.averageLoadTime = 
          stats.loadTimes.reduce((sum, time) => sum + time, 0) / stats.loadTimes.length;
      }
    });

    return {
      coreWebVitals,
      pagePerformance,
      seoEvents,
      totalMetrics: metrics.length,
      uniquePages: Object.keys(pagePerformance.pageStats).length
    };
  }

  // Helper function to generate SEO insights
  generateSEOInsights(analytics) {
    const insights = [];

    // Core Web Vitals insights
    Object.keys(analytics.coreWebVitals).forEach(metric => {
      const data = analytics.coreWebVitals[metric];
      if (data.values.length > 0) {
        const goodPercentage = (data.good / data.values.length) * 100;
        const poorPercentage = (data.poor / data.values.length) * 100;

        if (goodPercentage < 75) {
          insights.push({
            type: 'warning',
            metric,
            message: `${metric} performance needs attention. Only ${goodPercentage.toFixed(1)}% of measurements are in the "good" range.`,
            priority: poorPercentage > 25 ? 'high' : 'medium',
            value: data.average,
            threshold: this.getWebVitalThreshold(metric)
          });
        } else {
          insights.push({
            type: 'success',
            metric,
            message: `${metric} performance is good. ${goodPercentage.toFixed(1)}% of measurements are in the "good" range.`,
            priority: 'low',
            value: data.average
          });
        }
      }
    });

    // Page load time insights
    if (analytics.pagePerformance.averageLoadTime > 0) {
      if (analytics.pagePerformance.averageLoadTime > 3000) {
        insights.push({
          type: 'warning',
          metric: 'page_load_time',
          message: `Average page load time is ${Math.round(analytics.pagePerformance.averageLoadTime)}ms, which is above the recommended 3 seconds.`,
          priority: 'high',
          value: analytics.pagePerformance.averageLoadTime,
          threshold: 3000
        });
      } else {
        insights.push({
          type: 'success',
          metric: 'page_load_time',
          message: `Average page load time is ${Math.round(analytics.pagePerformance.averageLoadTime)}ms, which is within the recommended range.`,
          priority: 'low',
          value: analytics.pagePerformance.averageLoadTime
        });
      }
    }

    return {
      insights,
      summary: {
        total: insights.length,
        warnings: insights.filter(i => i.type === 'warning').length,
        successes: insights.filter(i => i.type === 'success').length,
        high: insights.filter(i => i.priority === 'high').length,
        medium: insights.filter(i => i.priority === 'medium').length,
        low: insights.filter(i => i.priority === 'low').length
      }
    };
  }

  // Helper function to categorize web vitals
  categorizeWebVital(metricName, value) {
    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needsImprovement';
    return 'poor';
  }

  // Helper function to get web vital thresholds
  getWebVitalThreshold(metricName) {
    const thresholds = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      FCP: 1800,
      TTFB: 800
    };
    return thresholds[metricName] || 0;
  }

  // Helper function to get performance recommendations
  getPerformanceRecommendation(metric) {
    const recommendations = {
      LCP: 'Optimize images, use efficient image formats, implement lazy loading, and optimize server response times',
      FID: 'Reduce JavaScript execution time, optimize third-party scripts, and use web workers for heavy computations',
      CLS: 'Set explicit dimensions for images and videos, avoid dynamic content insertion, and use CSS transforms instead of changing layout properties',
      FCP: 'Optimize critical rendering path, minimize render-blocking resources, and inline critical CSS',
      TTFB: 'Improve server response time, use CDN, optimize database queries, and enable caching'
    };

    return recommendations[metric] || 'General performance optimization needed';
  }

  // Helper function to get time filter
  getTimeFilter(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return null;
    }
  }
}

module.exports = new SEOService();
