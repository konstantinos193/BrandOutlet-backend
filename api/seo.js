const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { getTrackingData } = require('../utils/geolocation');
const seoService = require('../services/seoService');
const { connectDB } = require('../config/database');
const router = express.Router();

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
};

// Validation schema for SEO metrics
const seoMetricSchema = Joi.object({
  metricType: Joi.string().valid('core-web-vitals', 'page-performance', 'seo-event').required(),
  metricName: Joi.string().required(),
  value: Joi.number().required(),
  page: Joi.string().required(),
  path: Joi.string().required(),
  sessionId: Joi.string().optional(),
  timestamp: Joi.date().default(Date.now),
  additionalData: Joi.object().optional()
});

// POST /api/seo/metrics - Track SEO metrics
router.post('/metrics', async (req, res) => {
  try {
    console.log('📊 SEO metrics tracking request received');
    
    // Add null checks for req.body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }
    
    const { error, value } = seoMetricSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    // Get tracking data
    let trackingData;
    try {
      trackingData = getTrackingData(req);
    } catch (trackingError) {
      console.error('Error getting tracking data:', trackingError);
      trackingData = {
        ip: req.ip || '127.0.0.1',
        location: { country: 'Unknown', region: 'Unknown', city: 'Unknown' },
        device: { browser: 'Unknown', os: 'Unknown', isMobile: false }
      };
    }

    // Add unique ID and tracking data
    const seoMetricData = {
      id: uuidv4(),
      ...value,
      timestamp: new Date(),
      ipAddress: trackingData.ip,
      userAgent: req.get('User-Agent'),
      location: trackingData.location,
      device: trackingData.device
    };

    // Store the metric in MongoDB
    await initializeDB();
    const seoCollection = db.collection('seoMetrics');
    await seoCollection.insertOne(seoMetricData);

    // Update analytics (now calculated from database)
    await updateSEOAnalytics(seoMetricData);

    console.log('✅ SEO metric tracked successfully:', seoMetricData.id);

    res.status(201).json({
      success: true,
      message: 'SEO metric tracked successfully',
      data: {
        id: seoMetricData.id,
        timestamp: seoMetricData.timestamp
      }
    });

  } catch (error) {
    console.error('Error tracking SEO metric:', error);
    res.status(500).json({
      error: 'Failed to track SEO metric',
      message: error.message
    });
  }
});

// POST /api/seo/batch-metrics - Track multiple SEO metrics at once
router.post('/batch-metrics', async (req, res) => {
  try {
    // Add null checks for req.body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    const { metrics } = req.body;
    
    if (!Array.isArray(metrics)) {
      return res.status(400).json({
        error: 'Metrics must be an array'
      });
    }

    const results = [];
    const errors = [];

    for (const metric of metrics) {
      const { error, value } = seoMetricSchema.validate(metric);
      if (error) {
        errors.push({
          metric,
          error: error.details[0].message
        });
        continue;
      }

      // Get tracking data
      let trackingData;
      try {
        trackingData = getTrackingData(req);
      } catch (trackingError) {
        trackingData = {
          ip: req.ip || '127.0.0.1',
          location: { country: 'Unknown', region: 'Unknown', city: 'Unknown' },
          device: { browser: 'Unknown', os: 'Unknown', isMobile: false }
        };
      }

      const seoMetricData = {
        id: uuidv4(),
        ...value,
        timestamp: new Date(),
        ipAddress: trackingData.ip,
        userAgent: req.get('User-Agent'),
        location: trackingData.location,
        device: trackingData.device
      };

      seoMetrics.push(seoMetricData);
      updateSEOAnalytics(seoMetricData);
      results.push(seoMetricData);
    }

    res.status(201).json({
      success: true,
      message: `Processed ${results.length} metrics successfully`,
      data: {
        processed: results.length,
        errors: errors.length,
        results: results.map(r => ({ id: r.id, timestamp: r.timestamp }))
      }
    });

  } catch (error) {
    console.error('Error processing batch SEO metrics:', error);
    res.status(500).json({
      error: 'Failed to process batch SEO metrics',
      message: error.message
    });
  }
});

// GET /api/seo/analytics - Get SEO analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d', page } = req.query;
    
    const analytics = await seoService.getSEOAnalytics(timeframe, page);

    res.json({
      success: true,
      data: {
        ...analytics,
        timeframe,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching SEO analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch SEO analytics',
      message: error.message
    });
  }
});

// GET /api/seo/insights - Get SEO insights and recommendations
router.get('/insights', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const insights = await seoService.getSEOInsights(timeframe);
    
    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error generating SEO insights:', error);
    res.status(500).json({
      error: 'Failed to generate SEO insights',
      message: error.message
    });
  }
});

// GET /api/seo/recommendations - Get SEO recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const recommendations = await seoService.getSEORecommendations(timeframe);
    
    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error generating SEO recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate SEO recommendations',
      message: error.message
    });
  }
});

// GET /api/seo/core-web-vitals - Get Core Web Vitals summary
router.get('/core-web-vitals', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const coreWebVitals = await seoService.getCoreWebVitalsSummary(timeframe);
    
    res.json({
      success: true,
      data: coreWebVitals
    });

  } catch (error) {
    console.error('Error fetching Core Web Vitals:', error);
    res.status(500).json({
      error: 'Failed to fetch Core Web Vitals',
      message: error.message
    });
  }
});

