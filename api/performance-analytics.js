const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const cacheService = require('../services/cacheService');

// Performance metrics collection
const performanceMetrics = {
  lcp: [],
  fid: [],
  cls: [],
  fcp: [],
  ttfb: [],
  pageLoadTime: [],
  resourceLoadTime: [],
  imageLoadTime: [],
  bundleSize: [],
  sessionDuration: [],
  pageViews: []
};

// Performance thresholds
const thresholds = {
  lcp: 2500, // 2.5s
  fid: 100,  // 100ms
  cls: 0.1,  // 0.1
  fcp: 1800, // 1.8s
  ttfb: 600, // 600ms
  pageLoadTime: 3000, // 3s
  resourceLoadTime: 1000, // 1s
  imageLoadTime: 500, // 500ms
};

// POST /api/performance-analytics/collect - Collect performance metrics
router.post('/collect', async (req, res) => {
  try {
    const metrics = req.body;
    
    // Validate required fields
    if (!metrics.timestamp || !metrics.url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: timestamp, url'
      });
    }

    // Store metrics in memory (in production, store in database)
    Object.keys(metrics).forEach(key => {
      if (performanceMetrics[key] && typeof metrics[key] === 'number') {
        performanceMetrics[key].push({
          value: metrics[key],
          timestamp: metrics.timestamp,
          url: metrics.url,
          userAgent: metrics.userAgent
        });
        
        // Keep only last 1000 entries per metric
        if (performanceMetrics[key].length > 1000) {
          performanceMetrics[key] = performanceMetrics[key].slice(-1000);
        }
      }
    });

    // Check for performance issues
    const issues = checkPerformanceIssues(metrics);
    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues);
    }

    res.json({
      success: true,
      message: 'Performance metrics collected successfully',
      issues: issues
    });

  } catch (error) {
    console.error('Error collecting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect performance metrics',
      message: error.message
    });
  }
});

// POST /api/performance-analytics/alert - Handle performance alerts
router.post('/alert', async (req, res) => {
  try {
    const { metric, value, threshold, url, timestamp } = req.body;
    
    console.warn(`🚨 Performance Alert: ${metric} is ${value}ms (threshold: ${threshold}ms) at ${url}`);
    
    // Store alert in database (optional)
    // await storePerformanceAlert({ metric, value, threshold, url, timestamp });
    
    res.json({
      success: true,
      message: 'Performance alert recorded'
    });

  } catch (error) {
    console.error('Error handling performance alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle performance alert',
      message: error.message
    });
  }
});

// GET /api/performance-analytics/dashboard - Get performance dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching performance dashboard data');

    const result = await cacheService.cacheAnalytics({ 
      type: 'performance-dashboard' 
    }, async () => {
      console.log('📦 Cache MISS - Calculating performance metrics');

      const dashboard = {
        overview: calculateOverviewMetrics(),
        coreWebVitals: calculateCoreWebVitals(),
        customMetrics: calculateCustomMetrics(),
        trends: calculateTrends(),
        recommendations: generateRecommendations(),
        thresholds: thresholds,
        lastUpdated: new Date().toISOString()
      };

      return dashboard;
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching performance dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance dashboard',
      message: error.message
    });
  }
});

// GET /api/performance-analytics/metrics/:metric - Get specific metric data
router.get('/metrics/:metric', async (req, res) => {
  try {
    const { metric } = req.params;
    const { period = '24h', limit = 100 } = req.query;

    if (!performanceMetrics[metric]) {
      return res.status(404).json({
        success: false,
        error: 'Metric not found'
      });
    }

    const data = performanceMetrics[metric]
      .filter(entry => {
        const entryTime = new Date(entry.timestamp);
        const now = new Date();
        const hours = period === '24h' ? 24 : period === '7d' ? 168 : 1;
        return (now - entryTime) <= (hours * 60 * 60 * 1000);
      })
      .slice(-parseInt(limit));

    const stats = calculateMetricStats(data);

    res.json({
      success: true,
      data: {
        metric,
        values: data,
        stats,
        threshold: thresholds[metric] || null
      }
    });

  } catch (error) {
    console.error('Error fetching metric data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metric data',
      message: error.message
    });
  }
});

// Helper functions
function checkPerformanceIssues(metrics) {
  const issues = [];
  
  Object.keys(thresholds).forEach(metric => {
    if (metrics[metric] && metrics[metric] > thresholds[metric]) {
      issues.push({
        metric,
        value: metrics[metric],
        threshold: thresholds[metric],
        severity: getSeverity(metric, metrics[metric], thresholds[metric])
      });
    }
  });
  
  return issues;
}

function getSeverity(metric, value, threshold) {
  const ratio = value / threshold;
  if (ratio > 2) return 'critical';
  if (ratio > 1.5) return 'high';
  if (ratio > 1.2) return 'medium';
  return 'low';
}