// GET /api/seo/performance - Get page performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const performance = await seoService.getPagePerformanceMetrics(timeframe);
    
    res.json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      message: error.message
    });
  }
});

// GET /api/seo/engagement - Get SEO engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const engagement = await seoService.getSEOEngagementMetrics(timeframe);
    
    res.json({
      success: true,
      data: engagement
    });

  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch engagement metrics',
      message: error.message
    });
  }
});

// GET /api/seo/health - Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SEO tracking service is healthy',
    timestamp: new Date().toISOString(),
    stats: {
      totalMetrics: seoMetrics.length,
      lastUpdated: seoAnalytics.lastUpdated
    }
  });
});

// Helper function to update SEO analytics
async function updateSEOAnalytics(metricData) {
  // For now, we'll calculate analytics on-demand from the database
  // This is more efficient than updating in-memory objects
  // The analytics will be calculated when requested via the /analytics endpoint
  console.log('SEO metric added to database, analytics will be calculated on-demand');
}

// Helper function to categorize web vitals
function categorizeWebVital(metricName, value) {
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

// Helper function to calculate SEO analytics
function calculateSEOAnalytics(metrics) {
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
    averageLoadTime: 0
  };

  const seoEvents = {
    internalLinkClicks: 0,
    searchQueries: [],
    pageViews: 0
  };

  const pageStats = {};

  metrics.forEach(metric => {
    // Core Web Vitals
    if (metric.metricType === 'core-web-vitals' && coreWebVitals[metric.metricName]) {
      const metricName = metric.metricName;
      coreWebVitals[metricName].values.push(metric.value);
      
      const category = categorizeWebVital(metricName, metric.value);
      coreWebVitals[metricName][category]++;
    }

    // Page Performance
    if (metric.metricType === 'page-performance') {
      if (metric.metricName === 'page_load_time') {
        pagePerformance.loadTimes.push(metric.value);
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

    // Page-specific stats
    if (!pageStats[metric.page]) {
      pageStats[metric.page] = {
        views: 0,
        metrics: 0,
        avgLoadTime: 0,
        loadTimes: []
      };
    }
    pageStats[metric.page].metrics++;
    if (metric.metricName === 'page_load_time') {
      pageStats[metric.page].loadTimes.push(metric.value);
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
  Object.keys(pageStats).forEach(page => {
    const stats = pageStats[page];
    if (stats.loadTimes.length > 0) {
      stats.avgLoadTime = stats.loadTimes.reduce((sum, time) => sum + time, 0) / stats.loadTimes.length;
    }
  });

  return {
    coreWebVitals,
    pagePerformance,
    seoEvents,
    pageStats,
    totalMetrics: metrics.length,
    uniquePages: Object.keys(pageStats).length
  };
}

// Helper function to generate SEO insights
function generateSEOInsights() {
  const insights = [];
  const recommendations = [];

  // Core Web Vitals insights
  Object.keys(seoAnalytics.coreWebVitals).forEach(metric => {
    const data = seoAnalytics.coreWebVitals[metric];
    if (data.values.length > 0) {
      const goodPercentage = (data.good / data.values.length) * 100;
      const poorPercentage = (data.poor / data.values.length) * 100;

      if (goodPercentage < 75) {
        insights.push({
          type: 'warning',
          metric,
          message: `${metric} performance needs attention. Only ${goodPercentage.toFixed(1)}% of measurements are in the "good" range.`,
          priority: poorPercentage > 25 ? 'high' : 'medium'
        });

        recommendations.push({
          type: 'performance',
          metric,
          action: getPerformanceRecommendation(metric),
          priority: poorPercentage > 25 ? 'high' : 'medium'
        });
      }
    }
  });

  // Page load time insights
  if (seoAnalytics.pagePerformance.averageLoadTime > 3000) {
    insights.push({
      type: 'warning',
      metric: 'page_load_time',
      message: `Average page load time is ${Math.round(seoAnalytics.pagePerformance.averageLoadTime)}ms, which is above the recommended 3 seconds.`,
      priority: 'high'
    });

    recommendations.push({
      type: 'performance',
      metric: 'page_load_time',
      action: 'Optimize images, enable compression, and minimize JavaScript bundles',
      priority: 'high'
    });
  }

  // SEO engagement insights
  if (seoAnalytics.seoEvents.internalLinkClicks < 10) {
    insights.push({
      type: 'info',
      metric: 'engagement',
      message: 'Low internal link engagement detected. Consider improving internal linking strategy.',
      priority: 'low'
    });
  }

  return {
    insights,
    recommendations,
    summary: {
      totalInsights: insights.length,
      highPriority: insights.filter(i => i.priority === 'high').length,
      mediumPriority: insights.filter(i => i.priority === 'medium').length,
      lowPriority: insights.filter(i => i.priority === 'low').length
    }
  };
}

// Helper function to get performance recommendations
function getPerformanceRecommendation(metric) {
  const recommendations = {
    LCP: 'Optimize images, use efficient image formats, implement lazy loading',
    FID: 'Reduce JavaScript execution time, optimize third-party scripts',
    CLS: 'Set explicit dimensions for images and videos, avoid dynamic content insertion',
    FCP: 'Optimize critical rendering path, minimize render-blocking resources',
    TTFB: 'Improve server response time, use CDN, optimize database queries'
  };

  return recommendations[metric] || 'General performance optimization needed';
}

// Helper function to get time filter
function getTimeFilter(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

module.exports = router;