function calculateOverviewMetrics() {
  const totalEntries = Object.values(performanceMetrics).reduce((sum, arr) => sum + arr.length, 0);
  const issues = Object.keys(thresholds).reduce((sum, metric) => {
    const values = performanceMetrics[metric] || [];
    const threshold = thresholds[metric];
    return sum + values.filter(v => v.value > threshold).length;
  }, 0);
  
  return {
    totalMetrics: totalEntries,
    performanceIssues: issues,
    issueRate: totalEntries > 0 ? (issues / totalEntries) * 100 : 0,
    averageScore: calculatePerformanceScore()
  };
}

function calculateCoreWebVitals() {
  const vitals = {};
  
  ['lcp', 'fid', 'cls', 'fcp', 'ttfb'].forEach(metric => {
    const values = performanceMetrics[metric] || [];
    if (values.length > 0) {
      vitals[metric] = {
        average: values.reduce((sum, v) => sum + v.value, 0) / values.length,
        median: calculateMedian(values.map(v => v.value)),
        p95: calculatePercentile(values.map(v => v.value), 95),
        p99: calculatePercentile(values.map(v => v.value), 99),
        threshold: thresholds[metric],
        good: values.filter(v => v.value <= thresholds[metric]).length,
        needsImprovement: values.filter(v => v.value > thresholds[metric] && v.value <= thresholds[metric] * 1.5).length,
        poor: values.filter(v => v.value > thresholds[metric] * 1.5).length
      };
    }
  });
  
  return vitals;
}

function calculateCustomMetrics() {
  const custom = {};
  
  ['pageLoadTime', 'resourceLoadTime', 'imageLoadTime', 'bundleSize', 'sessionDuration', 'pageViews'].forEach(metric => {
    const values = performanceMetrics[metric] || [];
    if (values.length > 0) {
      custom[metric] = {
        average: values.reduce((sum, v) => sum + v.value, 0) / values.length,
        median: calculateMedian(values.map(v => v.value)),
        min: Math.min(...values.map(v => v.value)),
        max: Math.max(...values.map(v => v.value)),
        count: values.length
      };
    }
  });
  
  return custom;
}

function calculateTrends() {
  const trends = {};
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  Object.keys(performanceMetrics).forEach(metric => {
    const values = performanceMetrics[metric] || [];
    const recent = values.filter(v => v.timestamp > oneDayAgo);
    const older = values.filter(v => v.timestamp <= oneDayAgo);
    
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length;
      
      trends[metric] = {
        change: ((recentAvg - olderAvg) / olderAvg) * 100,
        direction: recentAvg > olderAvg ? 'worse' : 'better'
      };
    }
  });
  
  return trends;
}

function generateRecommendations() {
  const recommendations = [];
  
  // LCP recommendations
  if (performanceMetrics.lcp && performanceMetrics.lcp.length > 0) {
    const avgLCP = performanceMetrics.lcp.reduce((sum, v) => sum + v.value, 0) / performanceMetrics.lcp.length;
    if (avgLCP > thresholds.lcp) {
      recommendations.push({
        metric: 'LCP',
        issue: 'Large Contentful Paint is too slow',
        recommendation: 'Optimize images, use WebP format, implement lazy loading, reduce server response time'
      });
    }
  }
  
  // CLS recommendations
  if (performanceMetrics.cls && performanceMetrics.cls.length > 0) {
    const avgCLS = performanceMetrics.cls.reduce((sum, v) => sum + v.value, 0) / performanceMetrics.cls.length;
    if (avgCLS > thresholds.cls) {
      recommendations.push({
        metric: 'CLS',
        issue: 'Cumulative Layout Shift is too high',
        recommendation: 'Add size attributes to images, avoid inserting content above existing content, use transform animations'
      });
    }
  }
  
  // Bundle size recommendations
  if (performanceMetrics.bundleSize && performanceMetrics.bundleSize.length > 0) {
    const avgBundleSize = performanceMetrics.bundleSize.reduce((sum, v) => sum + v.value, 0) / performanceMetrics.bundleSize.length;
    if (avgBundleSize > 500) { // 500KB threshold
      recommendations.push({
        metric: 'Bundle Size',
        issue: 'JavaScript bundle is too large',
        recommendation: 'Implement code splitting, remove unused code, use dynamic imports, optimize dependencies'
      });
    }
  }
  
  return recommendations;
}

function calculatePerformanceScore() {
  let score = 100;
  let totalWeight = 0;
  
  Object.keys(thresholds).forEach(metric => {
    const values = performanceMetrics[metric] || [];
    if (values.length > 0) {
      const avg = values.reduce((sum, v) => sum + v.value, 0) / values.length;
      const threshold = thresholds[metric];
      const ratio = avg / threshold;
      
      if (ratio <= 1) {
        score += 10; // Good performance
      } else if (ratio <= 1.5) {
        score += 5; // Needs improvement
      } else {
        score -= 10; // Poor performance
      }
      
      totalWeight += 10;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

function calculateMetricStats(data) {
  if (data.length === 0) return null;
  
  const values = data.map(d => d.value);
  return {
    count: data.length,
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
    median: calculateMedian(values),
    min: Math.min(...values),
    max: Math.max(...values),
    p95: calculatePercentile(values, 95),
    p99: calculatePercentile(values, 99)
  };
}

function calculateMedian(values) {
  const sorted = values.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculatePercentile(values, percentile) {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

module.exports = router;
